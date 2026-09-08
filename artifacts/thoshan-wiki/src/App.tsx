import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "./contexts/ThemeContext";
import { SearchProvider, useSearch } from "./contexts/SearchContext";
import ErrorBoundary from "./components/ErrorBoundary";
import GlobalSearch from "./components/GlobalSearch";
import ShortcutsModal from "./components/ShortcutsModal";
import { ThemePicker } from "./components/ThemePicker";
import LandingPage from "./pages/LandingPage";
import HomePage from "./pages/HomePage";
import ArticlePage from "./pages/ArticlePage";
import SearchPage from "./pages/SearchPage";
import ArticlesPage from "./pages/ArticlesPage";
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
        <Route path="/wiki/:slug" component={ArticlePage} />
        <Route component={NotFoundPage} />
      </Switch>
    </div>
  );
}

function Router() {
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

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <SearchProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
              <GlobalKeyboardHandler />
              <ThemePicker />
              <Toaster />
            </SearchProvider>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
