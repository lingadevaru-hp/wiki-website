# CLAUDE.md — wiki-website (project agent memory)

> READ THIS FIRST before touching anything in `wiki-website/`.
> Project-specific agent file. Status banner is always at the top.

---

## 🟢 ACTIVE STATE (10-26-2026): ORIGINAL PORTFOLIO RESTORED

- **Live site `lingadevaru.in` and all locale subdomains serve the portfolio/wiki again.**
- Decoy mode and its Worker intercept have been removed; `wrangler.jsonc` no longer contains `DECOY_MODE`.
- Portfolio code, `dist/`, D1 (`wiki-newsletter`), and secrets remain intact.
- NEVER push source to public repos; PR to private `wiki-website` repo only.

---

## 📁 Project overview

Main portfolio & wiki site for Lingadevaru H P (brand: Thoshan). Single codebase/worker/deploy; `lingadevaru.in` (en) + `kn./hi./ja./ml./ta./te./gu.` subdomains serve the same build. See `docs/localization.md` before touching i18n. Never hardcode user-facing strings; use `t("...")`.
