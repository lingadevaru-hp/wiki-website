import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider, useSearch } from "./contexts/SearchContext";
import { ChatPanelProvider } from "./contexts/ChatPanelContext";
import { posthog, pageviewProps } from "./lib/posthog";
import { LocaleProvider } from "./contexts/LocaleContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSearch from "./components/GlobalSearch";
import { CommandMenu } from "./components/CommandMenu";
import ChatPanel from "./components/ChatPanel";
import { toggleChatPanel } from "./lib/chat-panel";
import ShortcutsModal from "./components/ShortcutsModal";
import { ThemePicker } from "./components/ThemePicker";
import { TextSelectionCopy } from "./components/TextSelectionCopy";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ArticlePage from "./pages/ArticlePage";
import SearchPage from "./pages/SearchPage";
import ArticlesPage from "./pages/ArticlesPage";
import {
  AchievementsPage,
  NewsPage,
  ProjectsPage,
} from "./pages/Collections";
import NotFoundPage from "./pages/NotFoundPage";

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
    </div>
  );
}

function Router() {
  const [location] = useLocation();
  useEffect(() => {
    posthog.capture("$pageview", pageviewProps());
  }, [location]);
  return <RouteTransition />;
}

/** Handles global keyboard shortcuts — must live inside SearchProvider */
function GlobalKeyboardHandler() {
  const { openSearch } = useSearch();
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const tag = (document.activeElement as HTMLElement)?.tagName;
      const inInput = tag === "INPUT" || tag === "TEXTAREA";

      // Win+K / Ctrl+K / Cmd+K → open global search modal
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

      // Slash opens search when the user is not already typing.
      if (e.key === "/" && !inInput && !e.ctrlKey && !e.metaKey && !e.altKey) {
        e.preventDefault();
        openSearch();
        return;
      }

      // Ctrl+/ → toggle keyboard shortcuts cheatsheet
      if (e.key === "/" && (e.ctrlKey || e.metaKey) && !inInput) {
        e.preventDefault();
        setShortcutsOpen((v) => !v);
      }

      // Ctrl/Cmd+Space → toggle chat panel (works everywhere, even in inputs:
      // iframe keystrokes never reach the parent anyway).
      if (
        (e.key === " " || e.code === "Space") &&
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey
      ) {
        e.preventDefault();
        toggleChatPanel();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openSearch]);

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
