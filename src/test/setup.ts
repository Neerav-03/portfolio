import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

/** Media-query results tests can flip, e.g. `mediaState.light = true`. */
export const mediaState = { light: false, reducedMotion: false, mobile: false };

function matches(query: string): boolean {
  if (query.includes('prefers-color-scheme: light')) return mediaState.light;
  if (query.includes('prefers-reduced-motion')) return mediaState.reducedMotion;
  if (query.includes('max-width')) return mediaState.mobile;
  return false;
}

// jsdom lacks these browser APIs.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    get matches() {
      return matches(query);
    },
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});
Element.prototype.scrollIntoView = vi.fn();
window.open = vi.fn() as unknown as typeof window.open;
Element.prototype.scrollTo = vi.fn() as unknown as Element['scrollTo'];

beforeEach(() => {
  mediaState.light = false;
  mediaState.reducedMotion = false;
  mediaState.mobile = false;
});

afterEach(() => {
  cleanup();
  localStorage.clear();
  window.history.replaceState(null, '', '/');
});
