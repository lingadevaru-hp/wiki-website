import { lazy, Suspense, useState, useEffect, useRef } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider, useSearch } from "./contexts/SearchContext";
import { ChatPanelProvider } from "./contexts/ChatPanelContext";
import { capturePostHog, pageviewProps } from "./lib/posthog";
import { LocaleProvider } from "./contexts/LocaleContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSearch from "./components/GlobalSearch";
import { CommandMenu } from "./components/CommandMenu";
import ChatPanel from "./components/ChatPanel";
import { toggleChatPanel } from "./lib/chat-panel";
import ShortcutsModal, { OPEN_SHORTCUTS_EVENT } from "./components/ShortcutsModal";
import { ThemePicker } from "./components/ThemePicker";
import { OPEN_PICKER_EVENT } from "./lib/theme";
import { OPEN_PALETTE_EVENT } from "./lib/command-menu";
import { music } from "./lib/music";
import { TextSelectionCopy } from "./components/TextSelectionCopy";
import LandingPage from "./pages/LandingPage";

const HomePage = lazy(() => import("./pages/HomePage"));
const ArticlePage = lazy(() => import("./pages/ArticlePage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const ArticlesPage = lazy(() => import("./pages/ArticlesPage"));
const AchievementsPage = lazy(async () => ({
  default: (await import("./pages/Collections")).AchievementsPage,
}));
const NewsPage = lazy(async () => ({
  default: (await import("./pages/Collections")).NewsPage,
}));
const ProjectsPage = lazy(async () => ({
  default: (await import("./pages/Collections")).ProjectsPage,
}));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function RouteTransition() {
  const [location] = useLocation();
  const [displayLocation, setDisplayLocation] = useState(location);
  const [transitionStage, setTransitionStage] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    if (location !== displayLocation) {
      setTransitionStage("exit");
    }
  }, [location, displayLocation]);

  useEffect(() => {
    if (transitionStage === "exit") {
      const timer = setTimeout(() => {
        setDisplayLocation(location);
        setTransitionStage("enter");
      }, 150);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [transitionStage, location]);

  return (
    <div className={`route-transition route-transition--${transitionStage}`}>
      <Suspense fallback={null}>
        <Switch>
          <Route path="/" component={LandingPage} />
          <Route path="/wiki/home" component={HomePage} />
          <Route path="/wiki/search" component={SearchPage} />
          <Route path="/wiki/articles" component={ArticlesPage} />
          <Route path="/projects" component={ProjectsPage} />
          <Route path="/achievements" component={AchievementsPage} />
          <Route path="/news" component={NewsPage} />
          <Route path="/events" component={NewsPage} />
          <Route path="/wiki/:slug" component={ArticlePage} />
          <Route component={NotFoundPage} />
        </Switch>
      </Suspense>
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    capturePostHog("$pageview", pageviewProps());
  }, [location]);
  return <RouteTransition />;
}

/**
 * Handles global keyboard shortcuts — must live inside SearchProvider.
 *
 * Design rules (desktop/laptop enhancement; touch users get the same
 * actions as taps — this changes nothing on mobile):
 * - NEVER Super (Omarchy/Hyprland eats it before the browser sees it).
 * - NEVER browser-reserved Ctrl+W/T/N/P/S/R/F/L or Alt+arrows — the site
 *   must not fight the browser for tab/window control.
 * - Single-letter keys fire only when the user is NOT typing (no input,
 *   textarea, select, or contenteditable focused) and no overlay with its
 *   own input (search / palette) is open.
 */
function GlobalKeyboardHandler() {
  const { openSearch } = useSearch();
  const [, setLocation] = useLocation();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);
  const shortcutsOpenRef = useRef(false);
  shortcutsOpenRef.current = shortcutsOpen;
  // "g" prefix for go-to sequences (g h = home …), disarmed after 900ms.
  const gArmed = useRef<number | null>(null);

  const disarmG = () => {
    if (gArmed.current !== null) {
      window.clearTimeout(gArmed.current);
      gArmed.current = null;
    }
  };

  // The manual can also be opened from the main menu (palette row).
  useEffect(() => {
    const onShortcuts = () => setShortcutsOpen(true);
    window.addEventListener(OPEN_SHORTCUTS_EVENT, onShortcuts);
    return () => window.removeEventListener(OPEN_SHORTCUTS_EVENT, onShortcuts);
  }, []);

  useEffect(() => {
    function smooth(): ScrollBehavior {
      try {
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches)
          return "auto";
      } catch {
        /* older webviews */
      }
      return "smooth";
    }

    function handleKeyDown(e: KeyboardEvent) {
      const el = document.activeElement as HTMLElement | null;
      const tag = el?.tagName;
      const inInput =
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        el?.isContentEditable === true;
      const overlayOpen =
        !!document.querySelector("[data-testid='global-search-modal']") ||
        !!document.querySelector(".command-palette");
      const modalOpen = shortcutsOpenRef.current;

      // Win+K / Ctrl+K / Cmd+K → open global search modal (even in inputs)
      if (
        e.key === "k" &&
        (e.ctrlKey || e.metaKey || e.getModifierState?.("OS")) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        openSearch();
        return;
      }

      // Ctrl/Cmd+Space → toggle chat panel (works everywhere, even in
      // inputs: iframe keystrokes never reach the parent anyway).
      if (
        (e.key === " " || e.code === "Space") &&
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        toggleChatPanel();
        return;
      }

      // Everything below needs a free keyboard: not typing, no search or
      // palette overlay open, no other modal open.
      if (inInput || overlayOpen || modalOpen) {
        // Ctrl+/ still toggles the manual from outside inputs (kept from
        // the original cheatsheet); Esc lets a pending "g" be cancelled.
        if (e.key === "/" && (e.ctrlKey || e.metaKey) && !inInput) {
          e.preventDefault();
          setShortcutsOpen((v) => !v);
        }
        if (e.key === "Escape") disarmG();
        return;
      }
      if (e.ctrlKey || e.metaKey || e.altKey) return;

      // "g" go-to sequences: g h/w/a/p/v/n/b pages, g g top, G bottom.
      if (gArmed.current !== null) {
        const seq: Record<string, string> = {
          h: "/",
          w: "/wiki/home",
          a: "/wiki/articles",
          p: "/projects",
          v: "/achievements",
          n: "/news",
          b: "/wiki/about",
        };
        disarmG();
        if (e.key === "g") {
          e.preventDefault();
          window.scrollTo({ top: 0, behavior: smooth() });
          return;
        }
        if (e.key === "G") {
          e.preventDefault();
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: smooth(),
          });
          return;
        }
        const to = seq[e.key.toLowerCase()];
        if (e.key.length === 1 && to) {
          e.preventDefault();
          setLocation(to);
        }
        return;
      }
      if (e.key === "g" || e.key === "G") {
        // Bare G (Shift+G) = bottom at once; plain g arms a sequence.
        if (e.key === "G") {
          e.preventDefault();
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: smooth(),
          });
          return;
        }
        e.preventDefault();
        gArmed.current = window.setTimeout(disarmG, 900);
        return;
      }

      // Single-key actions (desktop only in effect — phones have no
      // physical keyboard; every action is also a tap target).
      switch (e.key) {
        case "/":
          e.preventDefault();
          openSearch();
          break;
        case "?":
          // "?" is Shift+/ on most layouts — the discoverable help key.
          e.preventDefault();
          setShortcutsOpen(true);
          break;
        case "m":
        case "M":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(OPEN_PALETTE_EVENT));
          break;
        case "c":
        case "C":
          e.preventDefault();
          toggleChatPanel();
          break;
        case "t":
        case "T":
          e.preventDefault();
          window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT));
          break;
        case "x":
        case "X":
          // Mute / unmute the site music from anywhere.
          e.preventDefault();
          music.toggle();
          break;
        case "j":
          e.preventDefault();
          window.scrollBy({ top: 120, behavior: smooth() });
          break;
        case "k":
          e.preventDefault();
          window.scrollBy({ top: -120, behavior: smooth() });
          break;
        case "d":
          e.preventDefault();
          window.scrollBy({
            top: Math.round(window.innerHeight / 2),
            behavior: smooth(),
          });
          break;
        case "u":
          e.preventDefault();
          window.scrollBy({
            top: -Math.round(window.innerHeight / 2),
            behavior: smooth(),
          });
          break;
        case "Escape":
          disarmG();
          break;
        default:
          break;
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      disarmG();
    };
  }, [openSearch, setLocation]);

  return (
    <>
      <GlobalSearch />
      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
      />
    </>
  );
}

/**
 * Mobile keyboards cover half the screen: whenever a field (search, chat,
 * newsletter, any input) takes focus on a narrow viewport, re-center it
 * above the keypad after the keyboard finishes opening. Desktop unaffected.
 */
function KeepFieldVisible() {
  useEffect(() => {
    const onFocusIn = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target || window.innerWidth > 820) return;
      const field = target.closest?.(
        'input, textarea, select, [contenteditable="true"]',
      );
      if (!field) return;
      window.setTimeout(() => {
        if (document.hidden) return;
        try {
          field.scrollIntoView({ block: "center", behavior: "smooth" });
        } catch {
          /* older webviews */
        }
      }, 350);
    };
    document.addEventListener("focusin", onFocusIn);
    return () => document.removeEventListener("focusin", onFocusIn);
  }, []);
  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <LocaleProvider>
              <SearchProvider>
              <ChatPanelProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <GlobalKeyboardHandler />
              <KeepFieldVisible />
              <CommandMenu />
              <ChatPanel />
              <ThemePicker />
              <Toaster />
              <TextSelectionCopy />
              </ChatPanelProvider>
            </SearchProvider>
            </LocaleProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
