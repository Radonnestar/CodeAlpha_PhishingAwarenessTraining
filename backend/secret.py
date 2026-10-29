import os
import secrets
from pathlib import Path


def load_secret_key(path):
    path = Path(path)

    if path.exists():
        return path.read_text(encoding="utf-8").strip()

    path.parent.mkdir(parents=True, exist_ok=True)
    key = secrets.token_hex(32)
    descriptor = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)

    with os.fdopen(descriptor, "w", encoding="utf-8") as handle:
        handle.write(key)

    return key