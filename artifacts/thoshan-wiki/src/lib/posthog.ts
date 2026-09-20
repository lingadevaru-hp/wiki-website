import posthog from "posthog-js";
import { detectLocale } from "../i18n/supportedLocales";

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  const key = import.meta.env.VITE_POSTHOG_KEY as string | undefined;
  if (!key) return; // analytics disabled without key
  posthog.init(key, {
    api_host: "https://eu.i.posthog.com",
    autocapture: true,
    capture_pageview: false, // manual SPA pageviews (see Router in App.tsx)
    capture_pageleave: true,
    persistence: "localStorage+cookie",
    // Share the cookie across *.lingadevaru.in so a visitor moving
    // between language subdomains keeps one identity/session.
    cross_subdomain_cookie: true,
    session_recording: {
      recordCrossOriginIframes: false,
    },
  });
  initialized = true;
}

export { posthog };

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
