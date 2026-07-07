import { Crown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { GameMode, LeaderboardEntry } from "@/game/leaderboard";

export function Overlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/85 p-6 text-center backdrop-blur-sm">
      {children}
    </div>
  );
}

function fmtTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}-${dd} ${hh}:${mi}`;
}

export function Leaderboard({
  entries,
  loading,
  error,
}: {
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
}) {
  if (loading) {
    return <p className="text-sm text-muted-foreground">加载中…</p>;
  }
  if (error) {
    return <p className="text-sm text-destructive">{error}</p>;
  }
  if (!entries.length) {
    return <p className="text-sm text-muted-foreground">暂无记录，快来登顶！</p>;
  }
  return (
    <ol className="w-full max-w-[320px] max-h-[52vh] space-y-1 overflow-y-auto pr-1">
      {entries.map((e, i) => (
        <li
          key={e.id}
          className="rounded-md border border-border bg-card/60 px-2 py-1.5 text-sm"
        >
          <div className="flex items-center gap-2">
            <span
              className="w-5 shrink-0 text-center font-bold"
              style={{ color: i < 3 ? "var(--color-primary)" : undefined }}
            >
              {i + 1}
            </span>
            <span className="flex-1 truncate text-left font-medium">{e.player_name}</span>
            <span className="rounded bg-muted px-1 text-[10px] text-muted-foreground">
              {e.mode === "endless" ? "无尽" : "闯关"}
            </span>
            <span className="tabular-nums font-semibold text-primary">{e.score}</span>
          </div>
          <div className="flex items-center justify-between pl-7 text-[11px] text-muted-foreground">
            <span className="tabular-nums">{e.level}关 · {e.enemies_destroyed}杀 · {e.play_time_seconds}s</span>
            <span className="tabular-nums">{fmtTime(e.created_at)}</span>
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LeaderboardModal({
  open,
  onClose,
  entries,
  loading,
  error,
  boardMode,
  onMode,
}: {
  open: boolean;
  onClose: () => void;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  boardMode: GameMode;
  onMode: (m: GameMode) => void;
}) {
  if (!open) return null;
  return (
    <Overlay>
      <div className="flex items-center gap-2">
        <Crown className="size-6 text-primary" aria-hidden />
        <p className="text-lg font-bold">排行榜 · Top 20</p>
      </div>
      <div className="flex gap-2">
        {(["campaign", "endless"] as GameMode[]).map((m) => (
          <Button
            key={m}
            size="sm"
            variant={boardMode === m ? "default" : "outline"}
            onClick={() => onMode(m)}
          >
            {m === "endless" ? "无尽" : "闯关"}
          </Button>
        ))}
      </div>
      <Leaderboard entries={entries} loading={loading} error={error} />
      <Button size="sm" variant="outline" onClick={onClose}>
        <X className="size-4" aria-hidden /> 关闭
      </Button>
    </Overlay>
  );
}
