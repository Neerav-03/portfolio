import { describe, expect, it } from 'vitest';
import { seeded } from './random';

describe('seeded PRNG', () => {
  it('is deterministic for a seed and stays in [0, 1)', () => {
    const a = seeded(857);
    const b = seeded(857);
    const xs = Array.from({ length: 200 }, () => a());
    expect(xs).toEqual(Array.from({ length: 200 }, () => b()));
    expect(xs.every((x) => x >= 0 && x < 1)).toBe(true);
  });

  it('differs between seeds', () => {
    expect(seeded(1)()).not.toBe(seeded(2)());
  });
});
