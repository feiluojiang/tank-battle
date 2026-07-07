import { supabase } from "@/supabase/client";

export type GameMode = "campaign" | "endless";

export interface LeaderboardEntry {
  id: string;
  player_name: string;
  score: number;
  level: number;
  enemies_destroyed: number;
  play_time_seconds: number;
  mode: string;
  created_at: string;
}

export interface SubmitInput {
  playerName: string;
  score: number;
  level: number;
  enemiesDestroyed: number;
  playTimeSeconds: number;
  mode: GameMode;
}

export async function submitLeaderboardEntry(input: SubmitInput): Promise<void> {
  const name = input.playerName.trim().slice(0, 12) || "匿名";
  const { error } = await supabase.from("leaderboard").insert({
    player_name: name,
    score: Math.max(0, Math.floor(input.score)),
    level: Math.max(1, Math.floor(input.level)),
    enemies_destroyed: Math.max(0, Math.floor(input.enemiesDestroyed)),
    play_time_seconds: Math.max(0, Math.floor(input.playTimeSeconds)),
    mode: input.mode,
  });
  if (error) throw error;
}

export async function getLeaderboard(
  limit = 20,
  mode?: GameMode,
): Promise<LeaderboardEntry[]> {
  let q = supabase
    .from("leaderboard")
    .select(
      "id, player_name, score, level, enemies_destroyed, play_time_seconds, mode, created_at",
    )
    .order("score", { ascending: false })
    .order("level", { ascending: false })
    .order("created_at", { ascending: true });
  if (mode) q = q.eq("mode", mode);
  const { data, error } = await q.limit(limit);
  if (error) throw error;
  return (data ?? []) as LeaderboardEntry[];
}
