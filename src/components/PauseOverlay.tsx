import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Overlay } from "@/components/Leaderboard";
import type { GameStats } from "@/game/types";

export function PauseOverlay({
  stats,
  onResume,
}: {
  stats: GameStats;
  onResume: () => void;
}) {
  return (
    <Overlay>
      <Pause className="size-10 text-primary" aria-hidden />
      <p className="text-xl font-bold">已暂停</p>
      <p className="text-sm text-muted-foreground">
        得分 {stats.score} · 关卡 {stats.level} · 击毁 {stats.enemiesDestroyed}
      </p>
      <p className="text-[11px] text-muted-foreground">关掉页面也会自动记录本局成绩</p>
      <Button onClick={onResume}>
        <Play className="size-4" aria-hidden /> 继续游戏
      </Button>
    </Overlay>
  );
}
