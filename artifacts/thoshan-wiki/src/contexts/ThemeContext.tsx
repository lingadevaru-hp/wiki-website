import { createContext, useCallback, useContext, useEffect, useState } from "react";

export const SITE_THEMES = [
  { id: "tokyo-night", name: "Tokyo Night", light: false, accent: "212 100% 67%", background: "220 25% 8%", card: "220 24% 12%", foreground: "220 30% 92%" },
  { id: "catppuccin", name: "Catppuccin", light: false, accent: "267 84% 81%", background: "240 21% 15%", card: "240 21% 19%", foreground: "226 64% 88%" },
  { id: "gruvbox", name: "Gruvbox", light: false, accent: "27 96% 61%", background: "24 20% 12%", card: "24 16% 17%", foreground: "43 59% 81%" },
  { id: "everforest", name: "Everforest", light: false, accent: "137 45% 63%", background: "150 15% 12%", card: "150 13% 17%", foreground: "46 46% 83%" },
  { id: "nord", name: "Nord", light: false, accent: "193 43% 67%", background: "220 16% 16%", card: "220 16% 22%", foreground: "218 27% 88%" },
  { id: "rose-pine", name: "Rosé Pine", light: false, accent: "343 76% 68%", background: "249 22% 12%", card: "247 23% 16%", foreground: "245 50% 91%" },
  { id: "matte-black", name: "Matte Black", light: false, accent: "79 70% 55%", background: "0 0% 4%", card: "0 0% 9%", foreground: "0 0% 92%" },
  { id: "flexoki-light", name: "Flexoki Light", light: true, accent: "25 75% 42%", background: "48 33% 97%", card: "48 20% 92%", foreground: "35 20% 15%" },
  { id: "catppuccin-latte", name: "Catppuccin Latte", light: true, accent: "266 85% 58%", background: "220 23% 95%", card: "220 23% 91%", foreground: "234 16% 25%" },
  { id: "white", name: "White", light: true, accent: "219 79% 47%", background: "0 0% 100%", card: "210 17% 98%", foreground: "210 4% 20%" },
] as const;
export type Theme = (typeof SITE_THEMES)[number]["id"];

interface ThemeContextValue {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "tokyo-night",
  toggleTheme: () => {},
  setTheme: () => {},
});

function suppressTransitions() {
  const root = document.documentElement;
  root.classList.add("theme-transitioning");
  // Force a reflow so the transition:none rule takes effect
  void root.offsetHeight;
  // Remove the class on the next frame so transitions resume
  requestAnimationFrame(() => {
    root.classList.remove("theme-transitioning");
  });
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem("wiki-theme") as Theme | null;
    return SITE_THEMES.some((item) => item.id === stored) ? stored! : "tokyo-night";
  });

  useEffect(() => {
    const root = document.documentElement;
    const selected = SITE_THEMES.find((item) => item.id === theme) || SITE_THEMES[0];
    root.dataset.theme = selected.id;
    root.classList.toggle("dark", !selected.light);
    localStorage.setItem("wiki-theme", theme);
  }, [theme]);

  // Listen for system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => {
      // Only auto-switch if user hasn't set a preference
      const stored = localStorage.getItem("wiki-theme");
      if (!stored) {
        suppressTransitions();
        setThemeState(e.matches ? "tokyo-night" : "white");
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const toggleTheme = useCallback(() => {
    suppressTransitions();
    setThemeState((t) => {
      const index = SITE_THEMES.findIndex((item) => item.id === t);
      return SITE_THEMES[(index + 1) % SITE_THEMES.length].id;
    });
  }, []);

  const setTheme = useCallback((t: Theme) => {
    suppressTransitions();
    setThemeState(t);
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
