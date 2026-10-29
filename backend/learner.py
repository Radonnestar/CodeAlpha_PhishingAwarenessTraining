import uuid

from flask import session

SESSION_KEY = "learner_id"


def ensure_learner(connection):
    learner_id = session.get(SESSION_KEY) or uuid.uuid4().hex

    with connection:
        connection.execute("INSERT OR IGNORE INTO learners (id) VALUES (?)", (learner_id,))

    session[SESSION_KEY] = learner_id
    session.permanent = True

    return learner_id