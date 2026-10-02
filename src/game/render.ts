import { cameraX, VIEW_H, VIEW_W, type World } from './engine';
import type { QuestFact } from './facts';
import { LEVEL_H, LEVEL_W, Tile, TILE } from './level';
import type { FrameName, Palette, Sprites } from './sprites';

const BRACES = ['.x...x.', 'x.....x', 'x.....x', '.x...x.', 'x.....x', 'x.....x', '.x...x.'];

function drawBlock(ctx: CanvasRenderingContext2D, x: number, y: number, p: Palette, used: boolean) {
  ctx.fillStyle = used ? p.used : p.accentSoft;
  ctx.fillRect(x + 1, y + 1, TILE - 2, TILE - 2);
  ctx.strokeStyle = used ? p.brickLine : p.accent;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1.5, y + 1.5, TILE - 3, TILE - 3);
  if (used) return;
  ctx.fillStyle = p.accent;
  BRACES.forEach((row, ry) =>
    [...row].forEach((ch, rx) => {
      if (ch === 'x') ctx.fillRect(x + 4 + rx, y + 4 + ry, 1, 1);
    }),
  );
}

function playerFrame(w: World): FrameName {
  const pl = w.player;
  if (!pl.onGround) return 'jump';
  if (Math.abs(pl.vx) < 8) return 'stand';
  return Math.floor(pl.stride / 7) % 2 === 0 ? 'run1' : 'run2';
}

export function render(
  ctx: CanvasRenderingContext2D,
  w: World,
  sprites: Sprites,
  p: Palette,
  facts: QuestFact[],
  t: number,
) {
  const cam = Math.round(cameraX(w));
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Background dot grid with gentle parallax
  ctx.fillStyle = p.grid;
  const off = (cam * 0.5) % 16;
  for (let gx = -off; gx < VIEW_W; gx += 16) for (let gy = 8; gy < VIEW_H; gy += 16) ctx.fillRect(gx, gy, 1, 1);

  // Distant server racks with status LEDs (slow parallax)
  const par = cam * 0.3;
  const RACK = 58;
  for (let i = Math.floor(par / RACK) - 1; i <= Math.floor((par + VIEW_W) / RACK) + 1; i++) {
    const x = Math.round(i * RACK - par);
    const h = 44 + ((((i * 37) % 5) + 5) % 5) * 12;
    const y = 10 * TILE - h;
    ctx.fillStyle = p.rack;
    ctx.fillRect(x, y, 34, h);
    for (let ly = y + 6; ly < 10 * TILE - 4; ly += 8) {
      const on = (Math.floor(t * 2) + i + ly) % 3 !== 0;
      ctx.fillStyle = on ? p.ok : p.grid;
      ctx.fillRect(x + 4, ly, 2, 1);
      ctx.fillStyle = p.grid;
      ctx.fillRect(x + 9, ly, 20, 1);
    }
  }

  ctx.save();
  ctx.translate(-cam, 0);

  // Tiles in view
  const c0 = Math.max(0, Math.floor(cam / TILE));
  const c1 = Math.min(LEVEL_W - 1, Math.ceil((cam + VIEW_W) / TILE));
  for (let r = 0; r < LEVEL_H; r++) {
    for (let c = c0; c <= c1; c++) {
      const tile = w.level.tiles[r * LEVEL_W + c];
      const x = c * TILE;
      const y = r * TILE;
      if (tile === Tile.Ground) {
        ctx.fillStyle = p.ground;
        ctx.fillRect(x, y, TILE, TILE);
        const above = r > 0 ? w.level.tiles[(r - 1) * LEVEL_W + c] : Tile.Empty;
        if (above === Tile.Empty) {
          ctx.fillStyle = p.groundTop;
          ctx.fillRect(x, y, TILE, 2);
        }
      } else if (tile === Tile.Brick) {
        ctx.fillStyle = p.brick;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = p.brickLine;
        ctx.fillRect(x, y + 7, TILE, 1);
        ctx.fillRect(x + (r % 2 ? 4 : 11), y, 1, 7);
        ctx.fillRect(x + (r % 2 ? 11 : 4), y + 8, 1, 8);
      } else if (tile === Tile.Block || tile === Tile.UsedBlock) {
        drawBlock(ctx, x, y, p, tile === Tile.UsedBlock);
      }
    }
  }

  // Commits: little contribution-graph squares
  for (const c of w.commits) {
    if (c.taken) continue;
    const bob = Math.round(Math.sin(t * 4 + c.x * 0.1));
    ctx.fillStyle = p.ok;
    ctx.fillRect(c.x + 1, c.y + 1 + bob, 6, 6);
    ctx.fillStyle = p.bg;
    ctx.fillRect(c.x + 2, c.y + 2 + bob, 1, 1);
  }

  // Flag: the resume
  const fx = w.level.flagCol * TILE + 6;
  const groundY = 10 * TILE;
  ctx.fillStyle = p.groundTop;
  ctx.fillRect(fx, groundY - 7 * TILE, 2, 7 * TILE);
  ctx.fillStyle = p.accent;
  ctx.fillRect(fx + 2, groundY - 7 * TILE + 2, 18, 12);
  ctx.fillStyle = p.bg;
  ctx.font = '600 8px "Geist Mono Variable", monospace';
  ctx.fillText('CV', fx + 5, groundY - 7 * TILE + 11);
  ctx.fillStyle = p.textDim;
  ctx.fillText('resume.pdf', fx - 16, groundY - 7 * TILE - 4);

  // Bugs
  for (const b of w.bugs) {
    if (b.alive) ctx.drawImage(sprites.bug, Math.round(b.x), Math.round(b.y));
    else if (b.squashed < 0.6) ctx.drawImage(sprites.bugSquashed, Math.round(b.x), Math.round(b.y + b.h - 4));
  }

  // Player (blinks while invulnerable)
  const pl = w.player;
  if (pl.invulnerable === 0 || Math.floor(t * 12) % 2 === 0) {
    const frame = sprites.player[playerFrame(w)][pl.facing === 1 ? 'right' : 'left'];
    ctx.drawImage(frame, Math.round(pl.x - 1), Math.round(pl.y - 1));
  }

  // Fact popups rise out of the blocks
  ctx.textAlign = 'center';
  for (const pop of w.popups) {
    const fact = facts[pop.index];
    if (!fact) continue;
    const alpha = pop.age < 1.6 ? 1 : Math.max(0, 1 - (pop.age - 1.6) / 0.6);
    const y = Math.max(24, pop.y - 6 - Math.min(pop.age, 0.6) * 30);
    ctx.globalAlpha = alpha;
    ctx.font = '600 8px "Geist Variable", sans-serif';
    const width = Math.max(ctx.measureText(fact.label).width, ctx.measureText(fact.detail).width) + 10;
    ctx.fillStyle = p.bg;
    ctx.fillRect(pop.x - width / 2, y - 18, width, 22);
    ctx.strokeStyle = p.accent;
    ctx.strokeRect(pop.x - width / 2 + 0.5, y - 17.5, width - 1, 21);
    ctx.fillStyle = p.text;
    ctx.fillText(fact.label, pop.x, y - 9);
    ctx.fillStyle = p.accent;
    ctx.font = '500 7px "Geist Mono Variable", monospace';
    ctx.fillText(fact.detail, pop.x, y);
    ctx.globalAlpha = 1;
  }
  ctx.textAlign = 'start';
  ctx.restore();
}
