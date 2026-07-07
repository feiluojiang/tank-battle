export interface Upgrades {
  extraLife: number;
  startStar: number;
  longShield: number;
}

export const UPGRADE_DEFS: Array<{
  id: keyof Upgrades;
  label: string;
  desc: string;
  cost: number;
}> = [
  { id: "extraLife", label: "初始 +1 命", desc: "每局开局多 1 条生命", cost: 5000 },
  { id: "startStar", label: "开局 1 星", desc: "开局即 1 级火力（快弹 + 双发）", cost: 9000 },
  { id: "longShield", label: "复活护甲", desc: "复活无敌时间 +50%", cost: 6000 },
];

const KEY = "tank-battle-upgrades";
const CREDITS_KEY = "tank-battle-credits";

const EMPTY: Upgrades = { extraLife: 0, startStar: 0, longShield: 0 };

export function getUpgrades(): Upgrades {
  if (typeof localStorage === "undefined") return { ...EMPTY };
  try {
    const v = JSON.parse(localStorage.getItem(KEY) ?? "{}");
    return { ...EMPTY, ...v };
  } catch {
    return { ...EMPTY };
  }
}

export function getCredits(): number {
  if (typeof localStorage === "undefined") return 0;
  return parseInt(localStorage.getItem(CREDITS_KEY) ?? "0", 10) || 0;
}

export function addCredits(n: number): void {
  if (typeof localStorage === "undefined") return;
  const v = getCredits() + Math.max(0, Math.floor(n));
  localStorage.setItem(CREDITS_KEY, String(v));
}

export function buyUpgrade(id: keyof Upgrades): boolean {
  const def = UPGRADE_DEFS.find((d) => d.id === id);
  if (!def) return false;
  const up = getUpgrades();
  if (up[id] > 0) return false;
  const credits = getCredits();
  if (credits < def.cost) return false;
  localStorage.setItem(CREDITS_KEY, String(credits - def.cost));
  up[id] = 1;
  localStorage.setItem(KEY, JSON.stringify(up));
  return true;
}

export function respawnInvulnBonus(): number {
  return getUpgrades().longShield > 0 ? 1500 : 0;
}
