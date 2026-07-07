import {
  BONUS_EVERY,
  BULLET_SIZE,
  BULLET_SPEED,
  COLORS,
  COLS,
  COMBO_BONUS,
  COMBO_WINDOW,
  Dir,
  DIR_VEC,
  ENEMY_FIRE_CHANCE,
  ENEMY_MAX_ONSCREEN,
  ENEMY_SPEED_ARMOR,
  ENEMY_SPEED_BASIC,
  ENEMY_SPEED_BOSS,
  ENEMY_SPEED_FAST,
  ENEMY_SPEED_HEAVY,
  ENEMY_TOTAL,
  EXPLOSION_DUR,
  FREEZE_DUR,
  HELMET_DUR,
  HS_KEY,
  INTRO_DUR,
  NO_DEATH_BONUS,
  PLAYER_BULLET_SPEED,
  PLAYER_BULLET_SPEED_UP,
  PLAYER_LIVES,
  PLAYER_SPEED,
  PLAYER_SPEED_BOOST,
  POWERUP_BLINK,
  POWERUP_LIFETIME,
  POWERUP_SCORE,
  Power,
  RESPAWN_INVULN,
  ROWS,
  SCORE,
  SHAKE_DUR,
  SHOOT_CD_ARMOR,
  SHOOT_CD_BASIC,
  SHOOT_CD_BOSS,
  SHOOT_CD_FAST,
  SHOOT_CD_HEAVY,
  SHOOT_CD_PLAYER,
  SHOVEL_DUR,
  SOLID,
  SPREAD_DUR,
  SPEED_DUR,
  SPAWN_ANIM,
  BOSS_EVERY,
  TILE,
  TANK_SIZE,
  Tile,
  type DirId,
  type GameEvent,
  type PowerId,
  type TileId,
} from "./constants";
import { ENEMY_SPAWNS, PLAYER_SPAWN, levelFor } from "./maps";
import type {
  Airstrike,
  Bullet,
  EnemyType,
  Explosion,
  GameStats,
  Particle,
  PowerUp,
  Tank,
} from "./types";
import {
  addCredits,
  getUpgrades,
  respawnInvulnBonus,
} from "./upgrades";

const TANK_OFFSET = (TILE - TANK_SIZE) / 2;

interface LevelConfig {
  total: number;
  maxOn: number;
  spawnDelay: number;
  speedMul: number;
  fireMul: number;
  armorP: number;
  fastP: number;
  heavyP: number;
  boss: boolean;
}

function laneCenter(axis: number): number {
  return axis * TILE + TANK_OFFSET;
}

function nearestLane(pixel: number): number {
  const c = Math.round((pixel - TANK_OFFSET) / TILE);
  return Math.max(0, Math.min(COLS - 1, c));
}

function aabb(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function configFor(level: number, mode: "campaign" | "endless" = "campaign"): LevelConfig {
  const n = level;
  if (mode === "endless") {
    return {
      total: 12 + (n - 1) * 3,
      maxOn: Math.min(8, 4 + Math.floor((n - 1) / 2)),
      spawnDelay: Math.max(700, 2200 - (n - 1) * 150),
      speedMul: 1 + (n - 1) * 0.1,
      fireMul: 1 + (n - 1) * 0.15,
      armorP: Math.min(0.55, 0.15 + (n - 1) * 0.05),
      fastP: Math.min(0.5, 0.25 + (n - 1) * 0.04),
      heavyP: Math.min(0.4, (n - 1) * 0.05),
      boss: false,
    };
  }
  return {
    total: Math.min(28, ENEMY_TOTAL + (n - 1) * 2),
    maxOn: Math.min(6, ENEMY_MAX_ONSCREEN + Math.floor((n - 1) / 3)),
    spawnDelay: Math.max(1100, 2200 - (n - 1) * 130),
    speedMul: 1 + (n - 1) * 0.06,
    fireMul: 1 + (n - 1) * 0.12,
    armorP: Math.min(0.5, 0.15 + (n - 1) * 0.04),
    fastP: Math.min(0.45, 0.25 + (n - 1) * 0.03),
    heavyP: Math.min(0.3, (n - 1) * 0.04),
    boss: n % BOSS_EVERY === 0,
  };
}

export class TankGame {
  tiles: TileId[][] = [];
  tanks: Tank[] = [];
  bullets: Bullet[] = [];
  explosions: Explosion[] = [];
  powerups: PowerUp[] = [];
  particles: Particle[] = [];
  airstrikes: Airstrike[] = [];
  shakeTime = 0;
  shakeMag = 0;
  players: (Tank | null)[] = [null, null];
  playerLives: number[] = [PLAYER_LIVES, PLAYER_LIVES];
  playerLevel: number[] = [0, 0];
  spreadTimer: number[] = [0, 0];
  speedTimer: number[] = [0, 0];
  twoPlayer = false;
  mode: "campaign" | "endless" = "campaign";
  night = false;
  private airstrikeTimer = 0;
  freezeTimer = 0;
  shovelTimer = 0;
  private bossSpawned = false;
  private credited = false;
  baseTile: { r: number; c: number } | null = null;
  private cfg: LevelConfig = configFor(1);
  private highScore = 0;
  private comboCount = 0;
  private comboTimer = 0;
  private levelNoDeath = true;
  private introTimer = 0;
  private playTimeMs = 0;
  stats: GameStats = {
    status: "ready",
    lives: PLAYER_LIVES,
    lives2: PLAYER_LIVES,
    score: 0,
    highScore: 0,
    level: 1,
    enemiesLeft: ENEMY_TOTAL,
    enemiesOnscreen: 0,
    playerLevel: 0,
    playerLevel2: 0,
    combo: 0,
    twoPlayer: false,
    intro: false,
    enemiesDestroyed: 0,
    playTimeSeconds: 0,
    mode: "campaign",
    night: false,
  };
  private onStats: (s: GameStats) => void;
  private onEvent: (e: GameEvent) => void;
  private nextId = 1;
  private heldDir: (DirId | null)[] = [null, null];
  private wantShoot: boolean[] = [false, false];
  private spawnQueue = 0;
  private spawnTimer = 0;
  private spawnCursor = 0;
  private spawnedCount = 0;
  private respawnTimer: number[] = [0, 0];
  private winTimer = 0;
  private lastStatsKey = "";

  constructor(
    onStats: (s: GameStats) => void,
    onEvent: (e: GameEvent) => void,
  ) {
    this.onStats = onStats;
    this.onEvent = onEvent;
    this.highScore = this.loadHighScore();
    this.stats.highScore = this.highScore;
  }

  private loadHighScore(): number {
    return 0;
  }

  private saveHighScore() {
    if (this.stats.score > this.highScore) {
      this.highScore = this.stats.score;
    }
    this.stats.highScore = this.highScore;
  }

  private emit() {
    this.stats.enemiesOnscreen = this.tanks.filter((t) => !t.isPlayer).length;
    this.stats.enemiesLeft = this.spawnQueue + this.stats.enemiesOnscreen;
    this.stats.playerLevel = this.playerLevel[0];
    this.stats.playerLevel2 = this.playerLevel[1];
    this.stats.lives = this.playerLives[0];
    this.stats.lives2 = this.playerLives[1];
    this.stats.combo = this.comboCount;
    this.stats.twoPlayer = this.twoPlayer;
    this.stats.mode = this.mode;
    this.stats.night = this.night;
    this.stats.intro = this.introTimer > 0;
    this.stats.playTimeSeconds = Math.floor(this.playTimeMs / 1000);
    const key = JSON.stringify(this.stats);
    if (key !== this.lastStatsKey) {
      this.lastStatsKey = key;
      this.onStats({ ...this.stats });
    }
  }

  private fire(ev: GameEvent) {
    this.onEvent(ev);
  }

  private grantCredits() {
    if (this.credited) return;
    this.credited = true;
    addCredits(this.stats.score);
  }

  setTwoPlayer(v: boolean) {
    if (this.stats.status !== "ready" && this.stats.status !== "gameover") return;
    this.twoPlayer = v;
    this.emit();
  }

  setMode(m: "campaign" | "endless") {
    if (this.stats.status !== "ready" && this.stats.status !== "gameover") return;
    this.mode = m;
    this.emit();
  }

  loadLevel(n: number) {
    const map = levelFor(n - 1);
    this.tiles = map.tiles.map((row) => row.slice());
    this.tanks = [];
    this.bullets = [];
    this.explosions = [];
    this.powerups = [];
    this.particles = [];
    this.airstrikes = [];
    this.airstrikeTimer = 9000 + Math.random() * 6000;
    this.shakeTime = 0;
    this.shakeMag = 0;
    this.players = [null, null];
    this.spreadTimer = [0, 0];
    this.speedTimer = [0, 0];
    this.bossSpawned = false;
    this.cfg = configFor(n, this.mode);
    this.night = n % 3 === 0;
    this.freezeTimer = 0;
    this.shovelTimer = 0;
    this.spawnQueue = this.cfg.total;
    this.spawnTimer = 600;
    this.spawnCursor = 0;
    this.spawnedCount = 0;
    this.respawnTimer = [0, 0];
    this.comboCount = 0;
    this.comboTimer = 0;
    this.levelNoDeath = true;
    this.baseTile = this.findBase();
    this.stats.level = n;
    this.stats.enemiesLeft = this.cfg.total;
    this.spawnPlayer(0);
    if (this.twoPlayer) this.spawnPlayer(1);
    if (this.cfg.boss) this.spawnBoss();
    this.emit();
  }

  private findBase(): { r: number; c: number } | null {
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (this.tiles[r][c] === Tile.Base) return { r, c };
      }
    }
    return null;
  }

  private shieldTiles(): Array<{ r: number; c: number }> {
    const b = this.baseTile;
    if (!b) return [];
    return [
      { r: b.r - 1, c: b.c - 1 },
      { r: b.r - 1, c: b.c },
      { r: b.r - 1, c: b.c + 1 },
      { r: b.r, c: b.c - 1 },
      { r: b.r, c: b.c + 1 },
    ];
  }

  start() {
    if (this.stats.status === "ready" || this.stats.status === "gameover") {
      const up = getUpgrades();
      const lives = PLAYER_LIVES + (up.extraLife > 0 ? 1 : 0);
      const lvl = up.startStar > 0 ? 1 : 0;
      this.playerLives = [lives, lives];
      this.playerLevel = [lvl, lvl];
      this.stats.score = 0;
      this.playTimeMs = 0;
      this.stats.enemiesDestroyed = 0;
      this.credited = false;
      this.loadLevel(1);
      this.stats.status = "playing";
      this.introTimer = INTRO_DUR;
      this.emit();
    }
  }

  togglePause() {
    if (this.stats.status === "playing" && this.introTimer <= 0) {
      this.stats.status = "paused";
    } else if (this.stats.status === "paused") {
      this.stats.status = "playing";
    }
    this.emit();
  }

  reset() {
    this.stats.status = "ready";
    this.playerLives = [PLAYER_LIVES, PLAYER_LIVES];
    this.playerLevel = [0, 0];
    this.stats.score = 0;
    this.tanks = [];
    this.bullets = [];
    this.explosions = [];
    this.powerups = [];
    this.players = [null, null];
    this.spawnQueue = 0;
    this.introTimer = 0;
    this.playTimeMs = 0;
    this.stats.enemiesDestroyed = 0;
    this.highScore = 0;
    this.stats.highScore = 0;
    if (typeof localStorage !== "undefined") localStorage.removeItem(HS_KEY);
    this.emit();
  }

  setMove(idx: number, dir: DirId | null) {
    this.heldDir[idx] = dir;
  }

  doShoot(idx: number) {
    this.wantShoot[idx] = true;
  }

  private newId() {
    return this.nextId++;
  }

  private spawnPlayer(idx: number) {
    if (this.playerLives[idx] <= 0) return;
    if (this.players[idx]) return;
    const [c, r] = PLAYER_SPAWN[idx];
    const tank = this.makeTank(c, r, Dir.Up, true, "player", idx);
    this.players[idx] = tank;
    this.tanks.push(tank);
  }

  private makeTank(
    c: number,
    r: number,
    dir: DirId,
    isPlayer: boolean,
    type: Tank["type"],
    playerIndex = -1,
  ): Tank {
    const speedMul = isPlayer ? 1 : this.cfg.speedMul;
    const baseSpeed = isPlayer
      ? PLAYER_SPEED
      : type === "fast"
        ? ENEMY_SPEED_FAST
        : type === "armor"
          ? ENEMY_SPEED_ARMOR
          : type === "heavy"
            ? ENEMY_SPEED_HEAVY
            : type === "boss"
              ? ENEMY_SPEED_BOSS
              : ENEMY_SPEED_BASIC;
    const speed = baseSpeed * speedMul;
    const cd = isPlayer
      ? SHOOT_CD_PLAYER
      : type === "fast"
        ? SHOOT_CD_FAST
        : type === "armor"
          ? SHOOT_CD_ARMOR
          : type === "heavy"
            ? SHOOT_CD_HEAVY
            : type === "boss"
              ? SHOOT_CD_BOSS
              : SHOOT_CD_BASIC;
    return {
      id: this.newId(),
      x: laneCenter(c),
      y: laneCenter(r),
      dir,
      speed,
      isPlayer,
      type,
      hp: type === "armor" ? 2 : type === "heavy" ? 3 : type === "boss" ? 6 : 1,
      shootCd: cd * 0.5,
      spawnTimer: isPlayer ? 0 : SPAWN_ANIM,
      invuln: isPlayer ? RESPAWN_INVULN + respawnInvulnBonus() : 0,
      active: isPlayer,
      moving: false,
      aiTimer: 400 + Math.floor(Math.random() * 800),
      bonus: false,
      playerIndex,
    };
  }

  private spawnBoss() {
    if (this.bossSpawned) return;
    this.bossSpawned = true;
    const [c, r] = ENEMY_SPAWNS[1] ?? ENEMY_SPAWNS[0];
    if (this.occupiedAt(c, r)) return;
    const tank = this.makeTank(c, r, Dir.Down, false, "boss");
    tank.bonus = true;
    this.tanks.push(tank);
    this.addExplosion(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2, true);
    this.triggerShake(6, SHAKE_DUR);
    this.fire("bonus");
    this.emit();
  }

  private spawnEnemy() {
    if (this.spawnQueue <= 0) return;
    if (this.tanks.filter((t) => !t.isPlayer).length >= this.cfg.maxOn) return;
    const [c, r] = ENEMY_SPAWNS[this.spawnCursor % ENEMY_SPAWNS.length];
    this.spawnCursor++;
    if (this.occupiedAt(c, r)) return;
    const roll = Math.random();
    const af = this.cfg.armorP + this.cfg.fastP;
    const type: EnemyType =
      roll < this.cfg.armorP
        ? "armor"
        : roll < af
          ? "fast"
          : roll < af + this.cfg.heavyP
            ? "heavy"
            : "basic";
    const tank = this.makeTank(c, r, Dir.Down, false, type);
    this.spawnedCount++;
    tank.bonus = this.spawnedCount % BONUS_EVERY === 0;
    if (tank.bonus) this.fire("bonus");
    this.tanks.push(tank);
    this.spawnQueue--;
    this.addExplosion(tank.x + TANK_SIZE / 2, tank.y + TANK_SIZE / 2, false);
    this.emit();
  }

  private occupiedAt(c: number, r: number): boolean {
    const x = laneCenter(c);
    const y = laneCenter(r);
    return this.tanks.some((t) => aabb(x, y, TANK_SIZE, TANK_SIZE, t.x, t.y, TANK_SIZE, TANK_SIZE));
  }

  update(dt: number) {
    if (this.shakeTime > 0) {
      this.shakeTime -= dt;
      if (this.shakeTime <= 0) this.shakeMag = 0;
    }
    if (this.stats.status === "paused" || this.stats.status === "ready") return;
    if (this.stats.status === "win") {
      this.winTimer -= dt;
      if (this.winTimer <= 0) {
        this.loadLevel(this.stats.level + 1);
        this.stats.status = "playing";
        this.introTimer = INTRO_DUR;
        this.emit();
      }
      this.updateExplosions(dt);
      this.updateParticles(dt);
      return;
    }
    if (this.stats.status !== "playing") {
      this.updateExplosions(dt);
      this.updateParticles(dt);
      return;
    }

    if (this.introTimer > 0) {
      this.introTimer -= dt;
      if (this.introTimer <= 0) this.fire("start");
      this.updateExplosions(dt);
      this.updateParticles(dt);
      this.emit();
      return;
    }

    this.playTimeMs += dt;

    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0) {
      this.spawnEnemy();
      this.spawnTimer = this.cfg.spawnDelay;
    }

    for (let i = 0; i < 2; i++) {
      if (this.respawnTimer[i] > 0) {
        this.respawnTimer[i] -= dt;
        if (this.respawnTimer[i] <= 0 && !this.players[i] && this.playerLives[i] > 0) {
          this.spawnPlayer(i);
        }
      }
    }

    if (this.freezeTimer > 0) this.freezeTimer -= dt;
    if (this.shovelTimer > 0) {
      this.shovelTimer -= dt;
      this.applyShovel(true);
      if (this.shovelTimer <= 0) this.applyShovel(false);
    }
    for (let i = 0; i < 2; i++) {
      if (this.spreadTimer[i] > 0) this.spreadTimer[i] -= dt;
      if (this.speedTimer[i] > 0) this.speedTimer[i] -= dt;
    }
    if (this.comboTimer > 0) {
      this.comboTimer -= dt;
      if (this.comboTimer <= 0) {
        this.comboCount = 0;
        this.emit();
      }
    }

    for (const t of this.tanks) {
      if (t.spawnTimer > 0) {
        t.spawnTimer -= dt;
        if (t.spawnTimer <= 0) t.active = true;
        continue;
      }
      if (t.invuln > 0) t.invuln -= dt;
      if (t.shootCd > 0) t.shootCd -= dt;
    }

    for (let i = 0; i < 2; i++) this.handlePlayerInput(i);
    if (this.freezeTimer <= 0) {
      for (const t of this.tanks) {
        if (t.isPlayer || !t.active) continue;
        this.runEnemyAI(t, dt);
      }
    }
    for (const t of this.tanks) {
      if (!t.active) continue;
      if (!t.isPlayer && this.freezeTimer > 0) continue;
      this.moveTank(t, dt);
    }
    this.moveBullets(dt);
    this.updatePowerups(dt);
    this.updateExplosions(dt);
    this.updateParticles(dt);
    this.updateAirstrikes(dt);
    this.checkWin();
    this.emit();
  }

  private handlePlayerInput(idx: number) {
    const p = this.players[idx];
    if (!p || !p.active) return;
    const dir = this.heldDir[idx];
    if (dir !== null) {
      if (p.dir !== dir) {
        p.dir = dir;
        this.snapToLane(p);
      }
      p.moving = true;
    } else {
      p.moving = false;
    }
    if (this.wantShoot[idx]) {
      this.fireFrom(p);
      this.wantShoot[idx] = false;
    }
  }

  private snapToLane(t: Tank) {
    if (t.dir === Dir.Up || t.dir === Dir.Down) {
      const c = nearestLane(t.x);
      const nx = laneCenter(c);
      if (this.canMoveTo(nx, t.y, t.id)) t.x = nx;
    } else {
      const r = nearestLane(t.y);
      const ny = laneCenter(r);
      if (this.canMoveTo(t.x, ny, t.id)) t.y = ny;
    }
  }

  private runEnemyAI(t: Tank, dt: number) {
    t.aiTimer -= dt;
    if (t.aiTimer <= 0) {
      t.dir = Math.floor(Math.random() * 4) as DirId;
      t.aiTimer = 500 + Math.floor(Math.random() * 900);
    }
    t.moving = true;
    if (t.shootCd <= 0 && Math.random() < ENEMY_FIRE_CHANCE * this.cfg.fireMul) {
      this.fireFrom(t);
    }
  }

  private moveTank(t: Tank, dt: number) {
    if (!t.moving) return;
    const [dx, dy] = DIR_VEC[t.dir];
    const boost = t.isPlayer && this.speedTimer[t.playerIndex] > 0 ? PLAYER_SPEED_BOOST / PLAYER_SPEED : 1;
    const step = t.speed * boost * (dt / 16.6667);
    const nx = t.x + dx * step;
    const ny = t.y + dy * step;
    if (this.canMoveTo(nx, ny, t.id)) {
      t.x = nx;
      t.y = ny;
    } else {
      t.moving = false;
      if (!t.isPlayer) t.aiTimer = 0;
    }
    if (t.isPlayer) this.pickupPowerup(t);
  }

  private canMoveTo(x: number, y: number, selfId: number): boolean {
    if (x < 0 || y < 0 || x + TANK_SIZE > COLS * TILE || y + TANK_SIZE > ROWS * TILE) {
      return false;
    }
    const c0 = Math.floor(x / TILE);
    const c1 = Math.floor((x + TANK_SIZE - 1) / TILE);
    const r0 = Math.floor(y / TILE);
    const r1 = Math.floor((y + TANK_SIZE - 1) / TILE);
    for (let r = r0; r <= r1; r++) {
      for (let c = c0; c <= c1; c++) {
        const id = this.tiles[r]?.[c];
        if (id !== undefined && SOLID.has(id)) return false;
      }
    }
    for (const o of this.tanks) {
      if (o.id === selfId) continue;
      if (aabb(x, y, TANK_SIZE, TANK_SIZE, o.x, o.y, TANK_SIZE, TANK_SIZE)) return false;
    }
    return true;
  }

  private maxPlayerBullets(idx: number): number {
    if (this.spreadTimer[idx] > 0) return 3;
    return this.playerLevel[idx] >= 2 ? 2 : 1;
  }

  private playerBulletSpeed(idx: number): number {
    return this.playerLevel[idx] >= 1 ? PLAYER_BULLET_SPEED_UP : PLAYER_BULLET_SPEED;
  }

  private enemyShootCd(t: Tank): number {
    switch (t.type) {
      case "fast": return SHOOT_CD_FAST;
      case "armor": return SHOOT_CD_ARMOR;
      case "heavy": return SHOOT_CD_HEAVY;
      case "boss": return SHOOT_CD_BOSS;
      default: return SHOOT_CD_BASIC;
    }
  }

  private fireFrom(t: Tank) {
    if (t.shootCd > 0) return;
    const idx = t.playerIndex;
    if (t.isPlayer) {
      const active = this.bullets.filter((b) => b.ownerId === t.id).length;
      if (active >= this.maxPlayerBullets(idx)) return;
    }
    t.shootCd = t.isPlayer ? SHOOT_CD_PLAYER : this.enemyShootCd(t);
    const [dx, dy] = DIR_VEC[t.dir];
    const cx = t.x + TANK_SIZE / 2;
    const cy = t.y + TANK_SIZE / 2;
    const power = t.isPlayer && this.playerLevel[idx] >= 3 ? 2 : 1;
    const speed = t.isPlayer ? this.playerBulletSpeed(idx) : BULLET_SPEED;
    const spread = t.isPlayer && this.spreadTimer[idx] > 0;
    const offsets = spread ? [-9, 0, 9] : [0];
    const px = dy;
    const py = -dx;
    for (const off of offsets) {
      const bx = cx - BULLET_SIZE / 2 + dx * (TANK_SIZE / 2) + px * off;
      const by = cy - BULLET_SIZE / 2 + dy * (TANK_SIZE / 2) + py * off;
      this.bullets.push({
        id: this.newId(),
        x: bx,
        y: by,
        dir: t.dir,
        ownerId: t.id,
        isPlayer: t.isPlayer,
        power,
        speed,
      });
    }
    if (t.isPlayer) this.fire("shoot");
  }

  private moveBullets(dt: number) {
    for (const b of this.bullets) {
      const [dx, dy] = DIR_VEC[b.dir];
      b.x += dx * (b.speed * (dt / 16.6667));
      b.y += dy * (b.speed * (dt / 16.6667));
    }
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (this.bulletBlocked(b)) {
        this.bullets.splice(i, 1);
      }
    }
    this.resolveBulletTankHits();
    this.resolveBulletBulletHits();
  }

  private bulletBlocked(b: Bullet): boolean {
    if (b.x < 0 || b.y < 0 || b.x > COLS * TILE || b.y > ROWS * TILE) return true;
    const cx = b.x + BULLET_SIZE / 2;
    const cy = b.y + BULLET_SIZE / 2;
    const c = Math.floor(cx / TILE);
    const r = Math.floor(cy / TILE);
    const id = this.tiles[r]?.[c];
    if (id === undefined) return false;
    if (id === Tile.Brick) {
      this.tiles[r][c] = Tile.Empty;
      this.spawnSparks(cx, cy, 5, false);
      this.fire("hitBrick");
      return true;
    }
    if (id === Tile.Steel) {
      if (b.power >= 2) this.tiles[r][c] = Tile.Empty;
      this.spawnSparks(cx, cy, 4, false);
      this.fire("hitSteel");
      return true;
    }
    if (id === Tile.Base) {
      this.tiles[r][c] = Tile.Empty;
      this.addExplosion(c * TILE + TILE / 2, r * TILE + TILE / 2, true);
      this.triggerShake(8, SHAKE_DUR * 1.5);
      this.fire("explosion");
      this.saveHighScore();
      this.grantCredits();
      this.stats.status = "gameover";
      this.fire("gameover");
      this.emit();
      return true;
    }
    return false;
  }

  private resolveBulletTankHits() {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      for (const t of this.tanks) {
        if (!t.active) continue;
        if (t.id === b.ownerId) continue;
        if (t.isPlayer === b.isPlayer) continue;
        if (t.invuln > 0) continue;
        if (!aabb(b.x, b.y, BULLET_SIZE, BULLET_SIZE, t.x, t.y, TANK_SIZE, TANK_SIZE)) continue;
        this.bullets.splice(i, 1);
        this.spawnSparks(b.x + BULLET_SIZE / 2, b.y + BULLET_SIZE / 2, 5, false);
        t.hp -= 1;
        if (t.hp <= 0) {
          this.destroyTank(t);
        } else {
          this.addExplosion(t.x + TANK_SIZE / 2, t.y + TANK_SIZE / 2, false);
          this.fire("hitSteel");
        }
        break;
      }
    }
  }

  private resolveBulletBulletHits() {
    const remove = new Set<number>();
    for (let i = 0; i < this.bullets.length; i++) {
      const a = this.bullets[i];
      if (remove.has(a.id)) continue;
      for (let j = i + 1; j < this.bullets.length; j++) {
        const o = this.bullets[j];
        if (remove.has(o.id)) continue;
        if (a.isPlayer === o.isPlayer) continue;
        if (aabb(a.x, a.y, BULLET_SIZE, BULLET_SIZE, o.x, o.y, BULLET_SIZE, BULLET_SIZE)) {
          remove.add(a.id);
          remove.add(o.id);
          break;
        }
      }
    }
    if (remove.size > 0) {
      this.bullets = this.bullets.filter((b) => !remove.has(b.id));
    }
  }

  private destroyTank(t: Tank) {
    this.tanks = this.tanks.filter((x) => x.id !== t.id);
    if (t.isPlayer) {
      const idx = t.playerIndex;
      this.players[idx] = null;
      this.playerLevel[idx] = 0;
      this.levelNoDeath = false;
      this.playerLives[idx] -= 1;
      this.addExplosion(t.x + TANK_SIZE / 2, t.y + TANK_SIZE / 2, true);
      this.fire("playerHit");
      const anyAlive = (this.twoPlayer ? [0, 1] : [0]).some((i) => this.playerLives[i] > 0);
      if (!anyAlive) {
        this.saveHighScore();
        this.grantCredits();
        this.stats.status = "gameover";
        this.fire("gameover");
      } else {
        this.respawnTimer[idx] = 1200;
      }
    } else {
      const base =
        t.type === "boss"
          ? SCORE.boss
          : t.type === "heavy"
            ? SCORE.heavy
            : t.type === "armor"
              ? SCORE.armor
              : t.type === "fast"
                ? SCORE.fast
                : SCORE.basic;
      if (this.comboTimer > 0) this.comboCount += 1;
      else this.comboCount = 1;
      this.comboTimer = COMBO_WINDOW;
      const bonus = (this.comboCount - 1) * COMBO_BONUS;
      this.stats.score += base + bonus;
      this.stats.enemiesDestroyed += 1;
      this.addExplosion(t.x + TANK_SIZE / 2, t.y + TANK_SIZE / 2, true);
      if (t.type === "boss") {
        this.triggerShake(8, SHAKE_DUR * 1.5);
        this.spawnPowerup();
      }
      this.fire("explosion");
      if (t.bonus && t.type !== "boss") this.spawnPowerup();
    }
    this.emit();
  }

  private spawnPowerup() {
    const tries: Array<[number, number]> = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const id = this.tiles[r][c];
        if (id !== Tile.Empty && id !== Tile.Forest) continue;
        if (this.tanks.some((t) => aabb(c * TILE, r * TILE, TILE, TILE, t.x, t.y, TANK_SIZE, TANK_SIZE))) continue;
        tries.push([c, r]);
      }
    }
    if (tries.length === 0) return;
    const [c, r] = tries[Math.floor(Math.random() * tries.length)];
    const types: PowerId[] = [Power.Star, Power.Tank, Power.Clock, Power.Grenade, Power.Shovel, Power.Helmet, Power.Spread, Power.Speed];
    const type = types[Math.floor(Math.random() * types.length)];
    this.powerups.push({
      id: this.newId(),
      x: laneCenter(c),
      y: laneCenter(r),
      type,
      life: POWERUP_LIFETIME,
    });
  }

  private updatePowerups(dt: number) {
    for (const p of this.powerups) p.life -= dt;
    this.powerups = this.powerups.filter((p) => p.life > 0);
  }

  private pickupPowerup(t: Tank) {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      if (!aabb(t.x, t.y, TANK_SIZE, TANK_SIZE, p.x, p.y, TANK_SIZE, TANK_SIZE)) continue;
      this.powerups.splice(i, 1);
      this.applyPowerup(p.type, t.playerIndex);
      this.stats.score += POWERUP_SCORE;
      this.fire("powerup");
      this.addExplosion(p.x + TANK_SIZE / 2, p.y + TANK_SIZE / 2, false);
      this.emit();
      break;
    }
  }

  private applyPowerup(type: PowerId, idx: number) {
    if (type === Power.Star) {
      this.playerLevel[idx] = Math.min(3, this.playerLevel[idx] + 1);
    } else if (type === Power.Tank) {
      this.playerLives[idx] += 1;
    } else if (type === Power.Clock) {
      this.freezeTimer = FREEZE_DUR;
    } else if (type === Power.Grenade) {
      this.fire("grenade");
      const enemies = this.tanks.filter((t) => !t.isPlayer);
      for (const e of enemies) {
        this.stats.score += e.type === "boss"
          ? SCORE.boss
          : e.type === "heavy"
            ? SCORE.heavy
            : e.type === "armor"
              ? SCORE.armor
              : e.type === "fast"
                ? SCORE.fast
                : SCORE.basic;
        this.addExplosion(e.x + TANK_SIZE / 2, e.y + TANK_SIZE / 2, true);
      }
      this.tanks = this.tanks.filter((t) => t.isPlayer);
      this.triggerShake(5, SHAKE_DUR);
      this.fire("explosion");
    } else if (type === Power.Shovel) {
      this.shovelTimer = SHOVEL_DUR;
      this.applyShovel(true);
    } else if (type === Power.Helmet) {
      const p = this.players[idx];
      if (p) p.invuln = Math.max(p.invuln, HELMET_DUR);
    } else if (type === Power.Spread) {
      this.spreadTimer[idx] = SPREAD_DUR;
    } else if (type === Power.Speed) {
      this.speedTimer[idx] = SPEED_DUR;
    }
  }

  private applyShovel(steel: boolean) {
    for (const s of this.shieldTiles()) {
      if (s.r < 0 || s.r >= ROWS || s.c < 0 || s.c >= COLS) continue;
      const cur = this.tiles[s.r][s.c];
      if (steel) {
        if (cur !== Tile.Base) this.tiles[s.r][s.c] = Tile.Steel;
      } else {
        if (cur === Tile.Steel) this.tiles[s.r][s.c] = Tile.Brick;
      }
    }
  }

  private addExplosion(x: number, y: number, big: boolean) {
    this.explosions.push({ x, y, t: 0, dur: EXPLOSION_DUR, big });
    if (big) this.triggerShake(4, SHAKE_DUR);
    this.spawnSparks(x, y, big ? 10 : 4, big);
  }

  private triggerShake(mag: number, dur: number) {
    if (mag > this.shakeMag || this.shakeTime <= 0) this.shakeMag = mag;
    this.shakeTime = Math.max(this.shakeTime, dur);
  }

  private spawnSparks(x: number, y: number, n: number, big: boolean) {
    const colors = COLORS.explosion;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = (big ? 1.5 : 0.8) + Math.random() * (big ? 2.5 : 1.5);
      this.particles.push({
        x,
        y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        t: 0,
        dur: 220 + Math.random() * 220,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
  }

  private spawnAirstrike() {
    const c = Math.floor(Math.random() * COLS);
    const r = Math.floor(Math.random() * ROWS);
    this.airstrikes.push({
      id: this.newId(),
      x: c * TILE + TILE / 2,
      y: r * TILE + TILE / 2,
      timer: 1800,
      warn: 1800,
      radius: TILE * 2.4,
      detonated: false,
    });
  }

  private detonateAirstrike(a: Airstrike) {
    const R = a.radius;
    const R2 = R * R;
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const cx = c * TILE + TILE / 2;
        const cy = r * TILE + TILE / 2;
        if ((cx - a.x) ** 2 + (cy - a.y) ** 2 <= R2) {
          if (this.tiles[r][c] === Tile.Brick) this.tiles[r][c] = Tile.Empty;
        }
      }
    }
    const targets: Tank[] = [];
    for (const t of this.tanks) {
      if (!t.active) continue;
      const cx = t.x + TANK_SIZE / 2;
      const cy = t.y + TANK_SIZE / 2;
      if ((cx - a.x) ** 2 + (cy - a.y) ** 2 <= R2) {
        if (t.isPlayer && t.invuln > 0) continue;
        targets.push(t);
      }
    }
    for (const t of targets) {
      if (t.isPlayer) {
        this.destroyTank(t);
      } else {
        t.hp -= 4;
        if (t.hp <= 0) this.destroyTank(t);
        else this.spawnSparks(t.x + TANK_SIZE / 2, t.y + TANK_SIZE / 2, 5, false);
      }
    }
    this.addExplosion(a.x, a.y, true);
    this.spawnSparks(a.x, a.y, 14, true);
    this.triggerShake(7, SHAKE_DUR);
    this.fire("explosion");
  }

  private updateAirstrikes(dt: number) {
    if (this.airstrikeTimer > 0) {
      this.airstrikeTimer -= dt;
      if (this.airstrikeTimer <= 0) {
        this.spawnAirstrike();
        this.airstrikeTimer = 11000 + Math.random() * 8000;
      }
    }
    for (const a of this.airstrikes) {
      a.timer -= dt;
      if (!a.detonated && a.timer <= 0) {
        a.detonated = true;
        a.timer = 340;
        this.detonateAirstrike(a);
      }
    }
    this.airstrikes = this.airstrikes.filter((a) => a.timer > 0);
  }

  private updateParticles(dt: number) {
    const f = dt / 16.6667;
    for (const p of this.particles) {
      p.x += p.vx * f;
      p.y += p.vy * f;
      p.vx *= 0.92;
      p.vy *= 0.92;
      p.t += dt;
    }
    this.particles = this.particles.filter((p) => p.t < p.dur);
  }

  private updateExplosions(dt: number) {
    for (const e of this.explosions) e.t += dt;
    this.explosions = this.explosions.filter((e) => e.t < e.dur);
  }

  private checkWin() {
    if (this.stats.status !== "playing") return;
    if (this.spawnQueue > 0) return;
    if (this.tanks.some((t) => !t.isPlayer)) return;
    if (this.levelNoDeath) this.stats.score += NO_DEATH_BONUS;
    this.saveHighScore();
    this.stats.status = "win";
    this.winTimer = 1800;
    this.fire("win");
    this.emit();
  }

  colors() {
    return COLORS;
  }
}
