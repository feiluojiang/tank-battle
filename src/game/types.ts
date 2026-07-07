import type { DirId, PowerId } from "./constants";

export type EnemyType = "basic" | "fast" | "armor" | "heavy" | "boss";

export interface Tank {
  id: number;
  x: number;
  y: number;
  dir: DirId;
  speed: number;
  isPlayer: boolean;
  type: "player" | EnemyType;
  hp: number;
  shootCd: number;
  spawnTimer: number;
  invuln: number;
  active: boolean;
  moving: boolean;
  aiTimer: number;
  bonus: boolean;
  playerIndex: number;
}

export interface Bullet {
  id: number;
  x: number;
  y: number;
  dir: DirId;
  ownerId: number;
  isPlayer: boolean;
  power: number;
  speed: number;
}

export interface Explosion {
  x: number;
  y: number;
  t: number;
  dur: number;
  big: boolean;
}

export interface PowerUp {
  id: number;
  x: number;
  y: number;
  type: PowerId;
  life: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  t: number;
  dur: number;
  color: string;
}

export interface Airstrike {
  id: number;
  x: number;
  y: number;
  timer: number;
  warn: number;
  radius: number;
  detonated: boolean;
}

export type GameMode = "campaign" | "endless";

export interface GameStats {
  status: "ready" | "playing" | "paused" | "gameover" | "win";
  lives: number;
  lives2: number;
  score: number;
  highScore: number;
  level: number;
  enemiesLeft: number;
  enemiesOnscreen: number;
  playerLevel: number;
  playerLevel2: number;
  combo: number;
  twoPlayer: boolean;
  intro: boolean;
  enemiesDestroyed: number;
  playTimeSeconds: number;
  mode: GameMode;
  night: boolean;
}
