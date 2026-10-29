import tempfile
import unittest
from pathlib import Path

from app import create_app
from backend import curriculum

FIRST_MODULE, SECOND_MODULE = curriculum.module_ids()[:2]


class ApiTestCase(unittest.TestCase):
    def setUp(self):
        directory = tempfile.TemporaryDirectory()
        self.addCleanup(directory.cleanup)
        root = Path(directory.name)

        self.app = create_app(
            {
                "TESTING": True,
                "DATABASE_PATH": root / "test.db",
                "SECRET_KEY_PATH": root / "secret.key",
            }
        )
        self.client = self.app.test_client()

    def get_progress(self, client=None):
        return (client or self.client).get("/api/progress").get_json()

    def complete_lesson(self, module_id=FIRST_MODULE):
        return self.client.post(f"/api/modules/{module_id}/lesson-complete")

    def start_quiz(self, module_id=FIRST_MODULE):
        self.complete_lesson(module_id)
        response = self.client.post(f"/api/modules/{module_id}/quiz")
        self.assertEqual(response.status_code, 201)
        return response.get_json()

    def post_answer(self, attempt, question, choice):
        return self.client.post(
            f"/api/attempts/{attempt['attempt_id']}/answer",
            json={"question_id": question["id"], "choice": choice},
        )

    def correct_text(self, module_id, question):
        source = next(
            item for item in curriculum.load_questions(module_id) if item["id"] == question["id"]
        )
        return source["options"][source["answer"]]

    def choose(self, module_id, question, want_correct):
        correct = self.correct_text(module_id, question)

        return next(
            index
            for index, text in enumerate(question["options"])
            if (text == correct) == want_correct
        )

    def answer_all(self, attempt, want_correct, module_id=FIRST_MODULE):
        for question in attempt["questions"]:
            choice = self.choose(module_id, question, want_correct)
            self.assertEqual(self.post_answer(attempt, question, choice).status_code, 200)

    def finish(self, attempt):
        return self.client.post(f"/api/attempts/{attempt['attempt_id']}/finish")


class ProgressTests(ApiTestCase):
    def test_new_learner_can_only_open_the_first_module(self):
        summary = self.get_progress()
        statuses = [module["status"] for module in summary["modules"]]

        self.assertEqual(statuses, ["available"] + ["locked"] * 5)
        self.assertFalse(summary["hunt_unlocked"])
        self.assertFalse(summary["final_exam"]["unlocked"])

    def test_progress_is_separate_for_each_learner(self):
        attempt = self.start_quiz()
        self.answer_all(attempt, want_correct=True)
        self.finish(attempt)

        stranger = self.app.test_client()
        statuses = [module["status"] for module in self.get_progress(stranger)["modules"]]

        self.assertEqual(statuses[1], "locked")

    def test_reset_clears_progress(self):
        attempt = self.start_quiz()
        self.answer_all(attempt, want_correct=True)
        self.finish(attempt)

        summary = self.client.post("/api/reset").get_json()

        self.assertEqual(summary["modules"][0]["status"], "available")
        self.assertEqual(summary["modules"][1]["status"], "locked")


class AccessTests(ApiTestCase):
    def test_locked_module_is_refused(self):
        self.assertEqual(self.client.get(f"/api/modules/{SECOND_MODULE}").status_code, 403)
        self.assertEqual(self.client.post(f"/api/modules/{SECOND_MODULE}/quiz").status_code, 403)

    def test_unknown_module_is_not_found(self):
        self.assertEqual(self.client.get("/api/modules/nope").status_code, 404)

    def test_quiz_requires_the_lesson_first(self):
        response = self.client.post(f"/api/modules/{FIRST_MODULE}/quiz")

        self.assertEqual(response.status_code, 409)


class QuizTests(ApiTestCase):
    def test_questions_are_sent_without_answers(self):
        attempt = self.start_quiz()

        for question in attempt["questions"]:
            self.assertEqual(set(question), {"id", "kind", "prompt", "options"})

    def test_feedback_points_to_the_correct_option(self):
        attempt = self.start_quiz()
        question = attempt["questions"][0]
        wrong = self.choose(FIRST_MODULE, question, want_correct=False)

        feedback = self.post_answer(attempt, question, wrong).get_json()

        self.assertFalse(feedback["is_correct"])
        self.assertEqual(
            question["options"][feedback["correct_index"]],
            self.correct_text(FIRST_MODULE, question),
        )

    def test_cannot_finish_before_answering_everything(self):
        attempt = self.start_quiz()

        self.assertEqual(self.finish(attempt).status_code, 409)

    def test_cannot_answer_the_same_question_twice(self):
        attempt = self.start_quiz()
        question = attempt["questions"][0]

        self.assertEqual(self.post_answer(attempt, question, 0).status_code, 200)
        self.assertEqual(self.post_answer(attempt, question, 1).status_code, 409)

    def test_question_from_another_attempt_is_rejected(self):
        attempt = self.start_quiz()

        response = self.post_answer(attempt, {"id": "does-not-exist"}, 0)

        self.assertEqual(response.status_code, 404)

    def test_invalid_choices_are_rejected(self):
        attempt = self.start_quiz()
        question = attempt["questions"][0]

        for value in (99, -1, "1", True, None, 1.0):
            with self.subTest(choice=value):
                self.assertEqual(self.post_answer(attempt, question, value).status_code, 400)

    def test_another_learner_cannot_use_my_attempt(self):
        attempt = self.start_quiz()
        question = attempt["questions"][0]
        stranger = self.app.test_client()

        response = stranger.post(
            f"/api/attempts/{attempt['attempt_id']}/answer",
            json={"question_id": question["id"], "choice": 0},
        )

        self.assertEqual(response.status_code, 404)


class UnlockTests(ApiTestCase):
    def test_passing_unlocks_the_next_module(self):
        attempt = self.start_quiz()
        self.answer_all(attempt, want_correct=True)

        body = self.finish(attempt).get_json()
        modules = body["progress"]["modules"]

        self.assertTrue(body["result"]["passed"])
        self.assertEqual(body["result"]["next_module_id"], SECOND_MODULE)
        self.assertEqual(modules[0]["status"], "completed")
        self.assertEqual(modules[1]["status"], "available")

    def test_failing_keeps_the_next_module_locked(self):
        attempt = self.start_quiz()
        self.answer_all(attempt, want_correct=False)

        body = self.finish(attempt).get_json()
        modules = body["progress"]["modules"]

        self.assertFalse(body["result"]["passed"])
        self.assertIsNone(body["result"]["next_module_id"])
        self.assertEqual(modules[0]["status"], "in_progress")
        self.assertEqual(modules[1]["status"], "locked")

    def test_retry_deals_questions_not_seen_before(self):
        bank_ids = {item["id"] for item in curriculum.load_questions(FIRST_MODULE)}

        first = self.start_quiz()
        first_ids = {question["id"] for question in first["questions"]}
        self.answer_all(first, want_correct=False)
        self.finish(first)

        second_ids = {question["id"] for question in self.start_quiz()["questions"]}

        self.assertTrue((bank_ids - first_ids) <= second_ids)


if __name__ == "__main__":
    unittest.main()