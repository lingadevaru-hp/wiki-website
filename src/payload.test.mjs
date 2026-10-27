import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";

/**
 * Regression cover for the landing page's critical path.
 *
 * Mobile Lighthouse reported a 10+ MB initial payload, an eagerly fetched
 * featured video, theme previews loaded before the picker opened, and CSP
 * violations from inline font load handlers. These assertions protect the
 * homepage's critical path and the related accessibility/SEO guarantees.
 */

const root = new URL("../artifacts/thoshan-wiki/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const landing = readFileSync(new URL("src/pages/LandingPage.tsx", root), "utf8");
const app = readFileSync(new URL("src/App.tsx", root), "utf8");
const themePicker = readFileSync(
  new URL("src/components/ThemePicker.tsx", root),
  "utf8",
);
const heroShader = readFileSync(
  new URL("src/components/HeroShader.tsx", root),
  "utf8",
);
const posthog = readFileSync(new URL("src/lib/posthog.ts", root), "utf8");
const poster = new URL("public/assets/foss-coin-poster.webp", root);

/** The no-JS fallbacks legitimately use rel="stylesheet". */
const noscriptRanges = [...html.matchAll(/<noscript\b[\s\S]*?<\/noscript>/gi)]
  .map((match) => [match.index, match.index + match[0].length]);
const insideNoscript = (index) =>
  noscriptRanges.some(([start, end]) => index >= start && index < end);
const htmlWithoutNoscript = html
  .split("")
  .map((char, index) => (insideNoscript(index) ? "" : char))
  .join("");

test("the homepage capture stays a lazy image instead of fetching the 8.8 MB video", () => {
  assert.doesNotMatch(landing, /foss-coin-loop\.mp4/);
  assert.doesNotMatch(landing, /<video\b/);
  assert.match(
    landing,
    /<img[\s\S]*?src="\/assets\/foss-coin-poster\.webp"[\s\S]*?loading="lazy"/,
  );
});

test("the homepage does not preload below-the-fold media", () => {
  assert.doesNotMatch(htmlWithoutNoscript, /foss-coin-poster/);
  assert.ok(statSync(poster).size < 50_000, "poster should stay under 50 KB");
  assert.match(
    htmlWithoutNoscript,
    /<link rel="preload" as="image" href="\/brand\/thoshan-wordmark\.svg" fetchpriority="high"/,
  );
});

test("font stylesheets activate without CSP-blocked inline handlers", () => {
  const fontLinks = [...html.matchAll(/<link[^>]*css2\?[^>]*>/g)]
    .filter((match) => !insideNoscript(match.index))
    .map((match) => match[0]);

  assert.equal(fontLinks.length, 2);

  for (const link of fontLinks) {
    assert.doesNotMatch(link, /rel="stylesheet"/, link);
    assert.match(link, /rel="preload"/, link);
    assert.match(link, /as="style"/, link);
    assert.match(link, /data-font-stylesheet/, link);
  }

  assert.doesNotMatch(html, /\bonload=/i);
  assert.match(html, /addEventListener\('load'/);
  assert.doesNotMatch(html, /Caveat/);
  assert.match(landing, /IntersectionObserver/);
  assert.match(landing, /dataset\.lazyFont = "caveat"/);
  // The no-JS path still has to get styled fonts.
  assert.match(html, /<noscript>[\s\S]*fonts\.googleapis\.com[\s\S]*<\/noscript>/);
});

test("theme previews are warmed only when the picker is opened", () => {
  assert.match(themePicker, /if \(open\) warmAround\(index\)/);
  assert.doesNotMatch(themePicker, /requestIdleCallback/);
});

test("mobile and reduced-motion users skip the animated pixel field", () => {
  assert.match(heroShader, /prefers-reduced-motion: reduce/);
  assert.match(heroShader, /skipOnSmallScreens && window\.matchMedia\('\(max-width: 720px\)'\)/);
  assert.match(heroShader, /usePixelField\(true\)/);
});

test("non-landing routes load on demand", () => {
  assert.match(app, /lazy\(\(\) => import\("\.\/pages\/ArticlePage"\)\)/);
  assert.match(app, /<Suspense fallback=\{null\}>/);
  assert.doesNotMatch(app, /import ArticlePage from/);
});

test("analytics libraries load only after user interaction", () => {
  assert.doesNotMatch(posthog, /^import posthog from/m);
  assert.match(posthog, /import\("posthog-js"\)/);
  assert.match(posthog, /addEventListener\("pointerdown", loadAfterInteraction/);
  assert.match(posthog, /addEventListener\("keydown", loadAfterInteraction/);
  assert.doesNotMatch(html, /clarity\.ms\/tag/);
});

test("the theme wordmark mask is preloaded for LCP discovery", () => {
  assert.match(
    htmlWithoutNoscript,
    /href="\/brand\/thoshan-wordmark\.svg" fetchpriority="high"/,
  );
  assert.doesNotMatch(html, /preconnect[^>]+picsum\.photos/);
});

test("SEO and crawler guarantees survive the performance work", () => {
  // The earlier fixes must not regress while tuning the critical path.
  assert.match(html, /<link rel="canonical" href="https:\/\/lingadevaru\.in\/" \/>/);
  assert.match(html, /<link rel="alternate" hreflang="kn"/);
  assert.match(html, /<meta name="robots" content="index, follow/);
});
