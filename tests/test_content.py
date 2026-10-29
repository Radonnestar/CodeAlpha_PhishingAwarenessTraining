import unittest

from backend import curriculum
from backend.config import FINAL_EXAM_ID, FINAL_EXAM_QUESTIONS, QUESTIONS_PER_ATTEMPT


class ContentTests(unittest.TestCase):
    def test_every_module_has_a_lesson_and_a_question_bank(self):
        for module_id in curriculum.module_ids():
            with self.subTest(module=module_id):
                self.assertTrue(curriculum.load_lesson(module_id)["screens"])
                self.assertGreaterEqual(
                    len(curriculum.load_questions(module_id)), QUESTIONS_PER_ATTEMPT
                )

    def test_question_ids_are_unique_across_all_banks(self):
        ids = [question["id"] for question in curriculum.load_questions(FINAL_EXAM_ID)]

        self.assertEqual(len(ids), len(set(ids)))

    def test_final_exam_pool_is_large_enough(self):
        pool = curriculum.load_questions(FINAL_EXAM_ID)

        self.assertGreaterEqual(len(pool), FINAL_EXAM_QUESTIONS)


if __name__ == "__main__":
    unittest.main()