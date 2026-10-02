import { describe, expect, it } from 'vitest';
import { cameraX, createWorld, PHYSICS, step, VIEW_W, type Input, type QuestEvent, type World } from './engine';
import { questFacts } from './facts';
import { buildLevel, GROUND_ROW, isSolid, LEVEL_H, LEVEL_W, Tile, TILE, tileAt } from './level';

const idle: Input = { left: false, right: false, jump: false };
const run = (w: World, input: Input, seconds: number) => {
  const events: QuestEvent[] = [];
  for (let t = 0; t < seconds; t += 1 / 60) events.push(...step(w, input, 1 / 60));
  return events;
};

describe('level', () => {
  const level = buildLevel();

  it('has one fact block per fact, a start and a flag', () => {
    expect(level.blocks).toHaveLength(questFacts().length);
    expect(level.tiles).toHaveLength(LEVEL_W * LEVEL_H);
    expect(level.flagCol).toBeLessThan(LEVEL_W);
    expect(isSolid(tileAt(level, level.start.col, level.start.row + 1))).toBe(true);
  });

  it('every fact block can be head-bumped from a surface below it', () => {
    for (const b of level.blocks) {
      expect(tileAt(level, b.col, b.row + 1), `tile under block ${b.col},${b.row}`).toBe(Tile.Empty);
      // Standing on surface row s, the head reaches about 74 px above it: s must be within row+2..row+5.
      const reachable = [-1, 0, 1].some((dc) =>
        [2, 3, 4, 5].some((dr) => {
          const s = b.row + dr;
          return isSolid(tileAt(level, b.col + dc, s)) && !isSolid(tileAt(level, b.col + dc, s - 1));
        }),
      );
      expect(reachable, `block at ${b.col},${b.row}`).toBe(true);
    }
  });

  it('gaps are jumpable (≤ 3 tiles)', () => {
    let gap = 0;
    for (let c = 0; c < LEVEL_W; c++) {
      gap = isSolid(tileAt(level, c, GROUND_ROW)) ? 0 : gap + 1;
      expect(gap).toBeLessThanOrEqual(3);
    }
  });
});

describe('player physics', () => {
  it('stands still on the ground', () => {
    const w = createWorld();
    const y = w.player.y;
    run(w, idle, 1);
    expect(w.player.y).toBeCloseTo(y, 5);
    expect(w.player.onGround).toBe(true);
  });

  it('runs right and is stopped by walls', () => {
    const w = createWorld();
    const x = w.player.x;
    run(w, { ...idle, right: true }, 0.5);
    expect(w.player.x).toBeGreaterThan(x + 30);
    // Level edge acts as a wall.
    const left = createWorld();
    run(left, { ...idle, left: true }, 2);
    expect(left.player.x).toBeGreaterThanOrEqual(0);
  });

  it('jump height matches the tuned apex (~59 px) and lands again', () => {
    const w = createWorld();
    const ground = w.player.y;
    let apex = ground;
    step(w, { ...idle, jump: true }, 1 / 60);
    for (let i = 0; i < 90; i++) {
      step(w, { ...idle, jump: true }, 1 / 60);
      apex = Math.min(apex, w.player.y);
    }
    expect(ground - apex).toBeGreaterThan(50);
    expect(ground - apex).toBeLessThan(65);
    expect(w.player.onGround).toBe(true);
  });

  it('releasing jump early gives a shorter hop', () => {
    const full = createWorld();
    const short = createWorld();
    const g = full.player.y;
    let apexFull = g;
    let apexShort = g;
    for (let i = 0; i < 60; i++) {
      step(full, { ...idle, jump: true }, 1 / 60);
      step(short, { ...idle, jump: i < 4 }, 1 / 60);
      apexFull = Math.min(apexFull, full.player.y);
      apexShort = Math.min(apexShort, short.player.y);
    }
    expect(g - apexShort).toBeLessThan((g - apexFull) * 0.7);
  });

  it('bumping a code block reveals its fact exactly once', () => {
    const w = createWorld();
    const first = w.level.blocks[0];
    w.player.x = first.col * TILE + (TILE - w.player.w) / 2;
    const events = run(w, { ...idle, jump: true }, 0.6);
    expect(events).toContainEqual({ type: 'fact', index: 0 });
    expect(w.revealed[0]).toBe(true);
    expect(tileAt(w.level, first.col, first.row)).toBe(Tile.UsedBlock);
    // A second bump does nothing new.
    const again = run(w, { ...idle, jump: true }, 0.6);
    expect(again.filter((e) => e.type === 'fact')).toHaveLength(0);
  });

  it('stomping a bug squashes it; touching it from the side hurts', () => {
    const stomp = createWorld();
    const bug = stomp.bugs[0];
    stomp.player.x = bug.x;
    stomp.player.y = bug.y - stomp.player.h - 6;
    stomp.player.vy = 200;
    stomp.player.onGround = false;
    const e1 = run(stomp, idle, 0.1);
    expect(e1).toContainEqual({ type: 'squash' });
    expect(bug.alive).toBe(false);

    const side = createWorld();
    const b2 = side.bugs[0];
    side.player.x = b2.x - side.player.w + 2;
    side.player.y = b2.y + b2.h - side.player.h;
    const e2 = run(side, idle, 0.05);
    expect(e2).toContainEqual({ type: 'hurt' });
    expect(side.player.invulnerable).toBeGreaterThan(0);
    expect(side.stats.hurts).toBe(1);
  });

  it('falling into a pit respawns on the last safe ground', () => {
    const w = createWorld();
    w.player.x = 27 * TILE; // over the first gap
    w.player.y = GROUND_ROW * TILE;
    w.player.onGround = false;
    const events = run(w, idle, 1);
    expect(events).toContainEqual({ type: 'fell' });
    expect(w.player.y).toBeLessThan(LEVEL_H * TILE);
  });

  it('collects commits', () => {
    const w = createWorld();
    const c = w.commits[0];
    w.player.x = c.x;
    w.player.y = c.y;
    const events = step(w, idle, 1 / 60);
    expect(events).toContainEqual({ type: 'commit' });
    expect(w.stats.commits).toBe(1);
  });

  it('camera follows the player and stays inside the level', () => {
    const w = createWorld();
    expect(cameraX(w)).toBe(0);
    w.player.x = LEVEL_W * TILE;
    expect(cameraX(w)).toBe(LEVEL_W * TILE - VIEW_W);
  });
});

describe('the level is beatable', () => {
  it('a simple bot reaches the flag', () => {
    const w = createWorld();
    let won = false;
    for (let frame = 0; frame < 60 * 120 && !won; frame++) {
      const p = w.player;
      const aheadCol = Math.floor((p.x + p.w + 6) / TILE);
      const feetRow = Math.floor((p.y + p.h - 1) / TILE);
      const wallAhead = isSolid(tileAt(w.level, aheadCol, feetRow));
      const pitAhead =
        !isSolid(tileAt(w.level, aheadCol, feetRow + 1)) && !isSolid(tileAt(w.level, aheadCol + 1, feetRow + 1));
      const bugAhead = w.bugs.some((b) => b.alive && b.x - (p.x + p.w) < 26 && b.x > p.x && Math.abs(b.y - p.y) < 20);
      const jump = (wallAhead || pitAhead || bugAhead) && p.onGround;
      won = step(w, { left: false, right: true, jump: jump || (!p.onGround && p.vy < 0) }, 1 / 60).some(
        (e) => e.type === 'won',
      );
    }
    expect(won).toBe(true);
    expect(w.won).toBe(true);
    expect(w.time).toBeLessThan(90);
  });

  it('nothing advances after winning', () => {
    const w = createWorld();
    w.won = true;
    const x = w.player.x;
    expect(step(w, { ...idle, right: true }, 1)).toEqual([]);
    expect(w.player.x).toBe(x);
  });

  it('physics constants keep gaps jumpable', () => {
    const air = (2 * PHYSICS.jumpVelocity) / PHYSICS.gravity;
    expect(PHYSICS.runSpeed * air).toBeGreaterThan(3 * TILE + 8);
  });
});
