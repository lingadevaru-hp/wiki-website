import { useCallback, useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ExternalLink,
  RotateCcw,
  X,
} from "lucide-react";
import { useChatPanel } from "../contexts/ChatPanelContext";
import { useLocale } from "../contexts/LocaleContext";
import { ThoshanWordmark } from "./Brand";
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
  const { open, setOpen, width, setWidth, setWidthLive, collapsed, toggleCollapse, markUncollapsed, mounted, iframeRef, syncTheme } =
    useChatPanel();
  const panelRef = useRef<HTMLElement | null>(null);
  const invokerRef = useRef<HTMLElement | null>(null);
  const dragRef = useRef<{ startX: number; startW: number; moved: boolean } | null>(null);
  const lastX = useRef(0);
  const lastY = useRef(0);
  // Screen-reader announcements for state sighted users see.
  const [notice, setNotice] = useState("");
  const announce = useCallback((message: string) => {
    setNotice("");
    window.setTimeout(() => setNotice(message), 30);
  }, []);
  useEffect(() => {
    announce(open ? t("chat.opened") : t("chat.closed"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open ]);
  const announceCollapse = useCallback((isCollapsed: boolean) => {
    announce(isCollapsed ? t("chat.collapsePanel") : t("chat.expandPanel"));
  }, [announce, t]);
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
  // A press without movement (<4px) is a click: toggles 60% collapse.
  const onResizeStart = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      markUncollapsed();
      const handle = e.currentTarget;
      try {
        handle.setPointerCapture(e.pointerId);
      } catch {
        /* capture unavailable */
      }
      dragRef.current = { startX: e.clientX, startW: width, moved: false };
      lastX.current = e.clientX;
      document.body.classList.add("chat-resizing");
    },
    [width, markUncollapsed],
  );

  const onResizeMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!dragRef.current || !e.buttons) return;
      lastX.current = e.clientX;
      const dx = dragRef.current.startX - e.clientX;
      if (Math.abs(dx) > 4) dragRef.current.moved = true;
      setWidthLive(dragRef.current.startW + dx);
    },
    [setWidthLive],
  );

  const endResize = useCallback(
    (commit: boolean) => {
      const d = dragRef.current;
      dragRef.current = null;
      document.body.classList.remove("chat-resizing");
      if (!d) return;
      if (!d.moved) {
        // Click rail (shadcn pattern): toggle collapse, keep width.
        setWidthLive(d.startW);
        toggleCollapse();
        announceCollapse(!collapsedRef.current);
        return;
      }
      if (commit) setWidth(d.startW + (d.startX - lastX.current));
      else setWidthLive(d.startW);
    },
    [setWidth, setWidthLive, toggleCollapse, announceCollapse],
  );

  const collapsedRef = useRef(collapsed);
  useEffect(() => {
    collapsedRef.current = collapsed;
  }, [collapsed]);

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
      markUncollapsed();
      setWidth(width + (e.key === "ArrowLeft" ? 20 : -20));
    },
    [width, setWidth, endResize, markUncollapsed],
  );

  // Mobile sheet: drag handle with snap points (pointer capture, same as desktop).
  const onSheetDragStart = useCallback((e: React.PointerEvent<HTMLElement>) => {
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

  const onSheetDragMove = useCallback((e: React.PointerEvent<HTMLElement>) => {
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

  const onSheetDragEnd = useCallback((e: React.PointerEvent<HTMLElement>) => {
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
    if (h < vh * 0.45) {
      setOpen(false);
    } else {
      const tall = h > vh * 0.76;
      const snap = tall ? vh * 0.9 : vh * 0.6;
      panelRef.current.style.setProperty("--chat-sheet-h", `${snap}px`);
      announce(tall ? t("chat.sheetTall") : t("chat.sheetHalf"));
    }
  }, [setOpen, announce, t]);

  // Tap the sheet handle (M3): cycle 60% ↔ 90% without dragging.
  const onSheetHandleTap = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const vh = window.innerHeight;
    const cur = panel.getBoundingClientRect().height;
    const tall = cur < vh * 0.75;
    panel.style.setProperty("--chat-sheet-h", `${tall ? vh * 0.9 : vh * 0.6}px`);
    announce(tall ? t("chat.sheetTall") : t("chat.sheetHalf"));
  }, [announce, t]);

  // Iframe first paint: skeleton shimmer behind the frame until loaded.
  const [frameReady, setFrameReady] = useState(false);
  const [frameFailed, setFrameFailed] = useState(false);
  const [frameKey, setFrameKey] = useState(0);
  const onFrameLoad = useCallback(() => {
    setFrameReady(true);
    setFrameFailed(false);
    syncTheme();
  }, [syncTheme]);
  useEffect(() => {
    if (!mounted || frameReady) return;
    const timer = window.setTimeout(() => {
      if (!frameReady) setFrameFailed(true);
    }, 12000);
    return () => window.clearTimeout(timer);
  }, [mounted, frameReady]);
  const retryFrame = useCallback(() => {
    setFrameFailed(false);
    setFrameReady(false);
    setFrameKey((k) => k + 1);
  }, []);

  // Pixel wordmark — same /brand/thoshan-wordmark.svg asset as the hero,
  // rendered via the shared ThoshanWordmark component (theme-aware).

  // Haptic-style tick (guarded; no-op where unsupported).
  const tick = useCallback((ms = 8) => {
    try {
      navigator.vibrate?.(ms);
    } catch {
      /* noop */
    }
  }, []);

  // Mobile detent model: 90% ↔ 60% ↔ peek strip.
  const peekHeight = useCallback(() => {
    const vh = window.innerHeight;
    return Math.max(150, Math.round(vh * 0.18));
  }, []);
  const setSheetHeight = useCallback((h: number) => {
    panelRef.current?.style.setProperty("--chat-sheet-h", `${Math.round(h)}px`);
  }, []);
  const toggleDetent = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const vh = window.innerHeight;
    const cur = panel.getBoundingClientRect().height;
    const next = cur > vh * 0.75 ? vh * 0.6 : vh * 0.9;
    setSheetHeight(next);
    tick();
    announce(next > vh * 0.75 ? t("chat.sheetTall") : t("chat.sheetHalf"));
  }, [setSheetHeight, tick, announce, t]);
  const cycleDetentTap = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const vh = window.innerHeight;
    const cur = panel.getBoundingClientRect().height;
    let next: number;
    let label: string;
    if (cur > vh * 0.75) {
      next = vh * 0.6;
      label = t("chat.sheetHalf");
    } else if (cur > peekHeight() + 40) {
      next = peekHeight();
      label = t("chat.sheetPeek");
    } else {
      next = vh * 0.9;
      label = t("chat.sheetTall");
    }
    setSheetHeight(next);
    tick();
    announce(label);
  }, [peekHeight, setSheetHeight, tick, announce, t]);

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

  // Body scroll lock while the mobile sheet is open (restore on close).
  useEffect(() => {
    if (!open || !window.matchMedia("(max-width: 900px)").matches) return;
    const y = window.scrollY;
    const body = document.body;
    const prev = { position: body.style.position, top: body.style.top, width: body.style.width };
    body.style.position = "fixed";
    body.style.top = `-${y}px`;
    body.style.width = "100%";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.width = prev.width;
      window.scrollTo(0, y);
    };
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
        <button
          type="button"
          className="chat-sheet-handle"
          aria-label={t("chat.sheetToggle")}
          onPointerDown={onSheetDragStart}
          onPointerMove={onSheetDragMove}
          onPointerUp={onSheetDragEnd}
          onPointerCancel={onSheetDragCancel}
          onClick={onSheetHandleTap}
        >
          <span aria-hidden="true" />
        </button>
        <header className="chat-panel-header">
          <span
            className="chat-wordmark"
            role="img"
            aria-label={t("chat.title")}
            title={t("chat.title")}
            data-testid="chat-wordmark"
          >
            <ThoshanWordmark className="chat-wordmark-logo" />
          </span>
          <span className="chat-panel-actions">
            <button
              type="button"
              className="header-icon-button chat-collapse-btn"
              onClick={() => {
                toggleCollapse();
                tick();
                announceCollapse(!collapsed);
              }}
              aria-label={collapsed ? t("chat.expandPanel") : t("chat.collapsePanel")}
              title={collapsed ? t("chat.expandPanel") : t("chat.collapsePanel")}
              aria-pressed={collapsed}
              data-testid="chat-collapse"
            >
              {collapsed ? <ChevronsLeft size={16} /> : <ChevronsRight size={16} />}
            </button>
            <button
              type="button"
              className="header-icon-button chat-detent-btn"
              onClick={toggleDetent}
              aria-label={t("chat.sheetToggle")}
              title={t("chat.sheetToggle")}
              data-testid="chat-detent"
            >
              <span className="chat-detent-icons" aria-hidden="true">
                <ChevronUp size={15} />
                <ChevronDown size={15} />
              </span>
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
          {mounted && !frameReady && !frameFailed && (
            <div className="chat-frame-skeleton" aria-hidden="true">
              <span className="chat-frame-skeleton-bar" style={{ width: "42%" }} />
              <span className="chat-frame-skeleton-input" />
              <span className="chat-frame-skeleton-row" style={{ width: "78%" }} />
              <span className="chat-frame-skeleton-row" style={{ width: "62%" }} />
              <span className="chat-frame-skeleton-row" style={{ width: "70%" }} />
            </div>
          )}
          {mounted && frameFailed && !frameReady && (
            <div className="chat-frame-error" role="alert">
              <p>{t("chat.loadFailed")}</p>
              <div>
                <button type="button" onClick={retryFrame}>
                  <RotateCcw size={15} aria-hidden="true" />
                  {t("chat.retry")}
                </button>
                <button type="button" onClick={openChatFullSite}>
                  <ExternalLink size={15} aria-hidden="true" />
                  {t("chat.expand")}
                </button>
              </div>
            </div>
          )}
          {mounted && (
            <iframe
              key={frameKey}
              ref={iframeRef}
              src={embedSrc}
              title={t("chat.title")}
              allow="microphone; autoplay; clipboard-write"
              onLoad={onFrameLoad}
              data-testid="chat-iframe"
              className={frameReady ? "is-ready" : ""}
            />
          )}
        </div>
        <span className="sr-only" role="status" aria-live="polite">
          {notice}
        </span>
      </aside>
    </>
  );
}
