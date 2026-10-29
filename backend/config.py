from datetime import timedelta
from pathlib import Path

PACKAGE_DIR = Path(__file__).resolve().parent
PROJECT_DIR = PACKAGE_DIR.parent
CONTENT_DIR = PACKAGE_DIR / "content"
DATA_DIR = PROJECT_DIR / "data"
DATABASE_PATH = DATA_DIR / "progress.db"
SECRET_KEY_PATH = DATA_DIR / "secret.key"

PASS_PERCENT = 80
QUESTIONS_PER_ATTEMPT = 5
FINAL_EXAM_ID = "final-exam"
FINAL_EXAM_QUESTIONS = 10
HUNT_UNLOCK_MODULE_ID = "email-red-flags"

SESSION_COOKIE_NAME = "learner"
SESSION_COOKIE_HTTPONLY = True
SESSION_COOKIE_SAMESITE = "Lax"
PERMANENT_SESSION_LIFETIME = timedelta(days=365)