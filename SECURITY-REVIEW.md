# Security Review

**Date:** 2026-10-26  
**Scope:** Repository source and configuration review, including the Cloudflare Worker, frontend delivery, and newsletter endpoints. No production data was accessed and no dynamic testing was performed.

## Findings

| # | Severity | File | Lines | Vulnerability | Confidence |
|---|----------|------|-------|---------------|------------|
| 1 | 🟠 HIGH | `src/worker.ts` | 32, 788, 814 | Unauthenticated `/__turnstile_verify` submissions can inject `return_to` into an HTML attribute on failed verification, enabling reflected XSS. On successful verification the same unvalidated value is used as a redirect target. | 9/10 |
| 2 | 🟡 MEDIUM | `src/worker.ts` | 412–433, 690–697 | Newsletter edit changes a subscription using only the prior email address; it does not prove control of that mailbox. Someone who knows the address could change the stored destination and divert future mail. Turnstile is not authorization. | 10/10 |

## Hardening gaps

- **Forgeable verification cookie** (`src/worker.ts:753–758`): access is granted when a client supplies `turnstile-verified=true`. This is not cryptographically tied to a successful Turnstile check and can be set by any HTTP client. Use a short-lived, integrity-protected verification token or verify the challenge for the protected action.
- **No Content-Security-Policy header** (`src/worker.ts:55–59, 197–208`): add a restrictive CSP as defense in depth, while accounting for the frontend's required scripts, styles, and connections.

## Recommended remediation

1. Restrict `return_to` to validated local relative paths, HTML-escape any value placed in markup, and prevent external redirect targets.
2. Require proof of mailbox ownership (for example, a single-use, high-entropy management token) before changing a subscription or its email address.
3. Replace the forgeable cookie with an integrity-protected, short-lived token and add a suitable CSP.

These findings are from static review; exploitability and remediation should be confirmed with focused tests before release.
