import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  MessageCircle,
  X,
} from "lucide-react";
import { useChatPanel } from "../contexts/ChatPanelContext";
import { useLocale } from "../contexts/LocaleContext";
import {
  CHAT_EMBED_URL,
  CHAT_PANEL_MIN_WIDTH,
  chatPanelMaxWidth,
  openChatFullSite,
} from "../lib/chat-panel";

/**
 * Slide-over chat panel embedding the live chat subdomain.
 * Mounted once at App level — the iframe is never unmounted, so the
 * session survives toggles, navigation and reloads (history lives in
 * the chat origin's localStorage).
 */
export default function ChatPanel() {
  const { t } = useLocale();
  const { open, setOpen, width, setWidth, setWidthLive, mounted, iframeRef, syncTheme } =
    useChatPanel();
  const panelRef = useRef<HTMLElement | null>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const lastX = useRef(0);
  const lastY = useRef(0);
  // Page-aware embed: slug captured at first open (session persists after).
  const [embedSrc, setEmbedSrc] = useState(CHAT_EMBED_URL);
  useEffect(() => {
    if (!mounted) return;
    try {
      const m = window.location.pathname.match(/^\/wiki\/([a-z0-9-]+)/i);
      if (m) setEmbedSrc(`${CHAT_EMBED_URL}&page=${m[1].toLowerCase()}`);
    } catch {
      /* keep default */
    }
  }, [mounted]);
  const sheetDragRef = useRef<{ startY: number; startH: number } | null>(null);

  // Remember who opened the panel for focus restore.
  useEffect(() => {
    if (open) {
      invokerRef.current = document.activeElement as HTMLElement | null;
      const close = panelRef.current?.querySelector<HTMLElement>(
        "[data-chat-close]",
      );
      close?.focus({ preventScroll: true });
    } else if (invokerRef.current) {
      invokerRef.current.focus({ preventScroll: true });
      invokerRef.current = null;
    }
  }, [open ]);

  // Esc closes (iframe keystrokes never reach us — acceptable).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setOpen(false);
        return;
      }
      // Lightweight focus trap.
      if (e.key === "Tab" && panelRef.current) {
        const items = Array.from(
          panelRef.current.querySelectorAll<HTMLElement>(
            'button, [href], iframe, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((el) => !el.hasAttribute("disabled"));
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  // Desktop drag-resize (left edge handle). Pointer capture on the handle
  // guarantees move/up delivery — the drag can never stick to the cursor.
  // Hot path paints the CSS var directly — zero React renders until release.
  const onResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      markUncollapsed();
      const handle = e.currentTarget;
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        /* capture unavailable — fall back to window listeners */
      }
      dragRef.current = { startX: e.clientX, startW: width };
      lastX.current = e.clientX;
      document.body.classList.add("chat-resizing");
    },
    [width],
  );

  const onResizeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !e.buttons) return;
      lastX.current = e.clientX;
      const dx = dragRef.current.startX - e.clientX;
      setWidthLive(dragRef.current.startW + dx);
    },
    [setWidthLive],
  );

  const endResize = useCallback(
    (commit: boolean) => {
      const d = dragRef.current;
      dragRef.current = null;
      document.body.classList.remove("chat-resizing");
      if (d && commit) setWidth(d.startW + (d.startX - lastX.current));
      else if (d) setWidthLive(d.startW);
    },
    [setWidth, setWidthLive],
  );

  const onResizeEnd = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        /* noop */
      }
      endResize(true);
    },
    [endResize],
  );

  const onResizeCancel = useCallback(() => {
    endResize(false);
  }, [endResize]);

  // Collapse button: shrink to 60% of the current width (never below min);
  // pressing again restores the pre-collapse width. Any manual drag resets it.
  const [collapsed, setCollapsed] = useState(false);
  const prevWidth = useRef<number | null>(null);
  const markUncollapsed = useCallback(() => {
    setCollapsed(false);
    prevWidth.current = null;
  }, []);
  const toggleCollapse = useCallback(() => {
    if (collapsed) {
      setCollapsed(false);
      if (prevWidth.current !== null) setWidth(prevWidth.current);
      prevWidth.current = null;
    } else {
      prevWidth.current = width;
      setCollapsed(true);
      setWidth(width * 0.6);
    }
  }, [collapsed, width, setWidth]);

  // Esc mid-drag cancels and restores the pre-drag width.
  const onResizeKey = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape" && dragRef.current) {
        e.preventDefault();
        e.stopPropagation();
        endResize(false);
        return;
      }
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      e.preventDefault();
      setWidth(width + (e.key === "ArrowLeft" ? 20 : -20));
    },
    [width, setWidth, endResize],
  );

  // Mobile sheet: drag handle with snap points (pointer capture, same as desktop).
  const onSheetDragStart = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    const panel = panelRef.current;
    if (!panel) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    sheetDragRef.current = {
      startY: e.clientY,
      startH: panel.getBoundingClientRect().height,
    };
    lastY.current = e.clientY;
  }, []);

  const onSheetDragMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const d = sheetDragRef.current;
    if (!d || !panelRef.current || !e.buttons) return;
    lastY.current = e.clientY;
    const next = Math.min(
      window.innerHeight * 0.92,
      Math.max(window.innerHeight * 0.35, d.startH + (d.startY - e.clientY)),
    );
    panelRef.current.style.setProperty("--chat-sheet-h", `${next}px`);
  }, []);

  const onSheetDragCancel = useCallback(() => {
    sheetDragRef.current = null;
  }, []);

  const onSheetDragEnd = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      /* noop */
    }
    const d = sheetDragRef.current;
    sheetDragRef.current = null;
    if (!d || !panelRef.current) return;
    const h = d.startH + (d.startY - lastY.current);
    const vh = window.innerHeight;
    if (h < vh * 0.45) setOpen(false);
    else {
      const snap = h > vh * 0.76 ? vh * 0.9 : vh * 0.6;
      panelRef.current.style.setProperty("--chat-sheet-h", `${snap}px`);
    }
  }, [setOpen]);

  // Keyboard avoidance: lift the sheet above the software keyboard.
  useEffect(() => {
    if (!open || !window.visualViewport) return;
    const vv = window.visualViewport;
    const onResize = () => {
      const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      panelRef.current?.style.setProperty("--chat-kb", `${overlap}px`);
    };
    vv.addEventListener("resize", onResize);
    onResize();
    return () => vv.removeEventListener("resize", onResize);
  }, [open ]);

  return (
    <>
      <div
        className={`chat-backdrop${open ? " is-open" : ""}`}
        aria-hidden="true"
        onClick={() => setOpen(false)}
      />
      <aside
        ref={panelRef as React.RefObject<HTMLElement>}
        className={`chat-panel${open ? " is-open" : ""}`}
        role="dialog"
        aria-modal="false"
        aria-label={t("chat.title")}
        aria-hidden={!open}
        data-testid="chat-panel"
      >
        <div
          className="chat-resize-handle"
          role="separator"
          tabIndex={0}
          aria-orientation="vertical"
          aria-label={t("chat.resize")}
          aria-valuemin={CHAT_PANEL_MIN_WIDTH}
          aria-valuemax={chatPanelMaxWidth()}
          aria-valuenow={Math.round(width)}
          onPointerDown={onResizeStart}
          onPointerMove={onResizeMove}
          onPointerUp={onResizeEnd}
          onPointerCancel={onResizeCancel}
          onKeyDown={onResizeKey}
        />
        <div
          className="chat-sheet-handle"
          aria-hidden="true"
          onPointerDown={onSheetDragStart}
          onPointerMove={onSheetDragMove}
          onPointerUp={onSheetDragEnd}
          onPointerCancel={onSheetDragCancel}
        >
          <span />
        </div>
        <header className="chat-panel-header">
          <span className="chat-panel-title">
            <MessageCircle size={16} aria-hidden="true" />
            {t("chat.title")}
          </span>
          <span className="chat-panel-actions">
            <button
              type="button"
              className="header-icon-button"
              onClick={toggleCollapse}
              aria-label={collapsed ? t("chat.expandPanel") : t("chat.collapsePanel")}
              title={collapsed ? t("chat.expandPanel") : t("chat.collapsePanel")}
              aria-pressed={collapsed}
              data-testid="chat-collapse"
            >
              {collapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
            </button>
            <button
              type="button"
              className="header-icon-button"
              onClick={openChatFullSite}
              aria-label={t("chat.expand")}
              title={t("chat.expand")}
              data-testid="chat-expand"
            >
              <ExternalLink size={16} />
            </button>
            <button
              type="button"
              className="header-icon-button"
              onClick={() => setOpen(false)}
              aria-label={t("chat.close")}
              data-testid="chat-close"
              data-chat-close=""
            >
              <X size={17} />
            </button>
          </span>
        </header>
        <div className="chat-panel-body">
          {mounted && (
            <iframe
              ref={iframeRef}
              src={embedSrc}
              title={t("chat.title")}
              allow="microphone; autoplay; clipboard-write"
              onLoad={syncTheme}
              data-testid="chat-iframe"
            />
          )}
        </div>
      </aside>
    </>
  );
}
