from . import curriculum
from .config import FINAL_EXAM_ID, HUNT_UNLOCK_MODULE_ID, PASS_PERCENT
from .errors import ApiError


def _value(row, key, default):
    return default if row is None else row[key]


def _fetch_rows(connection, learner_id):
    rows = connection.execute(
        "SELECT * FROM module_progress WHERE learner_id = ?", (learner_id,)
    )

    return {row["module_id"]: row for row in rows}


def _status(previous_passed, row):
    if not previous_passed:
        return "locked"

    if _value(row, "passed", 0):
        return "completed"

    if _value(row, "lesson_completed", 0) or _value(row, "attempts", 0):
        return "in_progress"

    return "available"


def _modules(rows):
    modules = []
    previous_passed = True

    for entry in curriculum.catalog():
        row = rows.get(entry["id"])

        modules.append(
            {
                **entry,
                "status": _status(previous_passed, row),
                "lesson_completed": bool(_value(row, "lesson_completed", 0)),
                "best_percent": _value(row, "best_percent", 0),
                "attempts": _value(row, "attempts", 0),
            }
        )
        previous_passed = bool(_value(row, "passed", 0))

    return modules


def list_modules(connection, learner_id):
    return _modules(_fetch_rows(connection, learner_id))


def build_summary(connection, learner_id):
    rows = _fetch_rows(connection, learner_id)
    modules = _modules(rows)
    completed = {module["id"] for module in modules if module["status"] == "completed"}
    final_row = rows.get(FINAL_EXAM_ID)

    return {
        "modules": modules,
        "hunt_unlocked": HUNT_UNLOCK_MODULE_ID in completed,
        "final_exam": {
            "unlocked": len(completed) == len(modules),
            "passed": bool(_value(final_row, "passed", 0)),
            "best_percent": _value(final_row, "best_percent", 0),
            "attempts": _value(final_row, "attempts", 0),
        },
        "pass_percent": PASS_PERCENT,
    }


def require_unlocked(connection, learner_id, module_id):
    curriculum.require_module(module_id)
    module = next(
        module for module in list_modules(connection, learner_id) if module["id"] == module_id
    )

    if module["status"] == "locked":
        raise ApiError("Pass the previous module's quiz to unlock this one", 403)

    return module


def require_final_exam_unlocked(connection, learner_id):
    if not build_summary(connection, learner_id)["final_exam"]["unlocked"]:
        raise ApiError("Pass every module's quiz to unlock the final exam", 403)


def mark_lesson_completed(connection, learner_id, module_id):
    connection.execute(
        """
        INSERT INTO module_progress (learner_id, module_id, lesson_completed)
        VALUES (?, ?, 1)
        ON CONFLICT (learner_id, module_id) DO UPDATE SET lesson_completed = 1
        """,
        (learner_id, module_id),
    )


def record_result(connection, learner_id, module_id, percent, passed):
    connection.execute(
        """
        INSERT INTO module_progress (learner_id, module_id, passed, best_percent, attempts)
        VALUES (?, ?, ?, ?, 1)
        ON CONFLICT (learner_id, module_id) DO UPDATE SET
            attempts = attempts + 1,
            best_percent = MAX(best_percent, excluded.best_percent),
            passed = MAX(passed, excluded.passed)
        """,
        (learner_id, module_id, int(passed), percent),
    )


def reset(connection, learner_id):
    connection.execute("DELETE FROM module_progress WHERE learner_id = ?", (learner_id,))
    connection.execute("DELETE FROM attempts WHERE learner_id = ?", (learner_id,))