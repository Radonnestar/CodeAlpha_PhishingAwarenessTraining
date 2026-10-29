const BASE_POINTS = 100;
const STREAK_BONUS = 25;
const MAX_BONUS_STEPS = 4;

export class Rapid {
  #cards;
  #index = 0;
  #lives;
  #score = 0;
  #streak = 0;
  #bestStreak = 0;
  #correct = 0;
  #answered = 0;

  constructor(cards, lives) {
    this.#cards = cards;
    this.#lives = lives;
  }

  get current() {
    return this.#cards[this.#index];
  }

  get position() {
    return this.#index + 1;
  }

  get total() {
    return this.#cards.length;
  }

  get lives() {
    return this.#lives;
  }

  get score() {
    return this.#score;
  }

  get streak() {
    return this.#streak;
  }

  get bestStreak() {
    return this.#bestStreak;
  }

  get correct() {
    return this.#correct;
  }

  get answered() {
    return this.#answered;
  }

  get isOver() {
    return this.#lives === 0 || this.#index >= this.#cards.length;
  }

  answer(verdict) {
    const card = this.current;
    const isCorrect = verdict === (card.isPhish ? "phish" : "legit");
    let points = 0;

    this.#answered += 1;

    if (isCorrect) {
      this.#streak += 1;
      this.#correct += 1;
      this.#bestStreak = Math.max(this.#bestStreak, this.#streak);
      points = BASE_POINTS + STREAK_BONUS * Math.min(this.#streak - 1, MAX_BONUS_STEPS);
      this.#score += points;
    } else {
      this.#streak = 0;
      this.#lives -= 1;
    }

    return { isCorrect, points };
  }

  advance() {
    this.#index += 1;
  }
}