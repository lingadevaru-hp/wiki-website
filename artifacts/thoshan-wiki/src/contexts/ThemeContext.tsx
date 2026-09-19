import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { flushSync } from "react-dom";
import {
  SITE_THEMES as OFFICIAL_THEMES,
  THEME_EVENT,
  applyTheme,
  readTheme,
  switchTheme,
} from "../lib/theme";

export const SITE_THEMES = [
  ["catppuccin", "Catppuccin", "18 18% 12%", "82 80% 76%", "20 20% 16%", false],
  ["catppuccin-latte", "Catppuccin Latte", "220 23% 95%", "234 16% 35%", "220 20% 91%", true],
  ["ethereal", "Ethereal", "250 24% 10%", "188 78% 78%", "250 25% 14%", false],
  ["everforest", "Everforest", "82 16% 12%", "82 42% 64%", "82 15% 17%", false],
  ["flexoki-light", "Flexoki Light", "45 35% 93%", "25 42% 26%", "42 28% 88%", true],
  ["gruvbox", "Gruvbox", "39 22% 12%", "44 75% 62%", "36 23% 18%", false],
  ["hackerman", "Hackerman", "120 100% 2%", "120 100% 54%", "120 45% 7%", false],
  ["kanagawa", "Kanagawa", "230 20% 12%", "35 68% 69%", "229 22% 17%", false],
  ["last-horizon", "Last Horizon", "245 22% 10%", "195 70% 72%", "245 23% 15%", false],
  ["lumon", "Lumon", "44 20% 89%", "212 36% 19%", "45 19% 82%", true],
  ["lupine", "Lupine", "280 22% 11%", "316 75% 74%", "280 23% 16%", false],
  ["matte-black", "Matte Black", "0 0% 5%", "0 0% 88%", "0 0% 10%", false],
  ["miasma", "Miasma", "250 13% 12%", "81 38% 57%", "250 15% 17%", false],
  ["nord", "Nord", "220 16% 14%", "193 43% 67%", "220 17% 19%", false],
  ["osaka-jade", "Osaka Jade", "161 23% 10%", "161 62% 62%", "161 21% 15%", false],
  ["retro-82", "Retro 82", "18 17% 10%", "29 88% 66%", "17 18% 15%", false],
  ["ristretto", "Ristretto", "25 25% 9%", "31 72% 67%", "23 25% 14%", false],
  ["rose-pine", "Rosé Pine", "248 18% 13%", "343 60% 73%", "248 19% 18%", false],
  ["solitude", "Solitude", "215 34% 96%", "222 47% 31%", "215 28% 91%", true],
  ["tokyo-night", "Tokyo Night", "232 25% 11%", "221 90% 74%", "231 25% 16%", false],
  ["vantablack", "Vantablack", "0 0% 1%", "0 0% 95%", "0 0% 5%", false],
  ["white", "White", "0 0% 100%", "0 0% 10%", "0 0% 96%", true],
] as const;

export type ThemeId = (typeof SITE_THEMES)[number][0];
type ThemeContextValue = { theme: ThemeId; isLight: boolean; toggleTheme: () => void; setTheme: (theme: ThemeId | "dark" | "light") => void };
const ThemeContext = createContext<ThemeContextValue>({ theme: "tokyo-night", isLight: false, toggleTheme: () => {}, setTheme: () => {} });
const validTheme = (value: string | null): value is ThemeId => SITE_THEMES.some(([id]) => id === value);
const normalize = (value: ThemeId | "dark" | "light"): ThemeId => value === "dark" ? "tokyo-night" : value === "light" ? "white" : value;
const isLightTheme = (id: ThemeId) => OFFICIAL_THEMES.find((t) => t.id === id)?.light === true;

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    const stored = readTheme();
    return validTheme(stored) ? stored : "tokyo-night";
  });
  useEffect(() => {
    // Single source: [data-theme] CSS drives all colors. JS only stamps theme + persists.
    applyTheme(theme);
    const root = document.documentElement;
    root.classList.toggle("dark", !isLightTheme(theme));
  }, [theme]);
  // Stay in sync when the official picker (or anything else) switches themes.
  useEffect(() => {
    const onTheme = (event: Event) => {
      const id = (event as CustomEvent<string>).detail;
      if (validTheme(id)) setThemeState(id);
    };
    window.addEventListener(THEME_EVENT, onTheme);
    return () => window.removeEventListener(THEME_EVENT, onTheme);
  }, []);
  const setTheme = useCallback((next: ThemeId | "dark" | "light") => {
    const id = normalize(next);
    if (id === readTheme()) {
      setThemeState(id);
      return;
    }
    switchTheme(id, () => flushSync(() => setThemeState(id)), { frosted: true });
  }, []);
  const toggleTheme = useCallback(() => {
    setTheme(isLightTheme(theme) ? "tokyo-night" : "white");
  }, [theme, setTheme]);
  return <ThemeContext.Provider value={{ theme, isLight: isLightTheme(theme), toggleTheme, setTheme }}>{children}</ThemeContext.Provider>;
}
export const useTheme = () => useContext(ThemeContext);
