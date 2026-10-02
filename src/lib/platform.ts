export const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/i.test(navigator.userAgent);

export const MOD_LABEL = isMac ? '⌘' : 'Ctrl';
