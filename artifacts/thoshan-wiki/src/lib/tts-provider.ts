// Text-to-speech provider boundary (v10.10, Phase 0B).
//
// Why this exists: the reader currently calls Cloudflare Workers AI directly.
// This interface lets a future provider (or the built-in browser voice) plug
// in without touching playback state. Current wiring: Cloudflare first,
// browser speech synthesis as the offline/failure fallback.
export type TtsState =
  | "unavailable"
  | "loading"
  | "ready"
  | "playing"
  | "paused"
  | "failed"
  | "ended";

export interface TtsSpeakOptions {
  /** BCP-47 hint, e.g. "kn-IN" or "en-IN". Best effort — voices vary. */
  lang?: string;
  rate?: number;
  onend?: () => void;
  onerror?: () => void;
}

export interface TextToSpeechProvider {
  readonly id: string;
  isAvailable(): boolean;
  speak(text: string, opts?: TtsSpeakOptions): void;
  stop(): void;
}

function pickVoice(langHint?: string): SpeechSynthesisVoice | null {
  try {
    const voices = window.speechSynthesis.getVoices();
    if (!voices.length) return null;
    if (langHint) {
      const prefix = langHint.slice(0, 2).toLowerCase();
      const match = voices.find((v) =>
        v.lang.toLowerCase().startsWith(prefix),
      );
      if (match) return match;
    }
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith("en")) ?? voices[0]
    );
  } catch {
    return null;
  }
}

/** Built-in browser voice. No network, no credentials, no cost. */
export const browserSpeechProvider: TextToSpeechProvider = {
  id: "browser-speech",
  isAvailable() {
    try {
      return "speechSynthesis" in window;
    } catch {
      return false;
    }
  },
  speak(text, opts) {
    try {
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const voice = pickVoice(opts?.lang);
      if (voice) utter.voice = voice;
      if (opts?.lang) utter.lang = opts.lang;
      utter.rate = opts?.rate && Number.isFinite(opts.rate) ? opts.rate : 1;
      utter.onend = () => opts?.onend?.();
      utter.onerror = () => opts?.onerror?.();
      synth.speak(utter);
    } catch {
      opts?.onerror?.();
    }
  },
  stop() {
    try {
      window.speechSynthesis.cancel();
    } catch {
      /* no voice */
    }
  },
};
