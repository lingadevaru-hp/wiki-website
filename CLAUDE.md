# CLAUDE.md — wiki-website (project agent memory)

> READ THIS FIRST before touching anything in `wiki-website/`.
> Project-specific agent file. Status banner is always at the top.

---

## 🟢 ACTIVE STATE (26-10-2026 09:23 PM IST): PORTFOLIO LIVE, EMAIL CHANGES CONFIRMED

- **Live site `lingadevaru.in` and all locale subdomains serve the portfolio/wiki again.**
- Decoy mode and its Worker intercept have been removed; `wrangler.jsonc` no longer contains `DECOY_MODE`.
- Changing an existing newsletter email sends a one-time confirmation link to the current address using the existing Zoho SMTP account. Links expire after 30 minutes; opening one does not confirm until the recipient presses the button. New subscriptions and edits that keep the same email do not require confirmation. A five-minute resend cooldown applies per subscriber.
- Portfolio code, `dist/`, D1 (`wiki-newsletter`), and secrets remain intact.
- Human-readable timestamps in owner notification emails and project documentation use `DD-MM-YYYY hh:mm AM/PM IST`; timestamps stored in databases remain UTC ISO format.
- NEVER push source to public repos; PR to private `wiki-website` repo only.

---

## 📁 Project overview

Main portfolio & wiki site for Lingadevaru H P (brand: Thoshan). Single codebase/worker/deploy; `lingadevaru.in` (en) + `kn./hi./ja./ml./ta./te./gu.` subdomains serve the same build. See `docs/localization.md` before touching i18n. Never hardcode user-facing strings; use `t("...")`.
