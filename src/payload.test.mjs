import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

/**
 * Regression cover for the landing page's critical path.
 *
 * Mobile Lighthouse scored 60 (FCP 4.2 s, LCP 7.2 s, Speed Index 7.6 s on an
 * emulated Moto G Power at Slow 4G). Two things caused it: the ~8.8 MB
 * featured-project loop was fetched during page load, and three third-party
 * font stylesheets blocked the first paint. These assertions keep both fixed.
 */

const root = new URL("../artifacts/thoshan-wiki/", import.meta.url);
const html = readFileSync(new URL("index.html", root), "utf8");
const landing = readFileSync(new URL("src/pages/LandingPage.tsx", root), "utf8");

/** The no-JS fallbacks legitimately use rel="stylesheet". */
const noscriptRanges = [...html.matchAll(/<noscript\b[\s\S]*?<\/noscript>/gi)]
  .map((match) => [match.index, match.index + match[0].length]);
const insideNoscript = (index) =>
  noscriptRanges.some(([start, end]) => index >= start && index < end);
const htmlWithoutNoscript = html
  .split("")
  .map((char, index) => (insideNoscript(index) ? "" : char))
  .join("");

test("the featured loop is not fetched during page load", () => {
  // A preload makes the browser pull the whole file while the page is loading.
  assert.doesNotMatch(htmlWithoutNoscript, /rel="preload"[^>]*as="video"/i);
  assert.doesNotMatch(htmlWithoutNoscript, /foss-coin-loop\.mp4/);
});

test("the featured <video> defers its source instead of eagerly loading", () => {
  const video = landing.match(/<video[^>]*>/)?.[0];
  assert.ok(video, "featured <video> element not found in LandingPage.tsx");

  assert.doesNotMatch(video, /preload="auto"/);
  assert.match(video, /preload="none"/);
  // An inline src attribute starts the download on mount, which is what
  // preload="none" is meant to prevent — the source must be deferred.
  assert.doesNotMatch(video, /src="\/assets\/foss-coin-loop\.mp4"/);
  assert.match(video, /poster="\/assets\/foss-coin-poster\.jpg"/);

  // ...and the deferred source has to actually be attached somewhere.
  assert.match(landing, /setCaptureSrc\("\/assets\/foss-coin-loop\.mp4"\)/);
});

test("the poster stays the high-priority LCP image", () => {
  const poster = htmlWithoutNoscript.match(
    /<link[^>]*foss-coin-poster\.jpg[^>]*>/,
  )?.[0];
  assert.ok(poster, "poster preload missing");
  assert.match(poster, /as="image"/);
  assert.match(poster, /fetchpriority="high"/);
});

test("third-party font stylesheets do not block first paint", () => {
  const fontLinks = [...html.matchAll(/<link[^>]*css2\?[^>]*>/g)]
    .filter((match) => !insideNoscript(match.index))
    .map((match) => match[0]);

  assert.ok(fontLinks.length >= 3, `expected >=3 font links, got ${fontLinks.length}`);

  for (const link of fontLinks) {
    assert.doesNotMatch(link, /rel="stylesheet"/, link);
    assert.match(link, /rel="preload"/, link);
    assert.match(link, /as="style"/, link);
    assert.match(link, /onload=/, link);
  }

  // The no-JS path still has to get styled fonts.
  assert.match(html, /<noscript>[\s\S]*fonts\.googleapis\.com[\s\S]*<\/noscript>/);
});

test("SEO and crawler guarantees survive the performance work", () => {
  // The earlier fixes must not regress while tuning the critical path.
  assert.match(html, /<link rel="canonical" href="https:\/\/lingadevaru\.in\/" \/>/);
  assert.match(html, /<link rel="alternate" hreflang="kn"/);
  assert.match(html, /<meta name="robots" content="index, follow/);
});
