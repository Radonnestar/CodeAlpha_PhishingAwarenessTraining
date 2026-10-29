import sqlite3
from pathlib import Path

from flask import current_app, g

SCHEMA = """
CREATE TABLE IF NOT EXISTS learners (
    id TEXT PRIMARY KEY,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS module_progress (
    learner_id TEXT NOT NULL REFERENCES learners (id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    lesson_completed INTEGER NOT NULL DEFAULT 0,
    passed INTEGER NOT NULL DEFAULT 0,
    best_percent INTEGER NOT NULL DEFAULT 0,
    attempts INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (learner_id, module_id)
);

CREATE TABLE IF NOT EXISTS attempts (
    id TEXT PRIMARY KEY,
    learner_id TEXT NOT NULL REFERENCES learners (id) ON DELETE CASCADE,
    module_id TEXT NOT NULL,
    finished INTEGER NOT NULL DEFAULT 0,
    score INTEGER,
    total INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS attempt_questions (
    attempt_id TEXT NOT NULL REFERENCES attempts (id) ON DELETE CASCADE,
    position INTEGER NOT NULL,
    question_id TEXT NOT NULL,
    option_order TEXT NOT NULL,
    choice INTEGER,
    is_correct INTEGER,
    PRIMARY KEY (attempt_id, position),
    UNIQUE (attempt_id, question_id)
);
"""


def init_database(app):
    path = Path(app.config["DATABASE_PATH"])
    path.parent.mkdir(parents=True, exist_ok=True)

    connection = sqlite3.connect(path)
    try:
        connection.executescript(SCHEMA)
    finally:
        connection.close()

    app.teardown_appcontext(close_connection)


def get_connection():
    if "connection" not in g:
        connection = sqlite3.connect(current_app.config["DATABASE_PATH"])
        connection.row_factory = sqlite3.Row
        connection.execute("PRAGMA foreign_keys = ON")
        g.connection = connection

    return g.connection


def close_connection(_error=None):
    connection = g.pop("connection", None)

    if connection is not None:
        connection.close()