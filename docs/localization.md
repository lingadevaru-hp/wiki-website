# Localization (i18n) — thoshan-wiki

Single codebase, single worker, single deployment. `lingadevaru.in` (en),
`kn.lingadevaru.in` (kn), `hi.lingadevaru.in` (hi) serve the same build;
only the dictionary differs. No per-language repos, workers, or configs.

## How it works

- `artifacts/thoshan-wiki/src/i18n/supportedLocales.ts` — single source of truth.
  Add a language = 1 entry here + 1 dictionary + 1 DNS record. Everything
  (globe menu, palette submenu, detection, redirect) reads this file.
- `artifacts/thoshan-wiki/src/contexts/LocaleContext.tsx` — runtime provider.
  Detects locale by hostname → `?lang=` override → `localStorage`, fetches
  `/locales/{lang}.json`, sets `<html lang dir>`, exposes `t(key)`.
  Missing key falls back to the key itself (English source) + dev console warn.
- Dictionaries: `artifacts/thoshan-wiki/public/locales/{en,kn,hi}.json`
  (flat key→string, keys are English source). Served statically, no API keys.
- UI text: `const { t } = useLocale();` then `t("nav.wikiHome")`. Never hardcode
  user-facing strings.
- Globe (`components/LanguageSwitcher.tsx`) + palette (`CommandMenu.tsx`
  `language.*` rows) redirect to the same path on the locale's subdomain in a
  NEW tab via `openLocaleNewTab()` (`supportedLocales.ts`). Localhost swaps
  in place via `LOCALE_EVENT`.
- Articles: `src/lib/articleLoader.ts` tries
  `data/articles/{slug}.{lang}.json` → falls back to `{slug}.json` (English,
  silent). Same for `articles-index.{lang}.json` (translated titles/excerpts).
- Browser auto-translate is OPTED OUT (curated translations are canonical):
  `index.html` has `<meta name="google" content="notranslate">` +
  `<html translate="no" class="notranslate">`; `src/worker.ts`
  `addSecurityHeaders` sets `Content-Language: kn/hi/en` per hostname, and
  `withLocaleHtml()` (HTMLRewriter) rewrites `<html lang>` per host on every
  `text/html` response (verified users, search/social bots) so first paint
  already declares `kn`/`hi` before JS runs. Turnstile `GATE_HTML` carries the
  same `lang` + `translate="no"` + meta. `SEO.tsx` emits `hreflang` alternates
  (en/kn/hi + `x-default`) + per-locale `og:locale` so Google/DuckDuckGo/Brave
  index each subdomain as its own language.

## Add a new language (e.g. `ta`)

1. Write `public/locales/ta.json` — copy `en.json`, translate VALUES only.
   Keep KEYS byte-identical. Validate: same key set as `en.json`.
2. Add entry to `SUPPORTED_LOCALES` in `supportedLocales.ts`:
   `{ code: "ta", name: "...", native: "...", flag: "🇮🇳", dir: "ltr", host: "ta.lingadevaru.in" }`.
3. Translate article titles/excerpts: copy `articles-index.json` →
   `articles-index.ta.json` with translated `title`/`excerpt` (keep slug/category).
   Bodies: copy each `public/data/articles/{slug}.json` → `{slug}.ta.json`
   translated (preserve URLs, code, IDs, markdown markers — see existing
   `*.kn.json` for the pattern). Run `tsc` + build to verify.
4. DNS + worker (same worker, no new one):
   proxied CNAME `ta → lingadevaru.in`, then attach custom domain:
   `PUT /accounts/{id}/workers/domains`
   `{"hostname":"ta.lingadevaru.in","service":"wiki-website","environment":"production"}`
   (inherits Turnstile/bot/`_headers`/observability automatically).
5. `pnpm build && wrangler deploy`, verify `https://ta.lingadevaru.in/` shows
   translated UI with no raw `key.like.this` strings.

## Remove a language (e.g. drop `hi`)

1. Delete `public/locales/hi.json` (+ `*.hi.json` article files if any).
2. Remove its `SUPPORTED_LOCALES` entry.
3. Remove DNS CNAME + worker custom domain. Done — nothing else references it.

## Update strings

1. Edit `public/locales/en.json` (add/change keys; keys ARE the English fallback).
2. Mirror the same keys in `kn.json`/`hi.json` (agent prompt: "Translate VALUES
   to Kannada/Hindi. Keep KEYS identical. Output only valid JSON.").
3. Commit all three + rebuild + redeploy. Partial files are safe (fallback).

## Debug

- `?lang=kn` forces a locale without DNS. Dev console logs `[locale] kn <host>`
  and warns `[locale] missing key "..."`.
- Raw `dotted.keys` on screen = dictionary missing/stale → rebuild + redeploy
  (dist copies `public/locales/`), hard-refresh (WhatsApp-style 7-day cache
  does not apply; browser cache does).
- `curl https://kn.lingadevaru.in/locales/kn.json | head -c 200` must return JSON.
