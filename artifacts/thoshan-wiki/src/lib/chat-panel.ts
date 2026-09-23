/**
 * Chat panel helpers — the slide-over embeds the live chat app
 * (https://chat.lingadevaru.in?embed=1) in an iframe. One codebase:
 * chat features ship from the chat worker; this shell only toggles.
 */

export const CHAT_URL = "https://chat.lingadevaru.in";
export const CHAT_EMBED_URL = "https://chat.lingadevaru.in?embed=1";

/** Dispatched on window to toggle the panel from any trigger. */
export const TOGGLE_CHAT_EVENT = "thoshan:toggle-chat";

export function toggleChatPanel() {
  window.dispatchEvent(new CustomEvent(TOGGLE_CHAT_EVENT));
}

export function openChatFullSite() {
  window.open(CHAT_URL, "_blank", "noopener,noreferrer");
}

/** Storage keys for panel persistence across reloads. */
export const CHAT_OPEN_KEY = "wiki-chat-panel-open";
export const CHAT_WIDTH_KEY = "wiki-chat-panel-width";
export const CHAT_COLLAPSED_KEY = "wiki-chat-panel-collapsed";

export const CHAT_PANEL_DEFAULT_WIDTH = 440;
export const CHAT_PANEL_MIN_WIDTH = 320;
/** Panel may grow to 70% of the viewport (site squeezes to 30%). */
export function chatPanelMaxWidth(): number {
  if (typeof window === "undefined") return 640;
  return Math.max(CHAT_PANEL_MIN_WIDTH, Math.floor(window.innerWidth * 0.7));
}

export function clampPanelWidth(value: number) {
  if (Number.isNaN(value)) return CHAT_PANEL_DEFAULT_WIDTH;
  return Math.min(
    chatPanelMaxWidth(),
    Math.max(CHAT_PANEL_MIN_WIDTH, value),
  );
}
