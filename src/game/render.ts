import {
  BULLET_SIZE,
  COLORS,
  COLS,
  POWERUP_BLINK,
  POWER_META,
  ROWS,
  TILE,
  TANK_SIZE,
  Tile,
  type DirId,
} from "./constants";
import type { Airstrike, Explosion, PowerUp, Tank } from "./types";
import type { TankGame } from "./engine";

let nightCanvas: HTMLCanvasElement | null = null;

export function renderGame(ctx: CanvasRenderingContext2D, game: TankGame, time: number) {
  let ox = 0;
  let oy = 0;
  if (game.shakeTime > 0 && game.shakeMag > 0) {
    const m = game.shakeMag;
    ox = Math.sin(time / 17) * m;
    oy = Math.cos(time / 23) * m;
  }
  ctx.save();
  ctx.translate(ox, oy);
  ctx.fillStyle = COLORS.bg;
  ctx.fillRect(-12, -12, COLS * TILE + 24, ROWS * TILE + 24);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const id = game.tiles[r]?.[c];
      if (id === undefined || id === Tile.Empty || id === Tile.Forest) continue;
      drawTile(ctx, c, r, id, time);
    }
  }

  for (const t of game.tanks) drawTank(ctx, t, time);
  for (const t of game.tanks) {
    if (t.isPlayer || !t.active || t.spawnTimer > 0) continue;
    if (game.freezeTimer > 0) drawFrozenOverlay(ctx, t);
  }
  for (const b of game.bullets) drawBullet(ctx, b);

  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (game.tiles[r]?.[c] === Tile.Forest) drawForest(ctx, c, r);
    }
  }

  for (const p of game.powerups) drawPowerup(ctx, p, time);
  for (const e of game.explosions) drawExplosion(ctx, e);
  for (const p of game.particles) drawParticle(ctx, p);
  if (game.night) drawNight(ctx, game);
  for (const a of game.airstrikes) drawAirstrike(ctx, a, time);
  ctx.restore();
}

function drawParticle(ctx: CanvasRenderingContext2D, p: { x: number; y: number; t: number; dur: number; color: string }) {
  const a = 1 - p.t / p.dur;
  ctx.globalAlpha = Math.max(0, a);
  ctx.fillStyle = p.color;
  ctx.fillRect(p.x - 1.5, p.y - 1.5, 3, 3);
  ctx.globalAlpha = 1;
}

function drawNight(ctx: CanvasRenderingContext2D, game: TankGame) {
  if (typeof document === "undefined") return;
  if (!nightCanvas) nightCanvas = document.createElement("canvas");
  const nc = nightCanvas;
  const W = COLS * TILE;
  const H = ROWS * TILE;
  if (nc.width !== W) {
    nc.width = W;
    nc.height = H;
  }
  const nctx = nc.getContext("2d");
  if (!nctx) return;
  nctx.clearRect(0, 0, W, H);
  nctx.fillStyle = "rgba(2,4,10,0.9)";
  nctx.fillRect(0, 0, W, H);
  nctx.globalCompositeOperation = "destination-out";
  for (const p of game.players) {
    if (!p) continue;
    const cx = p.x + TANK_SIZE / 2;
    const cy = p.y + TANK_SIZE / 2;
    const r = TANK_SIZE * 2.4;
    const g = nctx.createRadialGradient(cx, cy, 2, cx, cy, r);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.55, "rgba(255,255,255,0.65)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    nctx.fillStyle = g;
    nctx.beginPath();
    nctx.arc(cx, cy, r, 0, Math.PI * 2);
    nctx.fill();
  }
  nctx.globalCompositeOperation = "source-over";
  ctx.drawImage(nc, 0, 0);
}

function drawAirstrike(ctx: CanvasRenderingContext2D, a: Airstrike, time: number) {
  if (a.detonated) return;
  const blink = Math.floor(time / 120) % 2 === 0;
  const prog = 1 - a.timer / a.warn;
  const r = a.radius * (1 - prog * 0.35);
  ctx.strokeStyle = blink ? "#ff3d3d" : "rgba(255,61,61,0.35)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(a.x, a.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(a.x - r, a.y);
  ctx.lineTo(a.x - 5, a.y);
  ctx.moveTo(a.x + 5, a.y);
  ctx.lineTo(a.x + r, a.y);
  ctx.moveTo(a.x, a.y - r);
  ctx.lineTo(a.x, a.y - 5);
  ctx.moveTo(a.x, a.y + 5);
  ctx.lineTo(a.x, a.y + r);
  ctx.stroke();
  ctx.fillStyle = "#ff3d3d";
  ctx.fillRect(a.x - 1.5, a.y - 1.5, 3, 3);
}

function drawTile(ctx: CanvasRenderingContext2D, c: number, r: number, id: number, time: number) {
  const x = c * TILE;
  const y = r * TILE;
  if (id === Tile.Brick) {
    ctx.fillStyle = COLORS.brick;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.brickDark;
    const bh = TILE / 4;
    for (let i = 0; i < 4; i++) {
      const yy = y + i * bh;
      ctx.fillRect(x, yy + bh - 1, TILE, 1);
      const off = i % 2 === 0 ? 0 : TILE / 2;
      ctx.fillRect(x + off, yy, 1, bh);
      ctx.fillRect(x + (off + TILE / 2) % TILE, yy, 1, bh);
    }
  } else if (id === Tile.Steel) {
    ctx.fillStyle = COLORS.steel;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.steelDark;
    ctx.fillRect(x, y, TILE, 3);
    ctx.fillRect(x, y, 3, TILE);
    ctx.fillStyle = "#c4c9ce";
    ctx.fillRect(x, y, 3, 3);
  } else if (id === Tile.Water) {
    const flip = Math.floor(time / 400) % 2 === 0;
    ctx.fillStyle = flip ? COLORS.water1 : COLORS.water2;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = flip ? COLORS.water2 : COLORS.water1;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(x + 2 + i * 10, y + 4 + (i % 2) * 6, 6, 3);
    }
  } else if (id === Tile.Base) {
    ctx.fillStyle = COLORS.baseDark;
    ctx.fillRect(x, y, TILE, TILE);
    ctx.fillStyle = COLORS.base;
    ctx.fillRect(x + 4, y + 6, TILE - 8, TILE - 12);
    ctx.beginPath();
    ctx.moveTo(x + TILE / 2, y + 4);
    ctx.lineTo(x + TILE - 6, y + 12);
    ctx.lineTo(x + 6, y + 12);
    ctx.closePath();
    ctx.fill();
  }
}

function drawForest(ctx: CanvasRenderingContext2D, c: number, r: number) {
  const x = c * TILE;
  const y = r * TILE;
  ctx.fillStyle = COLORS.forestDark;
  ctx.fillRect(x, y, TILE, TILE);
  ctx.fillStyle = COLORS.forest;
  for (let i = 0; i < 4; i++) {
    const cx = x + 4 + (i % 2) * 16;
    const cy = y + 4 + Math.floor(i / 2) * 16;
    ctx.beginPath();
    ctx.arc(cx, cy, 7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function tankColor(t: Tank): string {
  if (t.isPlayer) return t.playerIndex === 1 ? COLORS.player2 : COLORS.player;
  if (t.type === "fast") return COLORS.fast;
  if (t.type === "armor") return COLORS.armor;
  if (t.type === "heavy") return COLORS.heavy;
  if (t.type === "boss") return COLORS.boss;
  return COLORS.basic;
}

function tankDark(t: Tank): string {
  if (t.isPlayer) return t.playerIndex === 1 ? COLORS.player2Dark : COLORS.playerDark;
  if (t.type === "fast") return "#b03a3a";
  if (t.type === "armor") return "#2e7d32";
  if (t.type === "heavy") return "#311b92";
  if (t.type === "boss") return "#7f1d0d";
  return "#7a7a7a";
}

export function drawTank(ctx: CanvasRenderingContext2D, t: Tank, time: number) {
  if (t.spawnTimer > 0) {
    const cx = t.x + TANK_SIZE / 2;
    const cy = t.y + TANK_SIZE / 2;
    const pulse = (Math.sin(time / 60) + 1) / 2;
    ctx.fillStyle = `rgba(255,255,255,${0.4 + pulse * 0.5})`;
    ctx.beginPath();
    const s = 14 - pulse * 4;
    ctx.moveTo(cx, cy - s);
    ctx.lineTo(cx + s, cy);
    ctx.lineTo(cx, cy + s);
    ctx.lineTo(cx - s, cy);
    ctx.closePath();
    ctx.fill();
    const blink = Math.floor(time / 100) % 2 === 0;
    ctx.strokeStyle = blink ? "#ff3d3d" : "rgba(255,61,61,0.4)";
    ctx.lineWidth = 2;
    ctx.strokeRect(t.x - 2, t.y - 2, TANK_SIZE + 4, TANK_SIZE + 4);
    ctx.beginPath();
    ctx.moveTo(cx - TANK_SIZE / 2 - 4, cy);
    ctx.lineTo(cx - 3, cy);
    ctx.moveTo(cx + 3, cy);
    ctx.lineTo(cx + TANK_SIZE / 2 + 4, cy);
    ctx.moveTo(cx, cy - TANK_SIZE / 2 - 4);
    ctx.lineTo(cx, cy - 3);
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx, cy + TANK_SIZE / 2 + 4);
    ctx.stroke();
    return;
  }
  if (t.invuln > 0 && Math.floor(time / 90) % 2 === 0 && t.isPlayer) return;

  const cx = t.x + TANK_SIZE / 2;
  const cy = t.y + TANK_SIZE / 2;
  const angle = (t.dir as DirId) * (Math.PI / 2);
  let main = tankColor(t);
  let dark = tankDark(t);
  if (t.bonus && Math.floor(time / 100) % 2 === 0) {
    main = COLORS.bonus;
    dark = "#7a0000";
  }
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  const S = TANK_SIZE;
  const h = S / 2;
  ctx.fillStyle = dark;
  ctx.fillRect(-h, -h, 5, S);
  ctx.fillRect(h - 5, -h, 5, S);
  ctx.fillStyle = main;
  ctx.fillRect(-h + 6, -h + 2, S - 12, S - 4);
  ctx.fillStyle = dark;
  ctx.fillRect(-3, -h, 6, h + 4);
  ctx.fillStyle = main;
  ctx.fillRect(-6, -h + 4, 12, 6);
  if (t.moving && Math.floor(time / 60) % 2 === 0) {
    ctx.fillStyle = dark;
    ctx.fillRect(-h, -h + 3, 5, 4);
    ctx.fillRect(h - 5, -h + 3, 5, 4);
    ctx.fillRect(-h, h - 7, 5, 4);
    ctx.fillRect(h - 5, h - 7, 5, 4);
  }
  if (t.isPlayer && t.invuln > 0) {
    ctx.strokeStyle = "rgba(255,255,255,0.8)";
    ctx.lineWidth = 1;
    ctx.strokeRect(-h, -h, S, S);
  }
  ctx.restore();
  if (t.type === "boss" || t.type === "heavy") {
    const maxHp = t.type === "boss" ? 6 : 3;
    const w = TANK_SIZE;
    const seg = w / maxHp;
    for (let i = 0; i < maxHp; i++) {
      ctx.fillStyle = i < t.hp ? (t.type === "boss" ? "#ff3d3d" : "#b39ddb") : "rgba(255,255,255,0.15)";
      ctx.fillRect(t.x + i * seg, t.y - 4, seg - 1, 2);
    }
  }
  if (t.type === "boss") {
    ctx.fillStyle = "#ffd24a";
    ctx.beginPath();
    ctx.moveTo(t.x + 4, t.y - 6);
    ctx.lineTo(t.x + 8, t.y - 10);
    ctx.lineTo(t.x + 12, t.y - 6);
    ctx.lineTo(t.x + 16, t.y - 10);
    ctx.lineTo(t.x + 20, t.y - 6);
    ctx.lineTo(t.x + 24, t.y - 10);
    ctx.lineTo(t.x + TANK_SIZE, t.y - 6);
    ctx.lineTo(t.x + TANK_SIZE, t.y - 3);
    ctx.lineTo(t.x + 4, t.y - 3);
    ctx.closePath();
    ctx.fill();
  }
}

function drawFrozenOverlay(ctx: CanvasRenderingContext2D, t: Tank) {
  ctx.fillStyle = "rgba(120,180,255,0.35)";
  ctx.fillRect(t.x, t.y, TANK_SIZE, TANK_SIZE);
  ctx.strokeStyle = "rgba(200,225,255,0.6)";
  ctx.lineWidth = 1;
  ctx.strokeRect(t.x + 0.5, t.y + 0.5, TANK_SIZE - 1, TANK_SIZE - 1);
}

function drawBullet(ctx: CanvasRenderingContext2D, b: { x: number; y: number }) {
  ctx.fillStyle = COLORS.bullet;
  ctx.fillRect(b.x, b.y, BULLET_SIZE, BULLET_SIZE);
  ctx.fillStyle = "#ffd24a";
  ctx.fillRect(b.x + 2, b.y + 2, BULLET_SIZE - 4, BULLET_SIZE - 4);
}

function drawPowerup(ctx: CanvasRenderingContext2D, p: PowerUp, time: number) {
  if (p.life < POWERUP_BLINK && Math.floor(time / 120) % 2 === 0) return;
  const meta = POWER_META[p.type];
  const pulse = (Math.sin(time / 180) + 1) / 2;
  const pad = 1 + pulse * 1.5;
  ctx.fillStyle = meta.dark;
  ctx.fillRect(p.x - pad, p.y - pad, TANK_SIZE + pad * 2, TANK_SIZE + pad * 2);
  ctx.fillStyle = meta.color;
  ctx.fillRect(p.x, p.y, TANK_SIZE, TANK_SIZE);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `bold ${Math.floor(TANK_SIZE * 0.62)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(meta.label, p.x + TANK_SIZE / 2, p.y + TANK_SIZE / 2 + 1);
}

function drawExplosion(ctx: CanvasRenderingContext2D, e: Explosion) {
  const p = e.t / e.dur;
  const radius = (e.big ? 22 : 12) * (0.4 + p * 0.9);
  const idx = Math.min(COLORS.explosion.length - 1, Math.floor(p * COLORS.explosion.length));
  ctx.fillStyle = COLORS.explosion[idx];
  ctx.globalAlpha = 1 - p;
  ctx.beginPath();
  ctx.arc(e.x, e.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}
