import { useCallback, useState } from "react";
import {
  getLeaderboard,
  submitLeaderboardEntry,
  type GameMode,
  type LeaderboardEntry,
  type SubmitInput,
} from "@/game/leaderboard";

const NAME_KEY = "tank-battle-name";

function readName(): string {
  if (typeof localStorage === "undefined") return "";
  return localStorage.getItem(NAME_KEY) ?? "";
}

export function useLeaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardMode, setBoardMode] = useState<GameMode>("campaign");
  const [lastName, setLastName] = useState<string>(readName);

  const refresh = useCallback(
    async (mode?: GameMode) => {
      const m = mode ?? boardMode;
      setLoading(true);
      setError(null);
      try {
        setEntries(await getLeaderboard(20, m));
      } catch (e) {
        setError(e instanceof Error ? e.message : "加载失败");
      } finally {
        setLoading(false);
      }
    },
    [boardMode],
  );

  const changeMode = useCallback(
    async (mode: GameMode) => {
      setBoardMode(mode);
      await refresh(mode);
    },
    [refresh],
  );

  const submit = useCallback(
    async (input: SubmitInput) => {
      const name = input.playerName.trim().slice(0, 12) || "匿名";
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(NAME_KEY, name);
      }
      setLastName(name);
      await submitLeaderboardEntry({ ...input, playerName: name });
      setBoardMode(input.mode);
      await refresh(input.mode);
    },
    [refresh],
  );

  return {
    entries,
    loading,
    error,
    refresh,
    changeMode,
    submit,
    lastName,
    boardMode,
  };
}
