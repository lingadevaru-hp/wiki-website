/**
 * Chat panel helpers — the slide-over embeds the live chat app
 * (https://ai.lingadevaru.in?embed=1) in an iframe. One codebase:
 * chat features ship from the chat worker; this shell only toggles.
 */

export const CHAT_URL = "https://ai.lingadevaru.in";
export const CHAT_EMBED_URL = "https://ai.lingadevaru.in?embed=1";

/** Dispatched on window to toggle the panel from any trigger. */
export const TOGGLE_CHAT_EVENT = "thoshan:toggle-chat";

export function toggleChatPanel() {
  window.dispatchEvent(new CustomEvent(TOGGLE_CHAT_EVENT));
}

/* ── One-click "Open full site", with the conversation handed over ──
   Browsers partition a cross-site iframe's localStorage per parent
   origin (Chrome 115+/Safari/Firefox), so the panel's chats live in a
   jar the top-level full site can NEVER read. Instead of hoping they
   share storage, we ask the framed app for its history over
   postMessage, then open the full site with the payload in a
   #thoshan-import= hash — the app imports it on boot and strips the
   hash (so a refresh never replays it). Best-effort: if the frame is
   absent or never answers, we still open the full site, just plain. */
const CHAT_HISTORY_TIMEOUT_MS = 350;

export async function openChatFullSite(): Promise<void> {
  const chats = await requestChatHistory();
  const url = chats?.length
    ? `${CHAT_URL}#thoshan-import=${encodeURIComponent(JSON.stringify({ v: 2, chats }))}`
    : CHAT_URL;
  window.open(url, "_blank", "noopener,noreferrer");
}

/** The framed app answers { v: 2, chats: Chat[] } — echo-checked so only
 *  OUR iframe (source + origin match) can inject a payload. */
function requestChatHistory(): Promise<unknown[] | null> {
  return new Promise((resolve) => {
    const frame = document.querySelector<HTMLIFrameElement>(
      'iframe[data-testid="chat-iframe"]',
    );
    const inner = frame?.contentWindow;
    if (!frame || !inner) { resolve(null); return; }

    const onMessage = (e: MessageEvent) => {
      if (e.source !== inner || e.origin !== CHAT_URL) return;
      const data = e.data as { type?: string; payload?: { chats?: unknown[] } };
      if (data?.type !== "thoshan-history-result") return;
      done(Array.isArray(data.payload?.chats) ? data.payload.chats : null);
    };
    let settled = false;
    const done = (result: unknown[] | null) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      window.removeEventListener("message", onMessage);
      resolve(result);
    };
    const timer = window.setTimeout(() => done(null), CHAT_HISTORY_TIMEOUT_MS);
    window.addEventListener("message", onMessage);
    try {
      inner.postMessage({ type: "thoshan-history-request" }, CHAT_URL);
    } catch {
      done(null);
    }
  });
}

/** Storage keys for panel persistence across reloads. */
export const CHAT_OPEN_KEY = "wiki-chat-panel-open";
export const CHAT_WIDTH_KEY = "wiki-chat-panel-width";
export const CHAT_COLLAPSED_KEY = "wiki-chat-panel-collapsed";

export const CHAT_PANEL_DEFAULT_WIDTH = 560;
export const CHAT_PANEL_MIN_WIDTH = 320;
/** Panel may grow to 70% of the viewport (site squeezes to 30%). */
export function chatPanelMaxWidth(): number {
  if (typeof window === "undefined") return 800;
  return Math.max(CHAT_PANEL_MIN_WIDTH, Math.floor(window.innerWidth * 0.7));
}

export function clampPanelWidth(value: number) {
  if (Number.isNaN(value)) return CHAT_PANEL_DEFAULT_WIDTH;
  return Math.min(
    chatPanelMaxWidth(),
    Math.max(CHAT_PANEL_MIN_WIDTH, value),
  );
}
