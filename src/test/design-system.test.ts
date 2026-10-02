/**
 * Design-system guards. Colours must come from theme tokens (src/styles/tokens.css)
 * so both themes stay correct; these tests fail when someone hardcodes a colour
 * or adds a token without a light-mode value.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(__dirname, '..');
const walk = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const files = walk(SRC).filter((f) => !f.includes(`${join('src', 'test')}`) && !/\.test\.tsx?$/.test(f));
const rel = (f: string) => relative(SRC, f).replaceAll('\\', '/');
const read = (f: string) => readFileSync(f, 'utf8');

const COLOR = /#[0-9a-fA-F]{3,8}\b|rgba?\([^)]*\)/g;

/** Deliberate, theme-independent colours. Anything else must use a token. */
const ALLOWED: Record<string, string[]> = {
  // macOS-style window controls are the same in both themes.
  'os/window.css': ['rgba(0, 0, 0, 0.7)', '#e5625c', '#c94e48', '#e3b14b', '#c4963a', '#4fbf72', '#3ea25e'],
  // A karate belt is white, then black, in any theme.
  'apps/about/about.css': ['#ecebe6', '#0b0b0c', '#3a3a3e'],
  'components/avatar.css': ['rgba(0, 0, 0, 0.5)'],
  // PDF pages are paper-white.
  'components/resume-viewer.css': ['#fff'],
  // Platform rank colours (Codeforces / CodeChef), mixed with theme surfaces.
  'apps/code/CodeApp.tsx': ['#8a8f98', '#4caf6a', '#3fb8b0', '#5b8cff', '#b07cf0', '#e8a24a', '#e8b04a'],
  // White text on dark heat cells.
  'components/MiniCharts.tsx': ['#fff'],
  // Neerav Quest's pixel character: a person's colours don't change with the UI theme.
  'game/sprites.ts': ['#2a211c', '#e3b28c', '#b9925a', '#eef4fb', '#e8e8ea', '#3a3f4b', '#343a46', '#1b1d22'],
  // Browser UI colour for each theme (mirrors --bg).
  'lib/theme.ts': ['#08090b', '#f4f5f7'],
};

function tokenBlocks() {
  const css = read(join(SRC, 'styles/tokens.css'));
  const block = (selector: string) => {
    const start = css.indexOf(`${selector} {`);
    const end = css.indexOf('\n}', start);
    return css.slice(start, end);
  };
  const decls = (body: string) =>
    new Map([...body.matchAll(/(--[\w-]+):\s*([^;]+);/g)].map((m) => [m[1], m[2].trim()]));
  return { dark: decls(block(':root')), light: decls(block(":root[data-theme='light']")) };
}

describe('design system', () => {
  it('no hardcoded colours outside tokens.css (except the allowlist)', () => {
    const offenders: string[] = [];
    for (const f of files.filter((f) => /\.(css|tsx?)$/.test(f) && !f.endsWith('tokens.css'))) {
      const allowed = ALLOWED[rel(f)] ?? [];
      // Ignore comments so documentation can mention colours.
      const code = read(f)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/^\s*\/\/.*$/gm, '');
      for (const m of code.matchAll(COLOR)) {
        if (!allowed.includes(m[0])) offenders.push(`${rel(f)}: ${m[0]}`);
      }
    }
    expect(offenders, 'Use a token from src/styles/tokens.css instead').toEqual([]);
  });

  it('every colour token has a light-theme value', () => {
    const { dark, light } = tokenBlocks();
    const colourish = [...dark]
      .filter(([, v]) => /#|rgba?\(|var\(--(surface|text|accent|line)/.test(v))
      .map(([k]) => k);
    const missing = colourish.filter((k) => !light.has(k));
    expect(missing).toEqual([]);
    // And the light block must not invent tokens dark doesn't have.
    expect([...light.keys()].filter((k) => !dark.has(k))).toEqual([]);
  });

  it('every var(--token) used is defined somewhere', () => {
    const defined = new Set<string>();
    for (const f of files.filter((f) => /\.(css|tsx?)$/.test(f))) {
      const src = read(f);
      for (const m of src.matchAll(/(--[\w-]+)\s*:/g)) defined.add(m[1]);
      // Custom properties set from TSX, e.g. style={{ ['--fill' as string]: ... }}
      for (const m of src.matchAll(/['"`](--[\w-]+)['"`]/g)) defined.add(m[1]);
    }
    const undefinedUses = new Set<string>();
    for (const f of files.filter((f) => /\.(css|tsx?)$/.test(f))) {
      for (const m of read(f).matchAll(/var\((--[\w-]+)/g)) {
        if (!defined.has(m[1])) undefinedUses.add(`${rel(f)}: ${m[1]}`);
      }
    }
    expect([...undefinedUses]).toEqual([]);
  });

  it('pre-paint background in index.html matches --bg for both themes', () => {
    const { dark, light } = tokenBlocks();
    const html = readFileSync(resolve(SRC, '../index.html'), 'utf8');
    expect(html).toContain(`background: ${dark.get('--bg')}`);
    expect(html).toContain(`background: ${light.get('--bg')}`);
  });
});

/** WCAG relative luminance contrast. */
function contrast(a: string, b: string) {
  const lum = (h: string) => {
    const [r, g, b2] = (h.replace('#', '').match(/../g) ?? []).map((x) => {
      const c = parseInt(x, 16) / 255;
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b2;
  };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

describe('colour contrast (WCAG AA)', () => {
  const { dark, light } = tokenBlocks();
  const SURFACES = ['--bg', '--surface-0', '--surface-1', '--surface-2', '--surface-3', '--surface-hover'];
  const TEXT = ['--text', '--text-2', '--text-3', '--text-4', '--accent', '--accent-strong', '--ok', '--warn', '--err'];

  for (const [name, theme] of [
    ['dark', dark],
    ['light', { ...Object.fromEntries(dark), ...Object.fromEntries(light) }],
  ] as const) {
    const get = (k: string) => (theme instanceof Map ? theme.get(k) : (theme as Record<string, string>)[k])!;
    it(`${name}: every text tone is ≥ 4.5:1 on every surface`, () => {
      const failures: string[] = [];
      for (const t of TEXT) {
        for (const s of SURFACES) {
          const ratio = contrast(get(t), get(s));
          if (ratio < 4.5) failures.push(`${t} on ${s}: ${ratio.toFixed(2)}`);
        }
      }
      expect(failures).toEqual([]);
    });
  }
});

describe('pointer events', () => {
  /**
   * Rules that disable pointer events. A misplaced `pointer-events: none` once made
   * every window body unclickable; new entries must be deliberate (state-scoped
   * or purely decorative) and added here.
   */
  const ALLOWED_POINTER_NONE = [
    'apps/about/about.css | .ab-kiai',
    'components/charts.css | .chart__tip',
    // Touch-pad container lets taps through to the game; its buttons re-enable pointer events.
    'game/quest.css | .quest__pad',
    'os/boot.css | .boot.is-leaving',
    'os/shell.css | .dock__tip',
    'os/shell.css | .toast-region',
    'os/window.css | .win.is-dragging .win__body',
    'os/window.css | .win.is-minimized',
    'os/window.css | .win.is-closing',
  ];

  it('only allowlisted rules disable pointer events', () => {
    const found: string[] = [];
    for (const f of files.filter((f) => f.endsWith('.css'))) {
      const css = read(f).replace(/\/\*[\s\S]*?\*\//g, '');
      for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
        if (/pointer-events:\s*none/.test(m[2])) found.push(`${rel(f)} | ${m[1].trim().replace(/\s+/g, ' ')}`);
      }
    }
    expect(found.sort()).toEqual([...ALLOWED_POINTER_NONE].sort());
  });
});
