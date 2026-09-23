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

export const CHAT_PANEL_DEFAULT_WIDTH = 400;
export const CHAT_PANEL_MIN_WIDTH = 320;
export const CHAT_PANEL_MAX_WIDTH = 640;

export function clampPanelWidth(value: number) {
  if (Number.isNaN(value)) return CHAT_PANEL_DEFAULT_WIDTH;
  return Math.min(
    CHAT_PANEL_MAX_WIDTH,
    Math.max(CHAT_PANEL_MIN_WIDTH, value),
  );
}
