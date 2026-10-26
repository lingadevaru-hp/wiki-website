# Security Review

**Date:** 26-10-2026 08:58 PM IST
**Scope:** Repository source and configuration review, including the Cloudflare Worker, frontend delivery, and newsletter endpoints. The initial audit was static; follow-up remediation has focused local tests. No production data was accessed.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/worker.ts` | Turnstile verification handler | Unauthenticated `/__turnstile_verify` submissions could inject `return_to` into an HTML attribute on failed verification, enabling reflected XSS; successful verification could redirect externally. **Fixed:** escaped HTML attribute and same-origin path validation. | 9/10 |
| 2 | 🟡 MEDIUM | `src/worker.ts` | Newsletter edit handler | Newsletter edit changes a subscription using only the previous email address; it does not prove control of that mailbox. **Owner-accepted product risk:** email ownership confirmation is intentionally not required, so someone who knows an address could change its subscription record and divert future mail. | 10/10 |

## Hardening gaps

- **Forgeable verification cookie** (formerly `src/worker.ts`): a literal `turnstile-verified=true` value could be supplied by any HTTP client. **Fixed:** the cookie now carries an HMAC-SHA-256 signature and expires after 24 hours.
- **No Content-Security-Policy header** (formerly `src/worker.ts`): **Fixed:** HTML responses now receive a nonce-based CSP; the Worker adds the nonce to scripts and allows the site's required third-party integrations.

## Decisions and follow-up

- Return targets are restricted to same-origin relative paths and escaped before HTML interpolation.
- Verification cookies are signed with the Worker Turnstile secret; newsletter management continues to follow the owner's explicit choice not to require mailbox confirmation.
- Owner notification emails display subscription timestamps in `DD-MM-YYYY hh:mm AM/PM IST`. Stored timestamps remain UTC ISO values.
- Focused local tests cover return-path validation, attribute escaping, cookie signature/expiry, and CSP nonce policy.

The newsletter edit risk remains by design and should be reconsidered only if the product's subscription-management policy changes.
