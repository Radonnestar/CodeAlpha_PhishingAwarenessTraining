export class Hunt {
  #parts;
  #found = new Set();
  #inspected = new Set();
  #misses = 0;

  constructor(parts) {
    this.#parts = parts;
  }

  get totalFlags() {
    return this.#parts.filter(({ flag }) => flag).length;
  }

  get foundCount() {
    return this.#found.size;
  }

  get misses() {
    return this.#misses;
  }

  get isComplete() {
    return this.foundCount === this.totalFlags;
  }

  inspect(partId) {
    if (this.#inspected.has(partId)) {
      return null;
    }

    this.#inspected.add(partId);

    const { flag } = this.#parts.find(({ id }) => id === partId);

    if (flag) {
      this.#found.add(partId);
      return { flag };
    }

    this.#misses += 1;
    return { flag: null };
  }
}