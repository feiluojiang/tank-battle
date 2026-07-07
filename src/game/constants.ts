export const TILE = 32;
export const COLS = 13;
export const ROWS = 13;
export const BOARD_W = COLS * TILE;
export const BOARD_H = ROWS * TILE;

export const TANK_SIZE = 28;
export const TANK_HALF = TANK_SIZE / 2;
export const BULLET_SIZE = 8;
export const BULLET_SPEED = 5;
export const PLAYER_BULLET_SPEED = 5.5;
export const PLAYER_BULLET_SPEED_UP = 8.5;
export const PLAYER_SPEED = 2.2;
export const PLAYER_SPEED_BOOST = 3.3;
export const ENEMY_SPEED_BASIC = 1;
export const ENEMY_SPEED_FAST = 1.8;
export const ENEMY_SPEED_ARMOR = 1.2;
export const ENEMY_SPEED_HEAVY = 0.7;
export const ENEMY_SPEED_BOSS = 0.9;

export const ENEMY_TOTAL = 12;
export const ENEMY_MAX_ONSCREEN = 4;
export const PLAYER_LIVES = 3;

export const SHOOT_CD_PLAYER = 280;
export const SHOOT_CD_BASIC = 1400;
export const SHOOT_CD_FAST = 900;
export const SHOOT_CD_ARMOR = 1100;
export const SHOOT_CD_HEAVY = 1500;
export const SHOOT_CD_BOSS = 600;

export const SPAWN_DELAY = 2200;
export const SPAWN_ANIM = 800;
export const RESPAWN_INVULN = 2000;
export const EXPLOSION_DUR = 360;
export const ENEMY_FIRE_CHANCE = 0.012;

export const POWERUP_LIFETIME = 12000;
export const POWERUP_BLINK = 3000;
export const POWERUP_SCORE = 500;
export const FREEZE_DUR = 8000;
export const SHOVEL_DUR = 15000;
export const HELMET_DUR = 10000;
export const SPREAD_DUR = 10000;
export const SPEED_DUR = 10000;
export const SHAKE_DUR = 320;
export const BOSS_EVERY = 4;
export const BONUS_EVERY = 4;

export const COMBO_WINDOW = 3000;
export const COMBO_BONUS = 50;
export const NO_DEATH_BONUS = 500;
export const INTRO_DUR = 1500;
export const HS_KEY = "tank-battle-highscore";

export const Tile = {
  Empty: 0,
  Brick: 1,
  Steel: 2,
  Water: 3,
  Forest: 4,
  Base: 5,
} as const;
export type TileId = (typeof Tile)[keyof typeof Tile];

export const SOLID: ReadonlySet<number> = new Set([
  Tile.Brick,
  Tile.Steel,
  Tile.Water,
  Tile.Base,
]);

export const Dir = {
  Up: 0,
  Right: 1,
  Down: 2,
  Left: 3,
} as const;
export type DirId = (typeof Dir)[keyof typeof Dir];

export const DIR_VEC: ReadonlyArray<readonly [number, number]> = [
  [0, -1],
  [1, 0],
  [0, 1],
  [-1, 0],
];

export const Power = {
  Star: 0,
  Tank: 1,
  Clock: 2,
  Grenade: 3,
  Shovel: 4,
  Helmet: 5,
  Spread: 6,
  Speed: 7,
} as const;
export type PowerId = (typeof Power)[keyof typeof Power];

export const POWER_META: Record<
  number,
  { color: string; dark: string; label: string }
> = {
  0: { color: "#ffd24a", dark: "#8a6d12", label: "星" },
  1: { color: "#90a4ae", dark: "#455a64", label: "命" },
  2: { color: "#42a5f5", dark: "#1565c0", label: "冻" },
  3: { color: "#ef5350", dark: "#b71c1c", label: "雷" },
  4: { color: "#a1887f", dark: "#4e342e", label: "锹" },
  5: { color: "#eceff1", dark: "#90a4ae", label: "盔" },
  6: { color: "#ba68c8", dark: "#6a1b9a", label: "散" },
  7: { color: "#4dd0e1", dark: "#00838f", label: "速" },
};

export const COLORS = {
  bg: "#1a1a1a",
  border: "#3a3a3a",
  brick: "#9c6b2f",
  brickDark: "#6b4519",
  steel: "#9aa0a6",
  steelDark: "#5f6368",
  water1: "#1f6feb",
  water2: "#0d4aa3",
  forest: "#2e7d32",
  forestDark: "#1b5e20",
  base: "#d4a017",
  baseDark: "#7a5c00",
  player: "#e6c34a",
  playerDark: "#8a6d12",
  player2: "#7cb342",
  player2Dark: "#33691e",
  basic: "#bdbdbd",
  fast: "#e57373",
  armor: "#4caf50",
  heavy: "#7e57c2",
  boss: "#d84315",
  bonus: "#ff3d3d",
  bullet: "#ffffff",
  spark: "#ffd24a",
  explosion: ["#ffffff", "#ffd24a", "#ff7a1a", "#c62828"],
} as const;

export const SCORE = {
  basic: 100,
  fast: 200,
  armor: 300,
  heavy: 400,
  boss: 2000,
};

export type Status = "ready" | "playing" | "paused" | "gameover" | "win";

export type GameEvent =
  | "shoot"
  | "hitBrick"
  | "hitSteel"
  | "explosion"
  | "playerHit"
  | "powerup"
  | "bonus"
  | "grenade"
  | "gameover"
  | "win"
  | "start";
