/** localStorage wrappers that never throw (private mode, blocked storage, etc.). */
export function readStore(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStore(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable — non-essential */
  }
}

export const STORE_KEYS = {
  booted: 'neeravos.booted',
  mode: 'neeravos.mode',
  theme: 'neeravos.theme',
} as const;
