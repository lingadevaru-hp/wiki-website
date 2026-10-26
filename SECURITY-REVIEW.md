# Security Review

**Date:** 26-10-2026 09:52 PM IST
**Scope:** Repository source and configuration review, including the Cloudflare Worker, frontend delivery, and newsletter endpoints. The initial audit was static; remediation was checked with focused local tests and production endpoint checks. No production subscriber data or email-change request was accessed.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/worker.ts` | Turnstile verification handler | Unauthenticated `/__turnstile_verify` submissions could inject `return_to` into an HTML attribute on failed verification, enabling reflected XSS; successful verification could redirect externally. **Fixed:** escaped HTML attribute and same-origin path validation. | 9/10 |
| 2 | 🟡 MEDIUM | `src/worker.ts` | Newsletter edit handler | An email change could previously be completed by knowing the old address. **Fixed:** changing an existing subscription's email now requires a one-time link opened and explicitly confirmed from the current/old mailbox. Same-address edits and new subscriptions remain immediate. | 10/10 |

## Hardening gaps

- **Forgeable verification cookie** (formerly `src/worker.ts`): a literal `turnstile-verified=true` value could be supplied by any HTTP client. **Fixed:** the cookie now carries an HMAC-SHA-256 signature and expires after 24 hours.
- **No Content-Security-Policy header** (formerly `src/worker.ts`): **Fixed:** HTML responses now receive a nonce-based CSP; the Worker adds the nonce to scripts and allows the site's required third-party integrations.

## Decisions and follow-up

- Return targets are restricted to same-origin relative paths and escaped before HTML interpolation.
- Verification cookies are signed with the Worker Turnstile secret.
- Email-change confirmation uses the existing Zoho SMTP sender (no separate OTP provider), SHA-256 token hashes in D1, a 30-minute expiry, a five-minute resend cooldown, and an explicit POST confirmation so email link scanners cannot approve changes by fetching the link.
- The existing address remains unchanged until confirmation; new subscriptions and name/language-only edits do not require confirmation.
- Owner notification emails display subscription timestamps in `DD-MM-YYYY hh:mm AM/PM IST`. Stored timestamps remain UTC ISO values.
- Focused local tests cover return-path validation, attribute escaping, token hashing, cookie signature/expiry, and CSP nonce policy.

The initial audit was static. Follow-up security behavior was verified with focused tests, an isolated local D1/Worker flow, and production checks for invalid confirmation requests. No real production email was sent as part of verification.

## Production remediation record

- PR [#109](https://github.com/lingadevaru-hp/wiki-website/pull/109) merged on 26-10-2026; merge commit `245aab64c7bd9b233707e7c8157d7ae9dd827f10`.
- D1 migration `0003_newsletter_email_change_confirmation.sql` was applied to `wiki-newsletter`.
- Worker `wiki-website` was deployed as version `e33c2d56-9972-4a82-8679-68f7154a7179`.
- Production homepage and locale assets returned HTTP 200; invalid confirmation GET and POST requests returned HTTP 410. The normal browser HTML path returned the nonce-based CSP.
- SMTP delivery to a real subscriber mailbox remains unverified.

See [Newsletter email-change confirmation](docs/development/newsletter-email-changes.md) for implementation, migration, and release details.
