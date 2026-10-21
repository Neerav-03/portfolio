/**
 * Neerav Quest engine: pure game logic (no DOM), so it can be unit-tested.
 * Units: pixels and seconds. One tile is 16 px.
 */
import { buildLevel, isSolid, LEVEL_H, LEVEL_W, Tile, TILE, tileAt, type Level } from './level';

export const VIEW_W = 21 * TILE; // 336
export const VIEW_H = LEVEL_H * TILE; // 192

export const PHYSICS = {
  gravity: 1100,
  jumpVelocity: 360, // ≈ 59 px (3.7 tiles) apex
  runSpeed: 110,
  groundAccel: 1100,
  airAccel: 750,
  friction: 1300,
  maxFall: 420,
  coyoteTime: 0.09,
  jumpBuffer: 0.12,
  jumpCut: 0.45,
  bugSpeed: 28,
  stompBounce: 230,
  knockback: 150,
  invulnerable: 1,
} as const;

export interface Input {
  left: boolean;
  right: boolean;
  jump: boolean;
}

export type QuestEvent =
  | { type: 'jump' }
  | { type: 'fact'; index: number }
  | { type: 'commit' }
  | { type: 'squash' }
  | { type: 'hurt' }
  | { type: 'fell' }
  | { type: 'won' };

export interface Player {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  vy: number;
  onGround: boolean;
  facing: 1 | -1;
  coyote: number;
  buffer: number;
  jumpHeld: boolean;
  invulnerable: number;
  safe: { x: number; y: number };
  /** Distance run, for the walk-cycle animation. */
  stride: number;
}

export interface Bug {
  x: number;
  y: number;
  w: number;
  h: number;
  vx: number;
  alive: boolean;
  /** Seconds since squashed (for the squash animation). */
  squashed: number;
}

export interface World {
  level: Level;
  player: Player;
  bugs: Bug[];
  commits: { x: number; y: number; taken: boolean }[];
  revealed: boolean[];
  popups: { index: number; x: number; y: number; age: number }[];
  stats: { commits: number; squashed: number; hurts: number; falls: number };
  time: number;
  won: boolean;
  /** False until the player's first key or tap after Play: nothing moves (bugs included) and the clock is stopped. */
  started: boolean;
}

const PLAYER_W = 10;
const PLAYER_H = 15;
const BUG_W = 12;
const BUG_H = 9;

export function createWorld(level: Level = buildLevel()): World {
  const px = level.start.col * TILE + (TILE - PLAYER_W) / 2;
  const py = (level.start.row + 1) * TILE - PLAYER_H;
  return {
    level,
    player: {
      x: px,
      y: py,
      w: PLAYER_W,
      h: PLAYER_H,
      vx: 0,
      vy: 0,
      onGround: true,
      facing: 1,
      coyote: 0,
      buffer: 0,
      jumpHeld: false,
      invulnerable: 0,
      safe: { x: px, y: py },
      stride: 0,
    },
    bugs: level.bugs.map((b) => ({
      x: b.col * TILE + (TILE - BUG_W) / 2,
      y: (b.row + 1) * TILE - BUG_H,
      w: BUG_W,
      h: BUG_H,
      vx: -PHYSICS.bugSpeed,
      alive: true,
      squashed: 0,
    })),
    commits: level.commits.map((c) => ({ x: c.col * TILE + 4, y: c.row * TILE + 4, taken: false })),
    revealed: level.blocks.map(() => false),
    popups: [],
    stats: { commits: 0, squashed: 0, hurts: 0, falls: 0 },
    time: 0,
    won: false,
    started: false,
  };
}

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

const overlaps = (a: Box, b: Box) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Solid tiles overlapped by a box. */
function solidTiles(level: Level, b: Box): { col: number; row: number; tile: Tile }[] {
  const out: { col: number; row: number; tile: Tile }[] = [];
  const c0 = Math.floor(b.x / TILE);
  const c1 = Math.floor((b.x + b.w - 0.001) / TILE);
  const r0 = Math.floor(b.y / TILE);
  const r1 = Math.floor((b.y + b.h - 0.001) / TILE);
  for (let r = r0; r <= r1; r++) {
    for (let c = c0; c <= c1; c++) {
      const tile = tileAt(level, c, r);
      if (isSolid(tile)) out.push({ col: c, row: r, tile });
    }
  }
  return out;
}

const approach = (v: number, target: number, delta: number) =>
  v < target ? Math.min(v + delta, target) : Math.max(v - delta, target);

function stepOnce(w: World, input: Input, dt: number, events: QuestEvent[]) {
  const p = w.player;
  const { level } = w;
  w.time += dt;
  p.invulnerable = Math.max(0, p.invulnerable - dt);

  // Horizontal control
  const dir = (input.right ? 1 : 0) - (input.left ? 1 : 0);
  if (dir !== 0) {
    p.facing = dir as 1 | -1;
    p.vx = approach(p.vx, dir * PHYSICS.runSpeed, (p.onGround ? PHYSICS.groundAccel : PHYSICS.airAccel) * dt);
  } else if (p.onGround) {
    p.vx = approach(p.vx, 0, PHYSICS.friction * dt);
  }

  // Jump: coyote time + input buffer + variable height
  if (input.jump && !p.jumpHeld) p.buffer = PHYSICS.jumpBuffer;
  else p.buffer = Math.max(0, p.buffer - dt);
  p.coyote = p.onGround ? PHYSICS.coyoteTime : Math.max(0, p.coyote - dt);
  if (p.buffer > 0 && p.coyote > 0) {
    p.vy = -PHYSICS.jumpVelocity;
    p.buffer = 0;
    p.coyote = 0;
    p.onGround = false;
    events.push({ type: 'jump' });
  }
  if (!input.jump && p.jumpHeld && p.vy < 0) p.vy *= PHYSICS.jumpCut;
  p.jumpHeld = input.jump;

  p.vy = Math.min(p.vy + PHYSICS.gravity * dt, PHYSICS.maxFall);

  // Move X, resolve against tiles
  p.x += p.vx * dt;
  let hits = solidTiles(level, p);
  if (hits.length) {
    if (p.vx > 0) p.x = Math.min(...hits.map((h) => h.col * TILE)) - p.w;
    else if (p.vx < 0) p.x = Math.max(...hits.map((h) => (h.col + 1) * TILE));
    p.vx = 0;
  }

  // Move Y, resolve against tiles; bumping a code block from below reveals a fact
  p.y += p.vy * dt;
  p.onGround = false;
  hits = solidTiles(level, p);
  if (hits.length) {
    if (p.vy > 0) {
      p.y = Math.min(...hits.map((h) => h.row * TILE)) - p.h;
      p.onGround = true;
    } else if (p.vy < 0) {
      const lowest = Math.max(...hits.map((h) => h.row));
      p.y = (lowest + 1) * TILE;
      const centre = Math.floor((p.x + p.w / 2) / TILE);
      const above = hits.filter((h) => h.row === lowest);
      const target = above.find((h) => h.col === centre) ?? above[0];
      if (target.tile === Tile.Block) {
        level.tiles[target.row * LEVEL_W + target.col] = Tile.UsedBlock;
        const index = level.blocks.findIndex((b) => b.col === target.col && b.row === target.row);
        if (index >= 0 && !w.revealed[index]) {
          w.revealed[index] = true;
          w.popups.push({ index, x: target.col * TILE + TILE / 2, y: target.row * TILE, age: 0 });
          events.push({ type: 'fact', index });
        }
      }
    }
    p.vy = 0;
  }
  if (p.onGround) {
    p.safe = { x: p.x, y: p.y };
    p.stride += Math.abs(p.vx) * dt;
  }

  // Bugs patrol and turn at walls and ledges
  for (const b of w.bugs) {
    if (!b.alive) {
      b.squashed += dt;
      continue;
    }
    b.x += b.vx * dt;
    const front = b.vx > 0 ? b.x + b.w : b.x;
    const col = Math.floor(front / TILE);
    const row = Math.floor((b.y + b.h - 1) / TILE);
    if (isSolid(tileAt(level, col, row)) || !isSolid(tileAt(level, col, row + 1))) {
      b.vx = -b.vx;
      b.x += b.vx * dt * 2;
    }
    if (overlaps(p, b)) {
      const fromAbove = p.vy >= 0 && p.y + p.h - b.y < 8;
      if (fromAbove) {
        b.alive = false;
        p.vy = -PHYSICS.stompBounce;
        w.stats.squashed++;
        events.push({ type: 'squash' });
      } else if (p.invulnerable === 0) {
        p.vx = (p.x + p.w / 2 < b.x + b.w / 2 ? -1 : 1) * PHYSICS.knockback;
        p.vy = -200;
        p.invulnerable = PHYSICS.invulnerable;
        w.stats.hurts++;
        events.push({ type: 'hurt' });
      }
    }
  }

  // Commits
  for (const c of w.commits) {
    if (!c.taken && overlaps(p, { x: c.x, y: c.y, w: 8, h: 8 })) {
      c.taken = true;
      w.stats.commits++;
      events.push({ type: 'commit' });
    }
  }

  // Fell into a pit: back to the last safe ground
  if (p.y > LEVEL_H * TILE + 24) {
    p.x = p.safe.x;
    p.y = p.safe.y;
    p.vx = 0;
    p.vy = 0;
    p.invulnerable = PHYSICS.invulnerable;
    w.stats.falls++;
    events.push({ type: 'fell' });
  }

  // Popups float and fade
  for (const pop of w.popups) pop.age += dt;
  w.popups = w.popups.filter((pop) => pop.age < 2.2);

  if (!w.won && p.x + p.w >= level.flagCol * TILE + 4) {
    w.won = true;
    events.push({ type: 'won' });
  }
}

/** Advance the world (once started); long frames are split so nothing tunnels through tiles. */
export function step(w: World, input: Input, dt: number): QuestEvent[] {
  const events: QuestEvent[] = [];
  if (w.won || !w.started) return events;
  let remaining = Math.min(dt, 0.1);
  while (remaining > 0) {
    const slice = Math.min(remaining, 1 / 120);
    stepOnce(w, input, slice, events);
    remaining -= slice;
    if (w.won) break;
  }
  return events;
}

export function cameraX(w: World): number {
  const target = w.player.x + w.player.w / 2 - VIEW_W * 0.4;
  return Math.max(0, Math.min(target, LEVEL_W * TILE - VIEW_W));
}
