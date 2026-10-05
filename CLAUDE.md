# CLAUDE.md — wiki-website (project agent memory)

> READ THIS FIRST before touching anything in `wiki-website/`.
> Project-specific agent file. Status banner is always at the top.

---

## 🔴 ACTIVE STATE (05-10-2026): DECOY MODE ON — DO NOT REMOVE UNTIL OWNER SAYS “BACK”

- **Live site `lingadevaru.in` (+ all locale subdomains) is serving a single decoy page, NOT the portfolio.**
- Kill-switch: `vars.DECOY_MODE = "1"` in `wrangler.jsonc` (deployed 05-10-2026, version `f21fb654`). Revert = `"0"` + `npx wrangler deploy` (~15s).
- Decoy looks like a normal personal index page (no "maintenance" wording) but returns **HTTP 503 + `Retry-After: 86400`** so Google/Bing keep the index.
- Decoy content (resume-based, per owner 05-10-2026): **Lingadevaru H P** (no "Thoshan" anywhere) / trimmed objective (degree clause removed) / `contact@lingadevaru.in` (only link, mailto) / Bengaluru, Karnataka, India / Technical Skills chips (Python, GitHub, Docker, Cloudflare D1) / Soft Skills / Languages (Kannada Native, English Professional) / Hobbies (Yoga, Listening to Music). EXCLUDED: phone, all education/years, chatbot project, DOB, all outbound links. Dark theme, single file `src/decoy.ts`. No subdomain or locale hints.
- Nothing was deleted. Portfolio code, `dist/`, D1 (`wiki-newsletter`), secrets all intact.

### How to restore full site (when owner says “back” / “go back normal”)

1. In `wrangler.jsonc` set `"DECOY_MODE": "0"`.
2. Run `npx wrangler deploy` from `wiki-website/`.
3. Verify: `curl -i https://lingadevaru.in/` → `200`; `curl -s https://lingadevaru.in/locales/en.json` → `200` JSON; `kn.lingadevaru.in/` → `200` Kannada UI.
4. Optional cleanup (only after restore is verified live): delete `src/decoy.ts`, remove its import + intercept block + `DECOY_MODE` from `Env` in `src/worker.ts`, remove the var from `wrangler.jsonc`, redeploy. Or keep the flag at `"0"` as a reusable kill-switch — preferred.
5. NEVER push source to public repos; PR to private `wiki-website` repo only.

### What was changed for decoy mode (05-10-2026)

| File | Change |
|------|--------|
| `src/decoy.ts` (new) | `decoyHtml()` dark-theme single inline-CSS page (~1.6KB, LH monogram, 48px mailto pill, mobile-first) + `decoyResponse()` 503 with `Retry-After`, `no-store`, `Content-Language: en`, `X-Robots-Tag: noarchive, nosnippet, noimageindex`. `isDecoyMode(env)` helper. |
| `src/worker.ts` | Import `decoyResponse, isDecoyMode`; added `DECOY_MODE?: string` to `Env`; first-line intercept in `fetch()` BEFORE static/API/bot bypasses. Pass-through only for `/robots.txt`, `/sitemap.xml` (SEO), and authed owner `/api/newsletter/subscribers\|history` (valid proxy token). Everything else → `decoyResponse()`. |
| `wrangler.jsonc` | `vars.DECOY_MODE = "1"` (indefinite — no auto-expiry; stays until owner says back). |

### Why this shape (do not "fix" while decoy is on)

- Intercept MUST stay first: moving it below `STATIC_BYPASS_PATHS`/`/assets/` re-leaks portfolio JSON/assets via direct URLs.
- Status MUST stay 503: changing to 200 would get the decoy indexed and drop rankings.
- `Content-Language: en` + `lang="en"` on all hosts is intentional: hides locale-subdomain existence.
- `Retry-After: 86400` (1 day, not 5) is intentional: correct for indefinite mode; crawlers retry daily.

---

## 📁 Project overview

Main portfolio & wiki site for Lingadevaru H P (brand: Thoshan). Single codebase/worker/deploy; `lingadevaru.in` (en) + `kn./hi./ja./ml./ta./te./gu.` subdomains serve the same build. See `docs/localization.md` before touching i18n. Never hardcode user-facing strings; use `t("...")`.
