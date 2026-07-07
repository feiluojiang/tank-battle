import { useCallback, useEffect, useRef, useState } from "react";
import { TankGame } from "@/game/engine";
import { renderGame } from "@/game/render";
import { SoundManager } from "@/game/sound";
import { Dir, type DirId, type GameEvent } from "@/game/constants";
import type { GameStats } from "@/game/types";

const WASD: Record<string, DirId> = {
  KeyW: Dir.Up,
  KeyD: Dir.Right,
  KeyS: Dir.Down,
  KeyA: Dir.Left,
};
const ARROWS: Record<string, DirId> = {
  ArrowUp: Dir.Up,
  ArrowRight: Dir.Right,
  ArrowDown: Dir.Down,
  ArrowLeft: Dir.Left,
};

const INITIAL_STATS: GameStats = {
  status: "ready",
  lives: 3,
  lives2: 3,
  score: 0,
  highScore: 0,
  level: 1,
  enemiesLeft: 12,
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

export function useTankGame() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const stackRef = useRef<DirId[][]>([[], []]);
  const twoPlayerRef = useRef(false);
  const soundRef = useRef<SoundManager | null>(null);
  if (soundRef.current === null) soundRef.current = new SoundManager();
  const [stats, setStats] = useState<GameStats>(INITIAL_STATS);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [twoPlayer, setTwoPlayerState] = useState(false);
  const gameRef = useRef<TankGame | null>(null);
  if (gameRef.current === null) {
    gameRef.current = new TankGame(
      (s) => setStats(s),
      (e: GameEvent) => soundRef.current?.play(e),
    );
  }

  useEffect(() => {
    const game = gameRef.current!;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    let last = performance.now();
    let rafId = 0;
    const loop = (now: number) => {
      const dt = Math.min(48, now - last);
      last = now;
      try {
        game.update(dt);
        if (ctx) renderGame(ctx, game, now);
      } catch (err) {
        console.error("game loop error:", err);
      }
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, []);

  const recompute = useCallback((idx: number) => {
    const game = gameRef.current!;
    const s = stackRef.current[idx];
    game.setMove(idx, s.length > 0 ? s[s.length - 1] : null);
  }, []);

  useEffect(() => {
    const game = gameRef.current!;
    const sound = soundRef.current!;
    const push = (idx: number, dir: DirId) => {
      const s = stackRef.current[idx];
      if (!s.includes(dir)) s.push(dir);
      recompute(idx);
    };
    const isTyping = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (!el) return false;
      const tag = el.tagName;
      return tag === "INPUT" || tag === "TEXTAREA" || el.isContentEditable;
    };
    const onDown = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      sound.resume();
      const k = e.code;
      const p2 = twoPlayerRef.current;
      if (k in WASD) {
        e.preventDefault();
        push(0, WASD[k]);
      } else if (k in ARROWS) {
        e.preventDefault();
        push(p2 ? 1 : 0, ARROWS[k]);
      } else if (k === "Space" || k === "KeyJ") {
        e.preventDefault();
        if (!e.repeat) game.doShoot(0);
      } else if (k === "ShiftRight" || k === "Slash" || k === "Numpad0") {
        e.preventDefault();
        if (!e.repeat) game.doShoot(p2 ? 1 : 0);
      } else if (k === "KeyP") {
        if (!e.repeat) game.togglePause();
      } else if (k === "Enter") {
        if (!e.repeat) game.start();
      }
    };
    const onUp = (e: KeyboardEvent) => {
      if (isTyping(e)) return;
      const k = e.code;
      const p2 = twoPlayerRef.current;
      if (k in WASD) {
        e.preventDefault();
        const s = stackRef.current[0];
        const i = s.indexOf(WASD[k]);
        if (i >= 0) s.splice(i, 1);
        recompute(0);
      } else if (k in ARROWS) {
        const idx = p2 ? 1 : 0;
        const s = stackRef.current[idx];
        const i = s.indexOf(ARROWS[k]);
        if (i >= 0) s.splice(i, 1);
        recompute(idx);
      }
    };
    const onBlur = () => {
      stackRef.current = [[], []];
      recompute(0);
      recompute(1);
    };
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [recompute]);

  useEffect(() => {
    const sound = soundRef.current;
    if (!sound) return;
    if (soundEnabled && stats.status === "playing" && !stats.intro) {
      sound.startBgm();
    } else {
      sound.stopBgm();
    }
  }, [stats.status, stats.intro, soundEnabled]);

  const start = useCallback(() => {
    soundRef.current?.resume();
    gameRef.current?.start();
  }, []);
  const togglePause = useCallback(() => gameRef.current?.togglePause(), []);
  const reset = useCallback(() => gameRef.current?.reset(), []);
  const toggleSound = useCallback(() => {
    setSoundEnabled((v) => {
      const next = !v;
      soundRef.current?.resume();
      soundRef.current?.setEnabled(next);
      return next;
    });
  }, []);
  const setTwoPlayer = useCallback((v: boolean) => {
    twoPlayerRef.current = v;
    setTwoPlayerState(v);
    gameRef.current?.setTwoPlayer(v);
  }, []);
  const setMode = useCallback((m: "campaign" | "endless") => {
    gameRef.current?.setMode(m);
  }, []);
  const press = useCallback(
    (idx: number, dir: DirId) => {
      const s = stackRef.current[idx];
      if (!s.includes(dir)) s.push(dir);
      recompute(idx);
    },
    [recompute],
  );
  const release = useCallback(
    (idx: number, dir: DirId) => {
      const s = stackRef.current[idx];
      const i = s.indexOf(dir);
      if (i >= 0) s.splice(i, 1);
      recompute(idx);
    },
    [recompute],
  );
  const fire = useCallback((idx: number) => {
    soundRef.current?.resume();
    gameRef.current?.doShoot(idx);
  }, []);

  return {
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
  };
}
