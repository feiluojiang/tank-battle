import {
  Flame,
  Heart,
  Skull,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import type { GameStats } from "@/game/types";

function StatChip({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/80 px-3 py-2">
      <Icon className="size-4 shrink-0" style={{ color: accent }} aria-hidden />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="text-sm font-semibold tabular-nums">{value}</div>
      </div>
    </div>
  );
}

function Stars({ level, color }: { level: number; color: string }) {
  return (
    <div className="flex gap-0.5 pt-0.5">
      {Array.from({ length: 3 }).map((_, i) => (
        <Star
          key={i}
          className={
            i < level ? "size-3 fill-current" : "size-3 text-muted-foreground/40"
          }
          style={{ color: i < level ? color : undefined }}
          aria-hidden
        />
      ))}
    </div>
  );
}

function PlayerPanel({
  label,
  color,
  lives,
  level,
}: {
  label: string;
  color: string;
  lives: number;
  level: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card/80 px-3 py-2">
      <span className="size-3 shrink-0 rounded-sm" style={{ background: color }} />
      <div className="leading-tight">
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
          {label}
        </div>
        <div className="flex items-center gap-1.5 pt-0.5">
          <Heart className="size-3 fill-destructive text-destructive" aria-hidden />
          <span className="text-xs font-semibold tabular-nums">{Math.max(0, lives)}</span>
          <Stars level={level} color={color} />
        </div>
      </div>
    </div>
  );
}

export function Hud({ stats }: { stats: GameStats }) {
  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <StatChip icon={Trophy} label="关卡" value={stats.level} accent="#ffd24a" />
      <StatChip icon={Target} label="得分" value={stats.score} />
      {stats.combo > 1 && (
        <StatChip icon={Flame} label="连击" value={`x${stats.combo}`} accent="#ff7a1a" />
      )}
      <StatChip icon={Skull} label="剩余" value={stats.enemiesLeft} />
      <div className="ml-auto flex flex-wrap gap-2">
        <PlayerPanel label="P1" color="#e6c34a" lives={stats.lives} level={stats.playerLevel} />
        {stats.twoPlayer && (
          <PlayerPanel label="P2" color="#7cb342" lives={stats.lives2} level={stats.playerLevel2} />
        )}
      </div>
    </div>
  );
}
