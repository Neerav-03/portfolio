/**
 * Neerav Quest: one short level (~45 s). Built from small helpers rather than a
 * hand-typed map so the layout is easy to read, edit and test.
 */

export const TILE = 16;
export const LEVEL_W = 120; // tiles
export const LEVEL_H = 12; // tiles
export const GROUND_ROW = 10; // rows 10–11 are ground

export const Tile = {
  Empty: 0,
  Ground: 1,
  Brick: 2,
  /** `{ }` code block that holds a fact. */
  Block: 3,
  UsedBlock: 4,
} as const;
export type Tile = (typeof Tile)[keyof typeof Tile];

export interface Level {
  tiles: Uint8Array; // LEVEL_W * LEVEL_H, row-major
  start: { col: number; row: number };
  flagCol: number;
  /** Fact blocks in the order they appear; index matches the facts list. */
  blocks: { col: number; row: number }[];
  commits: { col: number; row: number }[];
  bugs: { col: number; row: number }[];
}

export function buildLevel(): Level {
  const tiles = new Uint8Array(LEVEL_W * LEVEL_H);
  const set = (col: number, row: number, t: Tile) => {
    tiles[row * LEVEL_W + col] = t;
  };
  const blocks: Level['blocks'] = [];
  const commits: Level['commits'] = [];
  const bugs: Level['bugs'] = [];

  const ground = (from: number, to: number) => {
    for (let c = from; c <= to; c++) for (let r = GROUND_ROW; r < LEVEL_H; r++) set(c, r, Tile.Ground);
  };
  const gap = (from: number, to: number) => {
    for (let c = from; c <= to; c++) for (let r = GROUND_ROW; r < LEVEL_H; r++) set(c, r, Tile.Empty);
  };
  const bricks = (row: number, from: number, to: number) => {
    for (let c = from; c <= to; c++) set(c, row, Tile.Brick);
  };
  const block = (col: number, row: number) => {
    set(col, row, Tile.Block);
    blocks.push({ col, row });
  };
  const commitRow = (row: number, from: number, to: number) => {
    for (let c = from; c <= to; c++) commits.push({ col: c, row });
  };
  /** Solid column of bricks from `top` down to the ground. */
  const pillar = (col: number, top: number) => {
    for (let r = top; r < GROUND_ROW; r++) set(col, r, Tile.Brick);
  };

  ground(0, LEVEL_W - 1);

  // 1 · warm-up
  block(7, 6);
  commitRow(7, 10, 12);
  bugs.push({ col: 16, row: 9 });
  block(20, 6);

  // 2 · first gap and a raised platform
  gap(26, 28);
  bricks(7, 32, 36);
  commitRow(6, 32, 36);
  block(34, 3);
  bugs.push({ col: 40, row: 9 });

  // 3 · staircase over a gap
  pillar(44, 9);
  pillar(45, 8);
  pillar(46, 7);
  pillar(47, 6);
  gap(48, 50);
  block(55, 6);

  // 4 · bug alley
  commitRow(8, 58, 61);
  bugs.push({ col: 60, row: 9 }, { col: 64, row: 9 });
  block(66, 6);
  block(68, 6);

  // 5 · climb
  bricks(7, 72, 76);
  bricks(5, 79, 83);
  commitRow(4, 79, 83);
  block(81, 2);
  gap(86, 88);

  // 6 · home stretch
  bugs.push({ col: 93, row: 9 });
  block(97, 6);
  commitRow(9, 100, 103);

  return { tiles, start: { col: 2, row: 9 }, flagCol: 112, blocks, commits, bugs };
}

export function tileAt(level: Level, col: number, row: number): Tile {
  if (col < 0 || col >= LEVEL_W) return Tile.Ground; // level edges are walls
  if (row < 0) return Tile.Empty;
  if (row >= LEVEL_H) return Tile.Empty; // below the level: pits
  return level.tiles[row * LEVEL_W + col] as Tile;
}

export const isSolid = (t: Tile) => t !== Tile.Empty;
