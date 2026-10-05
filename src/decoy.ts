/**
 * Decoy single page — temporary front for lingadevaru.in + all locale hosts.
 *
 * Purpose: while DECOY_MODE=1, every public request gets this plain page
 * with HTTP 503 (temporary, keeps Google/Bing index intact) while humans
 * just see a simple personal index page. No maintenance wording, no
 * education, no projects, no FOSS/Linux mentions, no subdomain hints.
 *
 * Restore: set vars.DECOY_MODE to "0" in wrangler.jsonc + redeploy.
 * Indefinite: stays on until the owner says back. Nothing is deleted.
 */

/** Retry-After of 1 day: crawlers retry daily until we flip the flag back. */
export const DECOY_RETRY_AFTER_SECONDS = 86400;

export function isDecoyMode(env: { DECOY_MODE?: string }): boolean {
  return env.DECOY_MODE === "1";
}

/** Public PostHog project key — same publishable key as the main app
 * (`artifacts/thoshan-wiki/.env` VITE_POSTHOG_KEY). `phc_` keys are meant
 * for client-side use, so embedding here is consistent with the SPA bundle.
 * Session recording follows the PostHog project settings (enabled there). */
const DECOY_POSTHOG_KEY = "phc_zLBB9jDhiErdBuCymsmiU6YAz8A7VQKBBFTsWxpsCLsb";
const DECOY_POSTHOG_HOST = "https://eu.i.posthog.com";

/** Dark single-page HTML. Inline CSS only, <5KB, mobile-first (~360px). */
export function decoyHtml(): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Lingadevaru H P — Bengaluru</title>
<meta name="description" content="Lingadevaru H P — Bengaluru, Karnataka.">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#0a0e14;color:#eef1f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:24px}
.card{max-width:440px;width:100%;text-align:center;background:#131a26;border:1px solid #232c3d;border-radius:20px;padding:48px 30px}
.mark{width:64px;height:64px;margin:0 auto 22px;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#1c2536;border:1px solid #2d3a52;color:#7dd3fc;font-size:1.35rem;font-weight:700;letter-spacing:.02em}
h1{font-size:2.4rem;line-height:1.15;letter-spacing:-.02em;margin-bottom:14px}
.tag{color:#b8c0cf;font-size:1.1rem;line-height:1.6;margin-bottom:26px}
.mail{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:13px 24px;border:1px solid #2d3a52;border-radius:999px;background:#1c2536;color:#eef1f6;font-size:1.02rem;font-weight:600;text-decoration:none}
.addr{color:#8b94a7;font-size:1rem;margin-top:22px;letter-spacing:.04em}
</style>
</head>
<body>
<main class="card">
<div class="mark" aria-hidden="true">LH</div>
<h1>Lingadevaru H P</h1>
<p class="tag">I enjoy exploring interesting tech.</p>
<p><a class="mail" href="mailto:contact@lingadevaru.in">contact@lingadevaru.in</a></p>
<div class="addr">Bengaluru, Karnataka</div>
</main>
<script>
(function(){
  // Skip bots so analytics count real visitors only.
  var ua = (navigator.userAgent || "").toLowerCase();
  if (/bot|crawl|spider|slurp|mediapartners|baidu|yandex|sogou|ia_archiver|gptbot|claudebot|perplexity/.test(ua)) return;
  var t = document.createElement("script");
  t.src = "${DECOY_POSTHOG_HOST}/static/array.js";
  t.async = true;
  t.onload = function(){
    try {
      posthog.init("${DECOY_POSTHOG_KEY}", {
        api_host: "${DECOY_POSTHOG_HOST}",
        autocapture: true,
        capture_pageview: true,
        capture_pageleave: true,
        persistence: "localStorage+cookie",
        cross_subdomain_cookie: true
      });
      // Tag decoy traffic so it never mixes with portfolio stats.
      posthog.capture("$pageview", { page: "decoy", host: location.hostname });
    } catch (e) {}
  };
  document.head.appendChild(t);
})();
</script>
</body>
</html>`;
}

/**
 * 503 decoy response. Looks like a normal page to humans; signals
 * "temporary downtime, keep index" to search engines. Always lang="en"
 * so locale subdomains never leak their existence.
 */
export function decoyResponse(): Response {
  return new Response(decoyHtml(), {
    status: 503,
    statusText: "Service Unavailable",
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      "Pragma": "no-cache",
      "Retry-After": String(DECOY_RETRY_AFTER_SECONDS),
      "Content-Language": "en",
      "X-Robots-Tag": "noarchive, nosnippet, noimageindex",
    },
  });
}
