# SEO and Agentic Discovery

How the two failing PageSpeed Insights categories were diagnosed and fixed, and
how to verify the fixes without deploying.

## Reported symptoms

A PageSpeed Insights run against `https://lingadevaru.in/` (26-10-2026,
desktop and mobile) returned:

| Category | Score | Failing audit |
|---|---|---|
| Performance | 100 | — |
| Accessibility | 100 | — |
| Best Practices | 100 | — |
| SEO | 63 | **Page is blocked from indexing** |
| Agentic Browsing | 3/4 | **ai-catalog.json schema is invalid** |

Everything else in both categories passed. That narrows each problem to a
single, specific cause.

## Audit 1 — `ai-catalog.json schema is invalid`

### Root cause

The manifest published at `/.well-known/ard.json` — which the Worker also
serves at `/ai-catalog.json` and `/.well-known/ai-catalog.json` — was missing
the top-level `specVersion` member:

```json
{
  "entries": [ { "identifier": "urn:air:lingadevaru.in:site:knowledge-guide", ... } ]
}
```

The AI Catalog specification requires `specVersion` and `entries` at **every**
conformance level. Level 1 (Minimal Catalog) is exactly those two members, with
each entry carrying `identifier`, `type` and one of `url` or `data`. The entries
array was already well formed — correct `urn:air:<publisher>:<namespace>:<name>`
identifier, `displayName`, a registered media type (`text/markdown`), a `url`,
and a two-item `representativeQueries` array — so `specVersion` was the only
violation.

Validating the live document against the specification's JSON Schema produced
exactly one error, which matches the single failing audit:

```
'entries' is fine
<root> -> 'specVersion' is a required property
```

### Fix

`artifacts/thoshan-wiki/public/.well-known/ard.json` now declares
`"specVersion": "1.0"` and adds the optional `host` object, which lifts the
catalog from Level 1 Minimal to **Level 2 Discoverable**. `host.identifier` is
deliberately omitted: claiming `did:web:lingadevaru.in` would imply a resolvable
DID document that this site does not publish.

The Worker also now serves these two routes with the specification's media type,
`application/ai-catalog+json`, instead of the generic `application/json` a
static `.json` asset carries.

## Audit 2 — `Page is blocked from indexing`

### Root cause

This was **not** a `robots.txt` problem. The published `robots.txt` allows
`Googlebot`, `Bingbot` and `DuckDuckBot`, which is why the "robots.txt is valid"
audit passes.

Lighthouse fails `is-crawlable` on only two things: a `noindex` meta tag or an
`X-Robots-Tag: noindex` header. The homepage document served to any client that
has not cleared the Turnstile challenge is the gate itself — `src/worker.ts`
returns `GATE_HTML` for every HTML request without a valid verification cookie,
and that interstitial carries:

```html
<meta name="robots" content="noindex, nofollow">
```

PageSpeed Insights appends `Chrome-Lighthouse` to its user agent and is not
matched by any allowlist in the Worker, so it received the gate, scored the gate
document, and failed the audit. The same reason explains why "Discover what your
real users are experiencing" reports *No Data* — there is no field data to
collect from an interstitial.

The `noindex` on the gate is **correct** and has been left in place: a challenge
page should never be indexed. The bug was serving it to crawlers at all.

### Fix

Crawler classification moved out of `src/worker.ts` into `src/crawlers.ts` as a
pure, unit-testable function returning `"block" | "serve" | "gate"`. Two
behaviours changed:

1. **Lighthouse and PageSpeed are served the real document.** PageSpeed
   Insights still sends `Chrome-Lighthouse`; the audit can only pass if the
   measurement sees the page rather than the gate.
2. **AI answer engines that `robots.txt` allows are no longer refused.** The
   previous `AI_BOT_PATTERN` returned `403 Forbidden` for `OAI-SearchBot` and
   `DuckAssistBot`, directly contradicting the `User-agent: OAI-SearchBot /
   Allow: /` and `DuckAssistBot` blocks in `robots.txt`, whose own comments say
   they exist "so pages stay citable". Those two tokens moved to a separate
   `AI_SEARCH_BOT` list that is served the document.

Ordering is significant: training crawlers are matched *before* search crawlers
so that `Applebot-Extended` (training, disallowed) is not mistaken for `Applebot`
(search, allowed), since the former contains the latter as a substring.

Unchanged: AI training crawlers still receive `403`; ordinary browsers still get
the Turnstile gate; the signed verification cookie and the server-side check on
`/api/newsletter/*` are untouched, so serving HTML to a measurement client grants
no access to any protected endpoint.

## Verification record

All checks were run locally before the pull request was opened.

**Unit tests** — `node --test` (13 tests, all passing):

- `src/discovery.test.mjs` — asserts `specVersion === "1.0"` and a `host`
  object, so the schema regression cannot silently return.
- `src/crawlability.test.mjs` — pins every gate decision: PageSpeed mobile and
  desktop, Googlebot, Bingbot, Applebot, `OAI-SearchBot`, `DuckAssistBot`,
  `facebookexternalhit`, `GPTBot`, `ClaudeBot`, `CCBot`, `Amazonbot`,
  `Applebot-Extended`, a plain Chrome user agent, and an empty user agent. It
  also asserts the gate still carries its `noindex` directive.

**Manifest validation** — the new file validates cleanly against the
specification's JSON Schema (`ai-catalog.schema.json`, draft 2020-12). The
previous file failed with `'specVersion' is a required property`. Negative
controls (dropped `specVersion`, `specVersion: "2.0"`, missing `displayName`,
both `url` and `data` present, malformed `urn:air`, single
`representativeQueries` item, unknown top-level key) were each rejected,
confirming the check is not a rubber stamp.

**End-to-end worker harness** — `src/worker.ts` was bundled with
`cloudflare:sockets` stubbed and its `fetch` handler called directly with a
stubbed `ASSETS` binding, comparing the served body against the expected
decision:

| User agent | Before | After |
|---|---|---|
| PageSpeed (`Chrome-Lighthouse`) | gate, `noindex` in body | real document |
| `OAI-SearchBot` | `403` | real document |
| Googlebot | real document | real document |
| Plain Chrome | gate, `noindex` | gate, `noindex` |
| `GPTBot` | `403` | `403` |

Both catalog routes were also exercised through the same harness: they return
`200`, `application/ai-catalog+json; charset=utf-8`, valid JSON and
`specVersion: "1.0"`.

## Trade-offs and follow-ups

- **User-agent allowlisting is spoofable.** Any client can send
  `Chrome-Lighthouse`. This is acceptable here because the HTML surface is
  public by design and every write path is independently protected by the signed
  verification cookie. The durable alternative is to check Cloudflare's verified
  bot signal rather than the UA string, which requires Bot Management on the
  zone.
- **Google discourages UA sniffing for Lighthouse.** They removed the
  `Chrome-Lighthouse` token from the Lighthouse CLI user agent partly to prevent
  score-targeted responses. PageSpeed Insights still sends it today, so the
  check works, but it may stop working without notice. The alternative offered
  by Google is a query parameter such as `?isLighthouse`.
- **`X-Robots-Tag` still suppresses snippets.** `addSecurityHeaders` sets
  `X-Robots-Tag: noarchive, nosnippet, noimageindex, noai` on served documents.
  `nosnippet` stops search engines showing a description under the result and
  `noimageindex` keeps images out of image search; `noai` is not a recognised
  directive and is ignored. This does not affect any Lighthouse audit, so it was
  left alone, but it does reduce organic click-through and is worth revisiting
  as a content-policy decision.
- **`Sitemap` is declared once.** `robots.txt` points at
  `https://lingadevaru.in/sitemap.xml`, which covers the locale subdomains
  through `hreflang` alternates. Locale hosts do not need their own sitemap.

## Rollout

Deployment is automatic: `.github/workflows/deploy.yml` ships `main` on every
push. Merging is what makes these fixes live — before that workflow existed,
merging changed only the repository, which is why the PageSpeed report taken
three minutes after PR #112 merged still showed the old scores.

If you are deploying by hand instead, run `pnpm exec wrangler deploy`, then
confirm:

```bash
# the manifest is served with the spec media type and a version
curl -sI https://lingadevaru.in/ai-catalog.json | grep -i content-type
curl -s  https://lingadevaru.in/ai-catalog.json | head -3

# a Lighthouse-shaped request now receives the real document
curl -s -A "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/94.0.4590.2 Safari/537.36 Chrome-Lighthouse" \
  https://lingadevaru.in/ | grep -ci noindex    # expect 0

# the gate still protects ordinary browsers
curl -s -A "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36" \
  https://lingadevaru.in/ | grep -ci noindex    # expect 1
```

Then re-run PageSpeed Insights. SEO should reach 100 and Agentic Browsing 4/4.
