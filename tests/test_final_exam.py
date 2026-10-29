import tempfile
import unittest
from pathlib import Path

from app import create_app
from backend import curriculum
from backend.config import FINAL_EXAM_ID, FINAL_EXAM_QUESTIONS

FINAL_EXAM_URL = "/api/final-exam/quiz"


class FinalExamTests(unittest.TestCase):
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

    def answer_all(self, attempt, module_id, want_correct):
        sources = {item["id"]: item for item in curriculum.load_questions(module_id)}

        for question in attempt["questions"]:
            source = sources[question["id"]]
            correct = source["options"][source["answer"]]
            choice = next(
                index
                for index, text in enumerate(question["options"])
                if (text == correct) == want_correct
            )
            response = self.client.post(
                f"/api/attempts/{attempt['attempt_id']}/answer",
                json={"question_id": question["id"], "choice": choice},
            )
            self.assertEqual(response.status_code, 200)

    def finish(self, attempt):
        return self.client.post(f"/api/attempts/{attempt['attempt_id']}/finish").get_json()

    def pass_module(self, module_id):
        self.client.post(f"/api/modules/{module_id}/lesson-complete")
        attempt = self.client.post(f"/api/modules/{module_id}/quiz").get_json()
        self.answer_all(attempt, module_id, want_correct=True)

        return self.finish(attempt)

    def pass_every_module(self):
        for module_id in curriculum.module_ids():
            self.assertTrue(self.pass_module(module_id)["result"]["passed"])

    def start_final_exam(self):
        response = self.client.post(FINAL_EXAM_URL)
        self.assertEqual(response.status_code, 201)

        return response.get_json()

    def test_final_exam_stays_locked_until_every_module_is_passed(self):
        self.assertEqual(self.client.post(FINAL_EXAM_URL).status_code, 403)

        self.pass_module(curriculum.module_ids()[0])

        self.assertEqual(self.client.post(FINAL_EXAM_URL).status_code, 403)

    def test_final_exam_unlocks_after_every_module(self):
        self.pass_every_module()

        summary = self.client.get("/api/progress").get_json()
        attempt = self.start_final_exam()

        self.assertTrue(summary["final_exam"]["unlocked"])
        self.assertEqual(len(attempt["questions"]), FINAL_EXAM_QUESTIONS)

        for question in attempt["questions"]:
            self.assertEqual(set(question), {"id", "kind", "prompt", "options"})

    def test_final_exam_draws_from_every_module(self):
        self.pass_every_module()

        owner = {
            question["id"]: module_id
            for module_id in curriculum.module_ids()
            for question in curriculum.load_questions(module_id)
        }
        attempt = self.start_final_exam()
        covered = {owner[question["id"]] for question in attempt["questions"]}

        self.assertEqual(covered, set(curriculum.module_ids()))

    def test_passing_the_final_exam_is_recorded(self):
        self.pass_every_module()

        attempt = self.start_final_exam()
        self.answer_all(attempt, FINAL_EXAM_ID, want_correct=True)
        body = self.finish(attempt)
        final_exam = body["progress"]["final_exam"]

        self.assertTrue(body["result"]["passed"])
        self.assertIsNone(body["result"]["next_module_id"])
        self.assertTrue(final_exam["passed"])
        self.assertEqual(final_exam["best_percent"], 100)

    def test_a_failed_final_exam_can_be_retaken(self):
        self.pass_every_module()

        attempt = self.start_final_exam()
        self.answer_all(attempt, FINAL_EXAM_ID, want_correct=False)
        body = self.finish(attempt)

        self.assertFalse(body["result"]["passed"])
        self.assertFalse(body["progress"]["final_exam"]["passed"])
        self.assertEqual(body["progress"]["final_exam"]["attempts"], 1)
        self.start_final_exam()

    def test_reset_clears_the_final_exam(self):
        self.pass_every_module()

        attempt = self.start_final_exam()
        self.answer_all(attempt, FINAL_EXAM_ID, want_correct=True)
        self.finish(attempt)

        final_exam = self.client.post("/api/reset").get_json()["final_exam"]

        self.assertFalse(final_exam["unlocked"])
        self.assertFalse(final_exam["passed"])


if __name__ == "__main__":
    unittest.main()