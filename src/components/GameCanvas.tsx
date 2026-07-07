import {
  Coins,
  Crown,
  Palette,
  Pause,
  Play,
  RotateCcw,
  Trophy,
  User,
  Users,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { GameOverOverlay } from "@/components/GameOverOverlay";
import { Hud } from "@/components/Hud";
import {
  LeaderboardModal,
  Overlay,
} from "@/components/Leaderboard";
import { PauseOverlay } from "@/components/PauseOverlay";
import { TouchControls } from "@/components/TouchControls";
import { UpgradeShop } from "@/components/UpgradeShop";
import { BOARD_H, BOARD_W } from "@/game/constants";
import { supabaseAnonKey, supabaseUrl } from "@/supabase/client";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useTankGame } from "@/hooks/useTankGame";
import { THEMES, useTheme } from "@/hooks/useTheme";

function TankLogo() {
  return (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-primary/50 bg-primary/15 text-primary">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M3 13h11v4H3z" />
        <path d="M14 14h6l1 3h-7z" />
        <path d="M5 13V9h7v4" />
        <path d="M9 9V6h6" />
        <path d="M3 17v1M6 17v1M10 17v1M13 17v1" />
      </svg>
    </span>
  );
}

function Corner({ pos }: { pos: "tl" | "tr" | "bl" | "br" }) {
  const cls = {
    tl: "left-0 top-0 border-l-2 border-t-2 rounded-tl",
    tr: "right-0 top-0 border-r-2 border-t-2 rounded-tr",
    bl: "left-0 bottom-0 border-l-2 border-b-2 rounded-bl",
    br: "right-0 bottom-0 border-r-2 border-b-2 rounded-br",
  }[pos];
  return <span className={`pointer-events-none absolute size-3 border-primary/60 ${cls}`} aria-hidden />;
}

export function GameCanvas() {
  const {
    canvasRef,
    stats,
    soundEnabled,
    twoPlayer,
    start,
    togglePause,
    reset,
    toggleSound,
    setTwoPlayer,
    setMode,
    press,
    release,
    fire,
  } = useTankGame();
  const lb = useLeaderboard();
  const { theme, cycle } = useTheme();
  const [showBoard, setShowBoard] = useState(false);
  const [showShop, setShowShop] = useState(false);

  const statsRef = useRef(stats);
  statsRef.current = stats;
  const lastNameRef = useRef(lb.lastName);
  lastNameRef.current = lb.lastName;
  const submittedRef = useRef(false);

  useEffect(() => {
    if (stats.status === "playing" && stats.intro && stats.score === 0) {
      submittedRef.current = false;
    }
  }, [stats.status, stats.intro, stats.score]);

  const submitScore = useCallback(
    async (name: string) => {
      submittedRef.current = true;
      const s = statsRef.current;
      await lb.submit({
        playerName: name,
        score: s.score,
        level: s.level,
        enemiesDestroyed: s.enemiesDestroyed,
        playTimeSeconds: s.playTimeSeconds,
        mode: s.mode,
      });
    },
    [lb],
  );

  useEffect(() => {
    const onUnload = () => {
      const s = statsRef.current;
      if (submittedRef.current) return;
      if (s.score <= 0) return;
      if (s.status !== "playing" && s.status !== "paused" && s.status !== "win" && s.status !== "gameover") {
        return;
      }
      submittedRef.current = true;
      const name = (lastNameRef.current || "").trim().slice(0, 12) || "匿名";
      const body = JSON.stringify({
        player_name: name,
        score: Math.max(0, Math.floor(s.score)),
        level: Math.max(1, Math.floor(s.level)),
        enemies_destroyed: Math.max(0, Math.floor(s.enemiesDestroyed)),
        play_time_seconds: Math.max(0, Math.floor(s.playTimeSeconds)),
        mode: s.mode,
      });
      fetch(`${supabaseUrl}/rest/v1/leaderboard`, {
        method: "POST",
        keepalive: true,
        headers: {
          "Content-Type": "application/json",
          apikey: supabaseAnonKey,
          Authorization: `Bearer ${supabaseAnonKey}`,
          Prefer: "return=minimal",
        },
        body,
      }).catch(() => {});
    };
    window.addEventListener("beforeunload", onUnload);
    return () => window.removeEventListener("beforeunload", onUnload);
  }, []);

  const handleReset = useCallback(() => {
    submittedRef.current = false;
    reset();
  }, [reset]);

  return (
    <div className="min-h-screen w-full px-3 py-5 text-foreground">
      <div className="mx-auto flex max-w-[520px] flex-col gap-4">
        <div className="overflow-hidden rounded-xl border-2 border-border bg-card/40 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.8)]">
          <header className="flex items-center justify-between gap-3 border-b border-border bg-gradient-to-r from-card to-muted/30 px-3 py-2.5">
            <div className="flex items-center gap-2.5">
              <TankLogo />
              <div className="leading-tight">
                <h1 className="bg-gradient-to-r from-primary to-amber-300 bg-clip-text text-lg font-extrabold tracking-tight text-transparent">
                  坦克大战
                </h1>
                <p className="text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
                  Battle City
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {stats.status === "playing" && !stats.intro && (
                <Button size="sm" variant="outline" onClick={togglePause}>
                  <Pause className="size-4" aria-hidden /> 暂停
                </Button>
              )}
              {stats.status === "paused" && (
                <Button size="sm" variant="outline" onClick={togglePause}>
                  <Play className="size-4" aria-hidden /> 继续
                </Button>
              )}
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  lb.refresh();
                  setShowBoard(true);
                }}
              >
                <Crown className="size-4" aria-hidden /> 排行
              </Button>
              <Button size="sm" variant="ghost" onClick={handleReset} title="重置">
                <RotateCcw className="size-4" aria-hidden />
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowShop(true)} title="强化商店">
                <Coins className="size-4" aria-hidden />
              </Button>
              <Button size="sm" variant="ghost" onClick={cycle} title="切换主题">
                <Palette className="size-4" aria-hidden />
                {THEMES.find((t) => t.id === theme)?.label}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={toggleSound}
                title={soundEnabled ? "静音" : "开启音效"}
                aria-label={soundEnabled ? "静音" : "开启音效"}
              >
                {soundEnabled ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
              </Button>
            </div>
          </header>

          <div className="relative bg-[#08080a] p-2.5">
            <div
              className="relative mx-auto overflow-hidden rounded border border-black/60"
              style={{ maxWidth: BOARD_W, aspectRatio: "1 / 1" }}
            >
              <canvas
                ref={canvasRef}
                width={BOARD_W}
                height={BOARD_H}
                className="block w-full bg-[#0d0f08]"
                style={{ imageRendering: "pixelated" }}
              />
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(rgba(0,0,0,0.16) 0px, rgba(0,0,0,0.16) 1px, transparent 1px, transparent 3px)",
                }}
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-0 z-10"
                style={{
                  background:
                    "radial-gradient(ellipse at center, transparent 58%, rgba(0,0,0,0.5) 100%)",
                }}
                aria-hidden
              />
              <Corner pos="tl" />
              <Corner pos="tr" />
              <Corner pos="bl" />
              <Corner pos="br" />

              {stats.status === "ready" && (
                <Overlay>
                  <Trophy className="size-10 text-primary" aria-hidden />
                  <p className="text-xl font-bold">坦克大战</p>
                  <div className="flex gap-2">
                    <Button
                      variant={!twoPlayer ? "default" : "outline"}
                      onClick={() => setTwoPlayer(false)}
                    >
                      <User className="size-4" aria-hidden /> 1 人
                    </Button>
                    <Button
                      variant={twoPlayer ? "default" : "outline"}
                      onClick={() => setTwoPlayer(true)}
                    >
                      <Users className="size-4" aria-hidden /> 2 人
                    </Button>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant={stats.mode === "campaign" ? "default" : "outline"}
                      onClick={() => setMode("campaign")}
                    >
                      闯关
                    </Button>
                    <Button
                      size="sm"
                      variant={stats.mode === "endless" ? "default" : "outline"}
                      onClick={() => setMode("endless")}
                    >
                      无尽
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setShowShop(true)}>
                      <Coins className="size-4" aria-hidden /> 强化
                    </Button>
                  </div>
                  <p className="max-w-[280px] text-xs text-muted-foreground">
                    守护基地，消灭敌方坦克。每 3 关夜战，每 4 关 BOSS，空袭随机降临。
                  </p>
                  <Button onClick={start}>
                    <Play className="size-4" aria-hidden /> 开始游戏
                  </Button>
                </Overlay>
              )}

              {stats.intro && stats.status === "playing" && (
                <Overlay>
                  <p className="text-3xl font-extrabold tracking-widest text-primary">
                    {stats.mode === "endless" ? "ENDLESS " : "STAGE "}
                    {stats.level}
                  </p>
                  <div className="flex gap-2 text-sm font-semibold">
                    {stats.night && <span className="text-blue-300">夜战</span>}
                    {stats.level % 4 === 0 && stats.mode === "campaign" && (
                      <span className="text-destructive">BOSS 关</span>
                    )}
                  </div>
                </Overlay>
              )}

              {stats.status === "paused" && (
                <PauseOverlay stats={stats} onResume={togglePause} />
              )}

              {stats.status === "gameover" && (
                <GameOverOverlay
                  stats={stats}
                  entries={lb.entries}
                  loading={lb.loading}
                  error={lb.error}
                  lastName={lb.lastName}
                  onSubmit={submitScore}
                  onRestart={start}
                />
              )}

              {stats.status === "win" && (
                <Overlay>
                  <Trophy className="size-10 text-primary" aria-hidden />
                  <p className="text-xl font-bold">关卡通过</p>
                  <p className="text-sm text-muted-foreground">
                    进入第 {stats.level + 1} 关...
                  </p>
                </Overlay>
              )}

              <LeaderboardModal
                open={showBoard}
                onClose={() => setShowBoard(false)}
                entries={lb.entries}
                loading={lb.loading}
                error={lb.error}
                boardMode={lb.boardMode}
                onMode={lb.changeMode}
              />

              <UpgradeShop open={showShop} onClose={() => setShowShop(false)} />
            </div>
          </div>

          <div className="border-t border-border bg-card/60 px-3 py-2.5">
            <Hud stats={stats} />
            <p className="mt-2 text-[10px] leading-relaxed text-muted-foreground">
              P1: WASD+空格 · {stats.twoPlayer ? "P2: 方向键+/" : "或 方向键+空格"} · P暂停 · 道具 星/命/冻/雷/锹/盔/散/速
            </p>
          </div>
        </div>

        <TouchControls onPress={press} onRelease={release} onFire={fire} twoPlayer={twoPlayer} />
      </div>
    </div>
  );
}
