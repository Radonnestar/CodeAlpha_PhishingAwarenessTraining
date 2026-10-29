from flask import Blueprint, g, jsonify, request

from . import curriculum, grading, learner, progress
from .config import FINAL_EXAM_ID
from .database import get_connection
from .errors import ApiError

api = Blueprint("api", __name__, url_prefix="/api")


@api.before_request
def identify_learner():
    g.learner_id = learner.ensure_learner(get_connection())


@api.errorhandler(ApiError)
def handle_api_error(error):
    return jsonify(error=error.message), error.status_code


def read_json_object():
    body = request.get_json(silent=True)

    if not isinstance(body, dict):
        raise ApiError("Request body must be a JSON object", 400)

    return body


@api.get("/progress")
def get_progress():
    return jsonify(progress.build_summary(get_connection(), g.learner_id))


@api.get("/modules/<module_id>")
def get_module(module_id):
    module = progress.require_unlocked(get_connection(), g.learner_id, module_id)

    return jsonify(module=module, lesson=curriculum.load_lesson(module_id))


@api.post("/modules/<module_id>/lesson-complete")
def complete_lesson(module_id):
    connection = get_connection()
    progress.require_unlocked(connection, g.learner_id, module_id)

    with connection:
        progress.mark_lesson_completed(connection, g.learner_id, module_id)

    return jsonify(progress.build_summary(connection, g.learner_id))


@api.post("/modules/<module_id>/quiz")
def start_quiz(module_id):
    connection = get_connection()
    module = progress.require_unlocked(connection, g.learner_id, module_id)

    if not module["lesson_completed"]:
        raise ApiError("Finish the lesson before taking the quiz", 409)

    return jsonify(grading.start_attempt(connection, g.learner_id, module_id)), 201


@api.post("/final-exam/quiz")
def start_final_exam():
    connection = get_connection()
    progress.require_final_exam_unlocked(connection, g.learner_id)

    return jsonify(grading.start_attempt(connection, g.learner_id, FINAL_EXAM_ID)), 201


@api.post("/attempts/<attempt_id>/answer")
def answer_question(attempt_id):
    body = read_json_object()
    question_id = body.get("question_id")

    if not isinstance(question_id, str):
        raise ApiError("question_id must be a string", 400)

    result = grading.submit_answer(
        get_connection(), g.learner_id, attempt_id, question_id, body.get("choice")
    )

    return jsonify(result)


@api.post("/attempts/<attempt_id>/finish")
def finish_quiz(attempt_id):
    connection = get_connection()
    result = grading.finish_attempt(connection, g.learner_id, attempt_id)

    return jsonify(result=result, progress=progress.build_summary(connection, g.learner_id))


@api.post("/reset")
def reset_progress():
    connection = get_connection()

    with connection:
        progress.reset(connection, g.learner_id)

    return jsonify(progress.build_summary(connection, g.learner_id))