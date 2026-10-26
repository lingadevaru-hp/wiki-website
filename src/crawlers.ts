/**
 * Crawler classification for the Turnstile gate.
 *
 * The gate is a `noindex, nofollow` interstitial. Anything that has to read
 * the real document must therefore skip it — search engines, the AI answer
 * engines `robots.txt` allows so pages stay citable, link unfurlers, and
 * Lighthouse/PageSpeed Insights.
 *
 * Order matters. Training crawlers are matched before search crawlers so that
 * `Applebot-Extended` (training, disallowed) is not mistaken for `Applebot`
 * (search, allowed) — `applebot-extended` contains the substring `applebot`.
 *
 * These are pure string predicates: no Worker runtime, no bindings, so they
 * unit-test directly with `node --test`.
 */

/**
 * AI training crawlers that `robots.txt` disallows. They are refused outright
 * rather than served the document.
 */
const AI_TRAINING_BOT =
  /gptbot|chatgpt-user|claudebot|claude-ai|anthropic|perplexitybot|bytespider|ccbot|applebot-extended|meta-externalagent|facebookbot|omgili|semrushbot|ahrefsbot|dotbot|yandexbot|dataforseo|petalbot|seekportbot|zoominfobot|bytedance|googleother|youbot|diffbot|cohere-ai|ai2bot|pangubot|perplexity-user|imagesiftbot|archive\.org_bot|ia_archiver|wayback|qwen|baiduspider|sogou|timpibot|panscient|mj12bot|seznam|piplbot|webzio|google-extended|amazonbot/i;

/**
 * AI answer engines that `robots.txt` explicitly allows (`Allow: /`) so pages
 * stay citable. Refusing them would contradict the published robots policy —
 * see the `OAI-SearchBot` and `DuckAssistBot` blocks in `robots.txt`.
 */
const AI_SEARCH_BOT = /oai-searchbot|duckassistbot/i;

/** Classic search engine crawlers. */
const SEARCH_BOT = /googlebot|bingbot|duckduckbot|bravesearchbot|slurp|applebot/i;

/** Link unfurlers — they only read Open Graph metadata. */
const SOCIAL_BOT =
  /facebookexternalhit|twitterbot|linkedinbot|discordbot|telegrambot|whatsapp|slackbot/i;

/**
 * Lighthouse and PageSpeed Insights.
 *
 * PageSpeed Insights still appends `Chrome-Lighthouse` to its user agent, so a
 * run against the gated site currently renders the noindex interstitial and
 * fails the "Page is blocked from indexing" audit. This only affects
 * measurement: newsletter writes stay behind the signed verification cookie
 * and `/api/newsletter/*` re-checks it server-side, so serving HTML here
 * grants no access to protected endpoints.
 */
const LIGHTHOUSE_BOT = /chrome-lighthouse|pagespeed/i;

/** What the gate should do with a request. */
export type CrawlerVerdict =
  /** Refuse the request outright. */
  | "block"
  /** Serve the real static asset without the gate. */
  | "serve"
  /** Show the Turnstile interstitial. */
  | "gate";

/**
 * Decide how to treat a request based on its user agent.
 *
 * The caller still applies its own `Accept` check afterwards, so a non-document
 * request for an unknown agent is served as an asset rather than gated.
 */
export function classifyCrawler(userAgent: string): CrawlerVerdict {
  if (AI_TRAINING_BOT.test(userAgent)) return "block";
  if (AI_SEARCH_BOT.test(userAgent)) return "serve";
  if (SEARCH_BOT.test(userAgent)) return "serve";
  if (SOCIAL_BOT.test(userAgent)) return "serve";
  if (LIGHTHOUSE_BOT.test(userAgent)) return "serve";
  return "gate";
}
