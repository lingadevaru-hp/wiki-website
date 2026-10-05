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

/** Dark resume-style single page. Inline CSS only, <6KB, mobile-first (~360px).
 * Content from owner resume 05-10-2026 MINUS: phone, education/years,
 * chatbot project, date of birth. No outbound links except mailto. */
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
body{min-height:100dvh;display:flex;align-items:center;justify-content:center;background:#0a0e14;color:#eef1f6;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;padding:20px}
.card{max-width:560px;width:100%;background:#131a26;border:1px solid #232c3d;border-radius:20px;padding:40px 28px}
.top{display:flex;align-items:center;gap:16px;margin-bottom:8px}
.mark{width:56px;height:56px;flex:none;display:flex;align-items:center;justify-content:center;border-radius:50%;background:#1c2536;border:1px solid #2d3a52;color:#7dd3fc;font-size:1.2rem;font-weight:700}
h1{font-size:1.9rem;line-height:1.2;letter-spacing:-.01em}
.objective{color:#b8c0cf;font-size:1.05rem;line-height:1.65;margin:14px 0 20px}
.contact{display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-bottom:26px}
.mail{display:inline-flex;align-items:center;justify-content:center;min-height:48px;padding:12px 22px;border:1px solid #2d3a52;border-radius:999px;background:#1c2536;color:#eef1f6;font-size:1rem;font-weight:600;text-decoration:none}
.addr{color:#8b94a7;font-size:.98rem}
h2{font-size:.82rem;letter-spacing:.12em;text-transform:uppercase;color:#7dd3fc;margin:22px 0 10px}
ul{list-style:none}
ul li{color:#d5dae3;font-size:1.02rem;line-height:1.7;padding-left:18px;position:relative}
ul li::before{content:"▸";position:absolute;left:0;color:#7dd3fc}
.chips{display:flex;flex-wrap:wrap;gap:8px}
.chips span{border:1px solid #2d3a52;background:#1c2536;border-radius:999px;padding:8px 14px;font-size:.95rem;color:#d5dae3}
.lang{display:flex;justify-content:space-between;gap:12px;padding:7px 0;border-bottom:1px solid #1c2536;font-size:1.02rem}
.lang:last-child{border-bottom:none}
.lang b{color:#eef1f6;font-weight:600}
.lang span{color:#8b94a7}
</style>
</head>
<body>
<main class="card">
<div class="top">
<div class="mark" aria-hidden="true">LH</div>
<h1>Lingadevaru H P</h1>
</div>
<p class="objective">Motivated and hardworking fresher seeking an opportunity to work in a challenging organization where I can apply my skills and knowledge for the growth of the organization.</p>
<div class="contact">
<a class="mail" href="mailto:contact@lingadevaru.in">contact@lingadevaru.in</a>
<span class="addr">Bengaluru, Karnataka, India</span>
</div>
<h2>Technical Skills</h2>
<div class="chips"><span>Python</span><span>GitHub</span><span>Docker</span><span>Cloudflare D1</span></div>
<h2>Soft Skills</h2>
<ul><li>Teamwork and Collaboration</li><li>Leadership</li><li>Time Management</li><li>Problem Solving</li><li>Critical Thinking</li></ul>
<h2>Languages</h2>
<div><div class="lang"><b>Kannada</b><span>Native</span></div><div class="lang"><b>English</b><span>Professional</span></div></div>
<h2>Hobbies</h2>
<ul><li>Yoga</li><li>Listening to Music</li></ul>
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
