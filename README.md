# CodeAlpha Phishing Awareness Training

An interactive phishing awareness course with a Flask backend. Learners work through six modules, pass a quiz after each one, practise in two games, and finish with a final exam.

## Features

- Six lesson modules with interactive diagrams and an animated owl teacher
- Server-graded quizzes (80% to pass) that unlock the next module
- Spot the phish: click the red flags in fake emails
- Phish or legit?: a timed speed round
- Final exam drawn from every module
- Progress saved per browser, no accounts needed

## Run it

Requires Python 3.10 or newer.

```
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py
```

On macOS or Linux, activate with `source .venv/bin/activate`. Then open http://127.0.0.1:5000.

## Run the tests

```
python -m unittest discover -v
```

## Security

- Quiz answers never reach the browser. Grading happens on the server.
- The server enforces module locks, so editing the browser cannot skip ahead.
- Progress is tied to a signed cookie, and all page text is written with `textContent`.

## Structure

```
app.py          Flask app
backend/        API, grading, unlock rules, lesson and question content
frontend/       Pages, styles and scripts
tests/          Automated tests
```