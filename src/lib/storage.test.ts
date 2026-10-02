import { describe, expect, it, vi } from 'vitest';
import { readStore, writeStore } from './storage';

describe('storage', () => {
  it('reads back what it writes', () => {
    writeStore('k', 'v');
    expect(readStore('k')).toBe('v');
    expect(readStore('missing')).toBeNull();
  });

  it('never throws when storage is unavailable (private mode, blocked cookies)', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    expect(() => writeStore('k', 'v')).not.toThrow();
    expect(readStore('k')).toBeNull();
  });
});
