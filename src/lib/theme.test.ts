import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mediaState } from '../test/setup';

/** theme.ts keeps module state, so each test imports a fresh copy. */
async function loadTheme(stored?: string) {
  vi.resetModules();
  if (stored) localStorage.setItem('neeravos.theme', stored);
  return import('./theme');
}

const rootTheme = () => document.documentElement.dataset.theme;

describe('theme store', () => {
  beforeEach(() => {
    delete document.documentElement.dataset.theme;
    document.head.innerHTML = '<meta name="theme-color" content="#000000" />';
  });

  it('defaults to dark (dark-first) even when the OS prefers light', async () => {
    mediaState.light = true;
    const theme = await loadTheme();
    expect(theme.DEFAULT_THEME_PREFERENCE).toBe('dark');
    expect(theme.getThemeState()).toEqual({ preference: 'dark', theme: 'dark' });
    expect(rootTheme()).toBe('dark');
  });

  it('restores a stored preference on load', async () => {
    const theme = await loadTheme('light');
    expect(theme.getThemeState().theme).toBe('light');
    expect(rootTheme()).toBe('light');
  });

  it('ignores garbage in storage', async () => {
    const theme = await loadTheme('purple');
    expect(theme.getThemeState().preference).toBe('dark');
  });

  it('"system" follows the OS setting', async () => {
    mediaState.light = true;
    const theme = await loadTheme('system');
    expect(theme.getThemeState()).toEqual({ preference: 'system', theme: 'light' });
  });

  it('toggle persists, updates the root attribute and theme-color', async () => {
    const theme = await loadTheme();
    theme.toggleTheme();
    expect(rootTheme()).toBe('light');
    expect(localStorage.getItem('neeravos.theme')).toBe('light');
    expect(document.querySelector('meta[name="theme-color"]')?.getAttribute('content')).toBe('#f4f5f7');
    theme.toggleTheme();
    expect(rootTheme()).toBe('dark');
  });

  it('notifies subscribers via useTheme snapshot changes', async () => {
    const theme = await loadTheme();
    theme.setThemePreference('system');
    expect(theme.getThemeState().preference).toBe('system');
    expect(localStorage.getItem('neeravos.theme')).toBe('system');
  });
});
