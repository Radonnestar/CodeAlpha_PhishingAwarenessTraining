import json
import random
import uuid

from . import curriculum, progress
from .config import FINAL_EXAM_ID, FINAL_EXAM_QUESTIONS, PASS_PERCENT, QUESTIONS_PER_ATTEMPT
from .errors import ApiError


def _previous_question_ids(connection, learner_id, module_id):
    rows = connection.execute(
        """
        SELECT question_id FROM attempt_questions
        WHERE attempt_id = (
            SELECT id FROM attempts
            WHERE learner_id = ? AND module_id = ?
            ORDER BY rowid DESC
            LIMIT 1
        )
        """,
        (learner_id, module_id),
    )

    return {row["question_id"] for row in rows}


def _deal(bank, previous_ids, count):
    fresh = [question for question in bank if question["id"] not in previous_ids]
    repeated = [question for question in bank if question["id"] in previous_ids]

    random.shuffle(fresh)
    random.shuffle(repeated)

    dealt = (fresh + repeated)[:count]
    random.shuffle(dealt)

    return dealt


def _deal_final_exam(previous_ids):
    banks = curriculum.question_banks()
    anchors = [_deal(bank, previous_ids, 1)[0] for bank in banks]
    anchor_ids = {question["id"] for question in anchors}
    remaining = [
        question for bank in banks for question in bank if question["id"] not in anchor_ids
    ]
    extra = _deal(remaining, previous_ids, max(0, FINAL_EXAM_QUESTIONS - len(anchors)))
    dealt = anchors + extra

    random.shuffle(dealt)

    return dealt


def _select_questions(connection, learner_id, module_id):
    previous_ids = _previous_question_ids(connection, learner_id, module_id)

    if module_id == FINAL_EXAM_ID:
        return _deal_final_exam(previous_ids)

    return _deal(curriculum.load_questions(module_id), previous_ids, QUESTIONS_PER_ATTEMPT)


def _public_question(question, option_order):
    return {
        "id": question["id"],
        "kind": question["kind"],
        "prompt": question["prompt"],
        "options": [question["options"][index] for index in option_order],
    }


def _next_module_id(module_id):
    ids = curriculum.module_ids()

    if module_id not in ids:
        return None

    position = ids.index(module_id) + 1

    return ids[position] if position < len(ids) else None


def _open_attempt(connection, learner_id, attempt_id):
    attempt = connection.execute(
        "SELECT * FROM attempts WHERE id = ? AND learner_id = ?",
        (attempt_id, learner_id),
    ).fetchone()

    if attempt is None:
        raise ApiError("Attempt not found", 404)

    if attempt["finished"]:
        raise ApiError("This attempt is already finished", 409)

    return attempt


def start_attempt(connection, learner_id, module_id):
    attempt_id = uuid.uuid4().hex

    with connection:
        connection.execute(
            "DELETE FROM attempts WHERE learner_id = ? AND module_id = ? AND finished = 0",
            (learner_id, module_id),
        )

        dealt = _select_questions(connection, learner_id, module_id)

        connection.execute(
            "INSERT INTO attempts (id, learner_id, module_id, total) VALUES (?, ?, ?, ?)",
            (attempt_id, learner_id, module_id, len(dealt)),
        )

        questions = []

        for position, question in enumerate(dealt):
            option_order = random.sample(range(len(question["options"])), len(question["options"]))

            connection.execute(
                """
                INSERT INTO attempt_questions (attempt_id, position, question_id, option_order)
                VALUES (?, ?, ?, ?)
                """,
                (attempt_id, position, question["id"], json.dumps(option_order)),
            )
            questions.append(_public_question(question, option_order))

    return {"attempt_id": attempt_id, "pass_percent": PASS_PERCENT, "questions": questions}


def submit_answer(connection, learner_id, attempt_id, question_id, choice):
    attempt = _open_attempt(connection, learner_id, attempt_id)

    row = connection.execute(
        "SELECT option_order FROM attempt_questions WHERE attempt_id = ? AND question_id = ?",
        (attempt_id, question_id),
    ).fetchone()

    if row is None:
        raise ApiError("Question is not part of this attempt", 404)

    option_order = json.loads(row["option_order"])

    if type(choice) is not int or not 0 <= choice < len(option_order):
        raise ApiError("Choice must be a valid option number", 400)

    question = next(
        (
            item
            for item in curriculum.load_questions(attempt["module_id"])
            if item["id"] == question_id
        ),
        None,
    )

    if question is None:
        raise ApiError("This quiz has changed, please start it again", 409)

    is_correct = option_order[choice] == question["answer"]

    with connection:
        cursor = connection.execute(
            """
            UPDATE attempt_questions SET choice = ?, is_correct = ?
            WHERE attempt_id = ? AND question_id = ? AND choice IS NULL
            """,
            (choice, int(is_correct), attempt_id, question_id),
        )

    if cursor.rowcount == 0:
        raise ApiError("Question already answered", 409)

    return {
        "is_correct": is_correct,
        "correct_index": option_order.index(question["answer"]),
        "explanation": question["explanation"],
    }


def finish_attempt(connection, learner_id, attempt_id):
    attempt = _open_attempt(connection, learner_id, attempt_id)

    rows = connection.execute(
        "SELECT is_correct FROM attempt_questions WHERE attempt_id = ?", (attempt_id,)
    ).fetchall()

    if any(row["is_correct"] is None for row in rows):
        raise ApiError("Answer every question before finishing", 409)

    score = sum(row["is_correct"] for row in rows)
    total = attempt["total"]
    percent = round(score * 100 / total)
    passed = score * 100 >= PASS_PERCENT * total

    with connection:
        cursor = connection.execute(
            "UPDATE attempts SET finished = 1, score = ? WHERE id = ? AND finished = 0",
            (score, attempt_id),
        )

        if cursor.rowcount == 0:
            raise ApiError("This attempt is already finished", 409)

        progress.record_result(connection, learner_id, attempt["module_id"], percent, passed)

    return {
        "score": score,
        "total": total,
        "percent": percent,
        "passed": passed,
        "pass_percent": PASS_PERCENT,
        "next_module_id": _next_module_id(attempt["module_id"]) if passed else None,
    }