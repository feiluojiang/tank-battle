import { useState } from "react";
import { RotateCcw, Send, Skull } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Leaderboard, Overlay } from "@/components/Leaderboard";
import type { LeaderboardEntry } from "@/game/leaderboard";
import type { GameStats } from "@/game/types";

export function GameOverOverlay({
  stats,
  entries,
  loading,
  error,
  lastName,
  onSubmit,
  onRestart,
}: {
  stats: GameStats;
  entries: LeaderboardEntry[];
  loading: boolean;
  error: string | null;
  lastName: string;
  onSubmit: (name: string) => Promise<void>;
  onRestart: () => void;
}) {
  const [name, setName] = useState(lastName);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setErr(null);
    try {
      await onSubmit(name);
      setSubmitted(true);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "提交失败");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Overlay>
      <Skull className="size-10 text-destructive" aria-hidden />
      <p className="text-xl font-bold">游戏结束</p>
      <p className="text-sm text-muted-foreground">
        得分 {stats.score} · 最高 {stats.highScore} · 关卡 {stats.level} · 击毁 {stats.enemiesDestroyed}
      </p>
      {!submitted ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex gap-2">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={12}
              placeholder="输入名字"
              className="w-32"
            />
            <Button onClick={submit} disabled={submitting}>
              <Send className="size-4" aria-hidden /> 提交
            </Button>
          </div>
          {err && <p className="text-xs text-destructive">{err}</p>}
          <p className="text-[11px] text-muted-foreground">提交后查看排行榜</p>
        </div>
      ) : (
        <Leaderboard entries={entries} loading={loading} error={error} />
      )}
      <Button onClick={onRestart}>
        <RotateCcw className="size-4" aria-hidden /> 再来一局
      </Button>
    </Overlay>
  );
}
