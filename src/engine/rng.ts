export class RNG {
  private seed: number;

  constructor(seed: number = 123456789) {
    this.seed = seed;
  }

  private next(): number {
    let x = this.seed | 0;
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    this.seed = x;
    return (x >>> 0) / 4294967296;
  }

  int(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  float(): number {
    return this.next();
  }
}

export const rng = new RNG(42); 
