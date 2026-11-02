import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type RefObject,
} from "react";
import {
  CHAT_OPEN_KEY,
  CHAT_WIDTH_KEY,
  CHAT_COLLAPSED_KEY,
  CHAT_PANEL_DEFAULT_WIDTH,
  CHAT_URL, // single source of truth — keep the postMessage target in sync
  TOGGLE_CHAT_EVENT,
  clampPanelWidth,
} from "../lib/chat-panel";
import { useTheme } from "./ThemeContext";

interface ChatPanelContextValue {
  open: boolean;
  toggle: () => void;
  setOpen: (open: boolean) => void;
  width: number;
  setWidth: (width: number) => void;
  setWidthLive: (width: number) => void;
  /** 60%-width partial collapse (separate from open/close). */
  collapsed: boolean;
  toggleCollapse: () => void;
  markUncollapsed: () => void;
  /** True once the iframe has mounted — never unmounts after that. */
  mounted: boolean;
  iframeRef: RefObject<HTMLIFrameElement | null>;
  syncTheme: () => void;
}

const ChatPanelContext = createContext<ChatPanelContextValue>({
  open: false,
  toggle: () => {},
  setOpen: () => {},
  width: CHAT_PANEL_DEFAULT_WIDTH,
  setWidth: () => {},
  setWidthLive: () => {},
  collapsed: false,
  toggleCollapse: () => {},
  markUncollapsed: () => {},
  mounted: false,
  iframeRef: { current: null },
  syncTheme: () => {},
});

function readOpen(): boolean {
  try {
    return localStorage.getItem(CHAT_OPEN_KEY) === "1";
  } catch {
    return false;
  }
}

function readWidth(): number {
  try {
    return clampPanelWidth(Number(localStorage.getItem(CHAT_WIDTH_KEY)));
  } catch {
    return CHAT_PANEL_DEFAULT_WIDTH;
  }
}

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(CHAT_COLLAPSED_KEY) === "1";
  } catch {
    return false;
  }
}

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [open, setOpenState] = useState<boolean>(readOpen);
  const [width, setWidthState] = useState<number>(readWidth);
  const [collapsed, setCollapsedState] = useState<boolean>(readCollapsed);
  const [mounted, setMounted] = useState<boolean>(readOpen);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const prevWidth = useRef<number | null>(null);
  const openRef = useRef(open);
  const hashPushed = useRef(false);
  const suppressPop = useRef(false);
  useEffect(() => {
    openRef.current = open;
  }, [open ]);

  const isCoarseSheet = useCallback(
    () => window.matchMedia("(max-width: 900px)").matches,
    [],
  );

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(CHAT_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    if (next) {
      setMounted(true);
      // Mini-app back-dismiss: push a hash so Android Back / swipe closes.
      try {
        if (isCoarseSheet() && !window.location.hash) {
          hashPushed.current = true;
          window.history.pushState({ chat: 1 }, "", "#chat");
        }
      } catch {
        /* history unavailable */
      }
    } else if (hashPushed.current) {
      hashPushed.current = false;
      try {
        if (window.location.hash === "#chat") {
          suppressPop.current = true;
          window.history.back();
        }
      } catch {
        /* noop */
      }
    }
  }, [isCoarseSheet]);

  // Back button / gesture dismisses the open sheet.
  useEffect(() => {
    const onPop = () => {
      if (suppressPop.current) {
        suppressPop.current = false;
        return;
      }
      if (openRef.current && isCoarseSheet()) {
        hashPushed.current = false;
        setOpen(false);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [isCoarseSheet, setOpen]);

  const toggle = useCallback(() => {
    setOpen(!openRef.current);
  }, [setOpen]);

  const setWidth = useCallback((next: number) => {
    const clamped = clampPanelWidth(next);
    setWidthState(clamped);
    document.body.style.setProperty("--chat-w", `${clamped}px`);
    try {
      localStorage.setItem(CHAT_WIDTH_KEY, String(clamped));
    } catch {
      /* storage unavailable */
    }
  }, []);

  /** Drag-hot path: paint only, no React render, no persistence. */
  const setWidthLive = useCallback((next: number) => {
    document.body.style.setProperty(
      "--chat-w",
      `${clampPanelWidth(next)}px`,
    );
  }, []);

  const persistCollapsed = useCallback((next: boolean) => {
    setCollapsedState(next);
    try {
      localStorage.setItem(CHAT_COLLAPSED_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
  }, []);

  const toggleCollapse = useCallback(() => {
    setCollapsedState((was) => {
      if (was) {
        if (prevWidth.current !== null) {
          const restore = clampPanelWidth(prevWidth.current);
          setWidthState(restore);
          document.body.style.setProperty("--chat-w", `${restore}px`);
          try {
            localStorage.setItem(CHAT_WIDTH_KEY, String(restore));
          } catch {
            /* storage unavailable */
          }
        }
        prevWidth.current = null;
      } else {
        setWidthState((w) => {
          prevWidth.current = w;
          const shrunk = clampPanelWidth(w * 0.6);
          document.body.style.setProperty("--chat-w", `${shrunk}px`);
          try {
            localStorage.setItem(CHAT_WIDTH_KEY, String(shrunk));
          } catch {
            /* storage unavailable */
          }
          return shrunk;
        });
      }
      try {
        localStorage.setItem(CHAT_COLLAPSED_KEY, was ? "0" : "1");
      } catch {
        /* storage unavailable */
      }
      return !was;
    });
  }, []);

  const markUncollapsed = useCallback(() => {
    prevWidth.current = null;
    persistCollapsed(false);
  }, [persistCollapsed]);

  // Auto-collapse on tight viewports (<1100px), restore when wide again.
  // Only the viewport crossings are automated; user actions in between
  // are left alone until the next crossing.
  const collapseRef = useRef({ collapsed, toggleCollapse, markUncollapsed });
  useEffect(() => {
    collapseRef.current = { collapsed, toggleCollapse, markUncollapsed };
  });
  useEffect(() => {
    const parked = { value: null as boolean | null };
    const mql = window.matchMedia("(max-width: 1100px)");
    const apply = (matches: boolean) => {
      if (matches) {
        if (parked.value !== null) return;
        parked.value = collapseRef.current.collapsed;
        if (!collapseRef.current.collapsed) {
          collapseRef.current.toggleCollapse();
        }
      } else if (parked.value !== null) {
        const was = parked.value;
        parked.value = null;
        if (!was && collapseRef.current.collapsed) {
          collapseRef.current.toggleCollapse();
        }
      }
    };
    apply(mql.matches);
    const onChange = (e: MediaQueryListEvent) => apply(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  // Squeeze layout: a body class + width var the CSS reacts to.
  useEffect(() => {
    document.body.classList.toggle("chat-open", open);
    document.body.style.setProperty("--chat-w", `${width}px`);
    return () => {
      document.body.classList.remove("chat-open");
    };
  }, [open, width]);

  useEffect(() => {
    const onToggle = () => toggle();
    window.addEventListener(TOGGLE_CHAT_EVENT, onToggle);
    return () => window.removeEventListener(TOGGLE_CHAT_EVENT, onToggle);
  }, [toggle]);

  // Keep the framed chat on the same theme (chat validates the id).
  const syncTheme = useCallback(() => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        { type: "thoshan-theme", id: theme },
        CHAT_URL,
      );
    } catch {
      /* iframe not ready */
    }
  }, [theme]);

  useEffect(() => {
    if (mounted) syncTheme();
  }, [mounted, syncTheme]);

  const value = useMemo(
    () => ({ open, toggle, setOpen, width, setWidth, setWidthLive, collapsed, toggleCollapse, markUncollapsed, mounted, iframeRef, syncTheme }),
    [open, toggle, setOpen, width, setWidth, setWidthLive, collapsed, toggleCollapse, markUncollapsed, mounted, syncTheme],
  );

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export const useChatPanel = () => useContext(ChatPanelContext);
