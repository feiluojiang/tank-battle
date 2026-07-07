import { useEffect, useState } from "react";

export type ThemeId = "military" | "classic" | "cyber" | "light" | "midnight" | "desert" | "blood" | "ice";

export const THEMES: { id: ThemeId; label: string }[] = [
  { id: "military", label: "军绿" },
  { id: "classic", label: "经典" },
  { id: "cyber", label: "赛博" },
  { id: "light", label: "简约" },
  { id: "midnight", label: "暗夜" },
  { id: "desert", label: "沙漠" },
  { id: "blood", label: "血战" },
  { id: "ice", label: "冰原" },
];

const KEY = "tank-battle-theme";

export function useTheme() {
  const [theme, setTheme] = useState<ThemeId>(() => {
    if (typeof localStorage === "undefined") return "military";
    return (localStorage.getItem(KEY) as ThemeId | null) ?? "military";
  });
  useEffect(() => {
    const el = document.documentElement;
    if (theme === "military") delete el.dataset.theme;
    else el.dataset.theme = theme;
    if (typeof localStorage !== "undefined") localStorage.setItem(KEY, theme);
  }, [theme]);
  const cycle = () => {
    setTheme((cur) => {
      const i = THEMES.findIndex((t) => t.id === cur);
      return THEMES[(i + 1) % THEMES.length].id;
    });
  };
  return { theme, setTheme, cycle };
}
