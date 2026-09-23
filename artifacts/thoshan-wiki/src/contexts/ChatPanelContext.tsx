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
  CHAT_PANEL_DEFAULT_WIDTH,
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

export function ChatPanelProvider({ children }: { children: ReactNode }) {
  const { theme } = useTheme();
  const [open, setOpenState] = useState<boolean>(readOpen);
  const [width, setWidthState] = useState<number>(readWidth);
  const [mounted, setMounted] = useState<boolean>(readOpen);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const setOpen = useCallback((next: boolean) => {
    setOpenState(next);
    try {
      localStorage.setItem(CHAT_OPEN_KEY, next ? "1" : "0");
    } catch {
      /* storage unavailable */
    }
    if (next) setMounted(true);
  }, []);

  const toggle = useCallback(() => {
    setOpenState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(CHAT_OPEN_KEY, next ? "1" : "0");
      } catch {
        /* storage unavailable */
      }
      if (next) setMounted(true);
      return next;
    });
  }, []);

  const setWidth = useCallback((next: number) => {
    const clamped = clampPanelWidth(next);
    setWidthState(clamped);
    try {
      localStorage.setItem(CHAT_WIDTH_KEY, String(clamped));
    } catch {
      /* storage unavailable */
    }
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
        "https://chat.lingadevaru.in",
      );
    } catch {
      /* iframe not ready */
    }
  }, [theme]);

  useEffect(() => {
    if (mounted) syncTheme();
  }, [mounted, syncTheme]);

  const value = useMemo(
    () => ({ open, toggle, setOpen, width, setWidth, mounted, iframeRef, syncTheme }),
    [open, toggle, setOpen, width, setWidth, mounted, syncTheme],
  );

  return (
    <ChatPanelContext.Provider value={value}>
      {children}
    </ChatPanelContext.Provider>
  );
}

export const useChatPanel = () => useContext(ChatPanelContext);
