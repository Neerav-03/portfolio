/**
 * Original pixel art for Neerav Quest (a developer with glasses, bugs, code blocks).
 * Each sprite is a list of rows; every character maps to a palette colour, '.' is transparent.
 */

/** Theme token behind each game colour (tests check contrast between these). */
export const PALETTE_TOKENS = {
  bg: '--surface-0',
  grid: '--bg-grid',
  rack: '--surface-2',
  ground: '--surface-2',
  groundTop: '--line-strong',
  brick: '--surface-3',
  brickLine: '--line',
  text: '--text',
  textDim: '--text-3',
  accent: '--accent',
  accentStrong: '--accent-strong',
  accentSoft: '--accent-soft',
  ok: '--ok',
  err: '--err',
  used: '--surface-3',
} as const;

export type Palette = Record<keyof typeof PALETTE_TOKENS, string>;

/** Character colours are the same in both themes (it's a person, not UI). */
const CHARACTER: Record<string, string> = {
  h: '#2a211c', // hair
  s: '#e3b28c', // skin
  g: '#b9925a', // glasses frame
  e: '#eef4fb', // lens
  m: '#2a211c', // moustache
  t: '#e8e8ea', // tee
  k: '#3a3f4b', // tee print
  d: '#343a46', // trousers
  b: '#1b1d22', // shoes
};

const HEAD = [
  '...hhhhhh...',
  '..hhhhhhhhh.',
  '..hhsssshhh.',
  '..hsssssss..',
  '.sgggsgggs..',
  '.sgeegsgeg..',
  '..ssssssss..',
  '..ssmmmmss..',
  '...ssssss...',
];
const BODY = ['..tttttttt..', '.stkkkkkkts.', '.sttttttts..'];
const LEGS = {
  stand: ['..dddddddd..', '..ddd..ddd..', '..bbb..bbb..', '............'],
  run1: ['..dddddddd..', '..ddd...dd..', '.bbb....dd..', '........bb..'],
  run2: ['..dddddddd..', '..dd...ddd..', '..dd....bbb.', '..bb........'],
  jump: ['..dddddddd..', '.ddd....ddd.', '.bb......bb.', '............'],
};
export const PLAYER_FRAMES = {
  stand: [...HEAD, ...BODY, ...LEGS.stand],
  run1: [...HEAD, ...BODY, ...LEGS.run1],
  run2: [...HEAD, ...BODY, ...LEGS.run2],
  jump: [...HEAD, ...BODY, ...LEGS.jump],
};

const BUG = [
  '..a......a..',
  '...a....a...',
  '...rrrrrr...',
  '..rrwrrwrr..',
  '.rrrrrrrrrr.',
  '.rrrrllrrrr.',
  '.rrrrrrrrrr.',
  '..l.l..l.l..',
  '.l..l..l..l.',
];
const BUG_SQUASHED = ['............', '.a........a.', '.rrrrrrrrrr.', 'llrrrrrrrrll'];

export type FrameName = keyof typeof PLAYER_FRAMES;

export interface Sprites {
  player: Record<FrameName, { right: HTMLCanvasElement; left: HTMLCanvasElement }>;
  bug: HTMLCanvasElement;
  bugSquashed: HTMLCanvasElement;
}

function paint(rows: string[], colours: Record<string, string>, mirror = false): HTMLCanvasElement {
  const w = rows[0].length;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = rows.length;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;
  rows.forEach((row, y) => {
    [...row].forEach((ch, x) => {
      const colour = colours[ch];
      if (!colour) return;
      ctx.fillStyle = colour;
      ctx.fillRect(mirror ? w - 1 - x : x, y, 1, 1);
    });
  });
  return canvas;
}

export function buildSprites(p: Palette): Sprites {
  const bugColours = { a: p.text, r: p.err, w: p.bg, l: p.text };
  const player = Object.fromEntries(
    (Object.keys(PLAYER_FRAMES) as FrameName[]).map((name) => [
      name,
      { right: paint(PLAYER_FRAMES[name], CHARACTER), left: paint(PLAYER_FRAMES[name], CHARACTER, true) },
    ]),
  ) as Sprites['player'];
  return { player, bug: paint(BUG, bugColours), bugSquashed: paint(BUG_SQUASHED, bugColours) };
}

/** Read the live theme tokens so the game matches light and dark mode. */
export function readPalette(): Palette {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(
    Object.entries(PALETTE_TOKENS).map(([key, token]) => [key, cs.getPropertyValue(token).trim()]),
  ) as Palette;
}
