function shuffle(items) {
  const copy = [...items];

  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));

    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }

  return copy;
}

export class Deck {
  #items;
  #queue = [];
  #lastDrawn = null;

  constructor(items) {
    this.#items = items;
  }

  draw() {
    if (this.#queue.length === 0) {
      this.#refill();
    }

    this.#lastDrawn = this.#queue.pop();

    return this.#lastDrawn;
  }

  #refill() {
    this.#queue = shuffle(this.#items);

    const nextIndex = this.#queue.length - 1;
    const wouldRepeat = this.#queue.length > 1 && this.#queue[nextIndex] === this.#lastDrawn;

    if (wouldRepeat) {
      [this.#queue[0], this.#queue[nextIndex]] = [this.#queue[nextIndex], this.#queue[0]];
    }
  }
}