import json

from .config import CONTENT_DIR, FINAL_EXAM_ID
from .errors import ApiError

QUESTION_KINDS = {"scenario", "concept"}
REQUIRED_SCREEN_KEYS = {"heading", "teacher", "body", "key_takeaway"}
REQUIRED_QUESTION_KEYS = {"id", "kind", "prompt", "options", "answer", "explanation"}


def _read_json(path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def _content_path(folder, module_id):
    return CONTENT_DIR / folder / f"{module_id}.json"


def catalog():
    return _read_json(CONTENT_DIR / "catalog.json")


def module_ids():
    return [entry["id"] for entry in catalog()]


def require_module(module_id):
    for entry in catalog():
        if entry["id"] == module_id:
            return entry

    raise ApiError("Unknown module", 404)


def _load(folder, module_id):
    require_module(module_id)
    path = _content_path(folder, module_id)

    if not path.is_file():
        raise ApiError("This module is not available yet", 404)

    return _read_json(path)


def load_lesson(module_id):
    return _load("modules", module_id)


def question_banks():
    banks = []

    for module_id in module_ids():
        path = _content_path("questions", module_id)

        if path.is_file():
            banks.append(_read_json(path))

    return banks


def load_questions(module_id):
    if module_id == FINAL_EXAM_ID:
        return [question for bank in question_banks() for question in bank]

    return _load("questions", module_id)


def validate_content():
    ids = module_ids()

    if len(ids) != len(set(ids)):
        raise ValueError("catalog.json contains duplicate module ids")

    if FINAL_EXAM_ID in ids:
        raise ValueError(f"catalog.json uses the reserved id {FINAL_EXAM_ID}")

    seen_question_ids = set()

    for module_id in ids:
        lesson_path = _content_path("modules", module_id)
        if lesson_path.is_file():
            _validate_lesson(module_id, _read_json(lesson_path))

        questions_path = _content_path("questions", module_id)
        if questions_path.is_file():
            _validate_questions(module_id, _read_json(questions_path), seen_question_ids)


def _validate_lesson(module_id, lesson):
    if lesson.get("id") != module_id:
        raise ValueError(f"Lesson file for {module_id} has a different id")

    if not lesson.get("screens"):
        raise ValueError(f"Lesson {module_id} has no screens")

    for screen in lesson["screens"]:
        missing = REQUIRED_SCREEN_KEYS - screen.keys()
        if missing:
            raise ValueError(f"Lesson {module_id} has a screen missing {sorted(missing)}")


def _validate_questions(module_id, questions, seen_ids):
    if not questions:
        raise ValueError(f"Question bank {module_id} is empty")

    for question in questions:
        name = f"{module_id}/{question.get('id', '?')}"
        missing = REQUIRED_QUESTION_KEYS - question.keys()

        if missing:
            raise ValueError(f"Question {name} is missing {sorted(missing)}")

        if question["id"] in seen_ids:
            raise ValueError(f"Question {name} has a duplicate id")
        seen_ids.add(question["id"])

        if question["kind"] not in QUESTION_KINDS:
            raise ValueError(f"Question {name} has an unknown kind")

        options = question["options"]
        if len(options) < 2 or len(set(options)) != len(options):
            raise ValueError(f"Question {name} needs at least two distinct options")

        answer = question["answer"]
        if type(answer) is not int or not 0 <= answer < len(options):
            raise ValueError(f"Question {name} has an answer outside the options")