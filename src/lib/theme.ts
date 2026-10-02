import { useSyncExternalStore } from 'react';
import { readStore, STORE_KEYS, writeStore } from './storage';

export type Theme = 'light' | 'dark';
export type ThemePreference = Theme | 'system';

/**
 * The site is dark-first: first-time visitors get dark regardless of OS setting.
 * Change to 'system' to follow the OS by default. Keep the inline script in
 * index.html in sync with this value (it applies the theme before first paint).
 */
export const DEFAULT_THEME_PREFERENCE: ThemePreference = 'dark';

const THEME_COLOR: Record<Theme, string> = { dark: '#08090b', light: '#f4f5f7' };

const osLight = () => window.matchMedia('(prefers-color-scheme: light)').matches;

function readPreference(): ThemePreference {
  const v = readStore(STORE_KEYS.theme);
  return v === 'light' || v === 'dark' || v === 'system' ? v : DEFAULT_THEME_PREFERENCE;
}

let preference: ThemePreference = readPreference();
const listeners = new Set<() => void>();

export function resolveTheme(pref: ThemePreference = preference): Theme {
  return pref === 'system' ? (osLight() ? 'light' : 'dark') : pref;
}

function commit(theme: Theme) {
  const root = document.documentElement;
  root.dataset.theme = theme;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEME_COLOR[theme]);
}

function applyTheme(theme: Theme, animate: boolean) {
  const root = document.documentElement;
  if (root.dataset.theme === theme) return;
  root.classList.add('theme-switching');
  const done = () => root.classList.remove('theme-switching');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (animate && !reduced && typeof document.startViewTransition === 'function') {
    // Cross-fade the whole page between the two themes.
    document.startViewTransition(() => commit(theme)).finished.finally(done);
  } else {
    commit(theme);
    requestAnimationFrame(() => requestAnimationFrame(done));
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function setThemePreference(pref: ThemePreference): void {
  preference = pref;
  writeStore(STORE_KEYS.theme, pref);
  applyTheme(resolveTheme(pref), true);
  emit();
}

export function toggleTheme(): void {
  setThemePreference(resolveTheme() === 'dark' ? 'light' : 'dark');
}

export function getThemeState(): { preference: ThemePreference; theme: Theme } {
  return { preference, theme: resolveTheme() };
}

// Make sure the DOM matches the stored preference (the inline script normally
// has already done this) and follow OS changes while on 'system'.
if (typeof window !== 'undefined') {
  applyTheme(resolveTheme(), false);
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (preference !== 'system') return;
    applyTheme(resolveTheme(), true);
    emit();
  });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

const snapshot = () => `${preference}:${resolveTheme()}`;

export function useTheme(): { preference: ThemePreference; theme: Theme } {
  const snap = useSyncExternalStore(subscribe, snapshot, () => `${DEFAULT_THEME_PREFERENCE}:dark`);
  const [pref, theme] = snap.split(':') as [ThemePreference, Theme];
  return { preference: pref, theme };
}
