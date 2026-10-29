import mimetypes

from flask import Flask, request

mimetypes.add_type("text/javascript", ".js")
from flask import Flask, request

from backend import config, curriculum
from backend.database import init_database
from backend.routes import api
from backend.secret import load_secret_key


def create_app(overrides=None):
    app = Flask(__name__, static_folder="frontend", static_url_path="")
    app.config.from_object(config)
    app.config.update(overrides or {})
    app.secret_key = load_secret_key(app.config["SECRET_KEY_PATH"])

    curriculum.validate_content()
    init_database(app)
    app.register_blueprint(api)

    @app.get("/")
    def index():
        return app.send_static_file("index.html")

    @app.after_request
    def add_security_headers(response):
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Referrer-Policy"] = "same-origin"
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    return app


if __name__ == "__main__":
    create_app().run(host="127.0.0.1", port=5000, debug=True)