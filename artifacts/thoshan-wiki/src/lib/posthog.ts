import { detectLocale } from "../i18n/supportedLocales";

type PostHogClient = typeof import("posthog-js").default;
type EventProperties = Record<string, string | number | boolean | null | undefined>;

const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
const queuedEvents: Array<[string, EventProperties | undefined]> = [];
let client: PostHogClient | null = null;
let scheduled = false;

export function initPostHog() {
  if (scheduled || !key || typeof window === "undefined") return;
  scheduled = true;

  void import("posthog-js")
    .then(({ default: posthog }) => {
      posthog.init(key, {
        api_host: "https://eu.i.posthog.com",
        autocapture: true,
        capture_pageview: false,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
        cross_subdomain_cookie: true,
        session_recording: {
          recordCrossOriginIframes: false,
        },
      });
      client = posthog;
      for (const [event, properties] of queuedEvents) {
        client.capture(event, properties);
      }
      queuedEvents.length = 0;
    })
    .catch((error: unknown) => {
      scheduled = false;
      console.error("PostHog initialization failed:", error);
    });
}

export function capturePostHog(
  event: string,
  properties?: EventProperties,
) {
  if (!key) return;
  if (client) {
    client.capture(event, properties);
  } else {
    queuedEvents.push([event, properties]);
  }
}

/** Locale + host props attached to every $pageview for per-language breakdowns. */
export function pageviewProps() {
  const hostname =
    typeof window === "undefined" ? "" : window.location.hostname;
  const search = typeof window === "undefined" ? "" : window.location.search;
  return {
    locale: detectLocale(hostname, search),
    host: hostname,
  };
}
