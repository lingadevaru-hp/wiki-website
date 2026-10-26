import assert from "node:assert/strict";
import { test } from "node:test";
import { classifyCrawler } from "./crawlers.ts";

/**
 * Regression cover for the Turnstile gate's crawler policy.
 *
 * The gate is a `noindex, nofollow` interstitial, so anything classified as
 * "gate" is what Lighthouse and search engines end up scoring. These tests pin
 * the classification that the "Page is blocked from indexing" audit depends on.
 */

const CHROME =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36";

test("PageSpeed Insights is served the document, not the noindex gate", () => {
  // PageSpeed Insights still appends `Chrome-Lighthouse` to its user agent.
  const psiMobile =
    "Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Mobile Safari/537.36 Chrome-Lighthouse";
  const psiDesktop =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Safari/537.36 Chrome-Lighthouse";

  assert.equal(classifyCrawler(psiMobile), "serve");
  assert.equal(classifyCrawler(psiDesktop), "serve");
});

test("AI answer engines allowed by robots.txt are served, not refused", () => {
  // robots.txt carries `User-agent: OAI-SearchBot / Allow: /` and the same for
  // DuckAssistBot so pages stay citable. A 403 here would contradict it.
  assert.equal(
    classifyCrawler("Mozilla/5.0 (compatible; OAI-SearchBot/1.0)"),
    "serve",
  );
  assert.equal(
    classifyCrawler("Mozilla/5.0 (compatible; DuckAssistBot/1.0)"),
    "serve",
  );
});

test("search engines and link unfurlers are served the document", () => {
  assert.equal(
    classifyCrawler(
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
    ),
    "serve",
  );
  assert.equal(
    classifyCrawler(
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
    ),
    "serve",
  );
  assert.equal(
    classifyCrawler("Mozilla/5.0 (compatible; Applebot/0.1)"),
    "serve",
  );
  assert.equal(
    classifyCrawler("facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"),
    "serve",
  );
});

test("AI training crawlers stay refused", () => {
  for (const ua of [
    "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.1; +https://openai.com/gptbot",
    "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
    "Mozilla/5.0 (compatible; CCBot/2.0; https://commoncrawl.org/faq/)",
    "Mozilla/5.0 (compatible; Amazonbot/0.1; +https://developer.amazon.com/support/amazonbot)",
  ]) {
    assert.equal(classifyCrawler(ua), "block", ua);
  }
});

test("Applebot-Extended is blocked rather than read as Applebot", () => {
  // `applebot-extended` contains the substring `applebot`; order of checks is
  // what keeps the training bot out while the search bot gets the document.
  assert.equal(
    classifyCrawler("Mozilla/5.0 (compatible; Applebot-Extended/0.1)"),
    "block",
  );
});

test("ordinary browsers still get the gate", () => {
  assert.equal(classifyCrawler(CHROME), "gate");
  assert.equal(classifyCrawler(""), "gate");
  assert.equal(
    classifyCrawler(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
    ),
    "gate",
  );
});

test("the gate keeps its noindex directive", async () => {
  // The interstitial must stay out of the index; only the bypass above keeps
  // crawlers from ever receiving it. Guard against a future edit dropping it.
  const { readFileSync } = await import("node:fs");
  const worker = readFileSync(new URL("./worker.ts", import.meta.url), "utf8");
  assert.match(worker, /<meta name="robots" content="noindex, nofollow">/);
});
