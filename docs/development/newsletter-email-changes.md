# Newsletter Email-Change Confirmation

## Policy and user experience

Only changing the email address on an existing subscription requires
confirmation. The one-time link is sent to the current address on file, using
the existing Zoho SMTP account. No separate OTP provider or sending service
was added.

New subscriptions and edits that keep the same email address remain immediate.
Until an email-change link is explicitly confirmed, the existing subscription
is unchanged. A confirmation request lasts 30 minutes. The form reports
success after confirmation and returns the browser to the site.

## Request and confirmation behavior

The frontend submits an edit through `POST /api/newsletter/signup`. When the
requested address differs from the address on file, the Worker:

1. Checks that the subscriber exists, the target is not already subscribed,
   SMTP is configured, and no different pending change is inside the
   five-minute resend cooldown.
2. Creates a random UUID token, stores only its SHA-256 hash and pending
   subscriber details in D1, then emails the raw token link to the current
   mailbox.
3. Returns a pending acknowledgement. Re-requesting the same pending address
   during cooldown does not send another email.

The confirmation URL is
`/api/newsletter/email-change/confirm?token=...`. `GET` validates the token
and displays a form; it does not mutate subscription data. An explicit
`POST` validates the token again, updates the subscriber, appends
`newsletter_history`, and consumes the pending request in one D1 batch. Used,
expired, and invalid links are rejected. An address already held by another
subscriber is not changed.

Changing the address resets the welcome-email-sent marker so the new mailbox
can receive the existing welcome message. A five-minute per-subscriber
cooldown limits email sends; it does not prevent retrying the same pending
request from showing its acknowledgement.

If the D1 binding is not configured and the legacy Node API fallback is used,
changed-address edits fail explicitly rather than bypassing confirmation.

## Data and email handling

Migration `0003_newsletter_email_change_confirmation.sql` creates
`newsletter_email_change_requests`. It stores the subscriber ID, old and
requested addresses, pending profile fields, creation and expiry times, and a
unique SHA-256 token hash. The raw confirmation token is not stored in D1.
Pending records are removed when consumed; expired rows are cleaned up when
new requests are created.

The Worker uses the existing Zoho SMTP settings. Keep
`ZOHO_SMTP_PASSWORD` as a Cloudflare Worker secret, never in source or the
frontend. Human-readable timestamps in owner notifications use
`DD-MM-YYYY hh:mm AM/PM IST`; database timestamps remain UTC ISO values.

## Development and release checks

Focused security tests:

```bash
node --test src/security.test.mjs
pnpm run typecheck
pnpm run build
pnpm exec wrangler deploy --dry-run
```

The local end-to-end check used an isolated D1 database and synthetic
addresses. It verified that `GET` does not change a subscription, explicit
`POST` updates the address/history and consumes the token, and replay is
rejected. Do not run this flow against production subscriber data.

For production, apply the D1 migration before deploying code that relies on
it:

```bash
pnpm exec wrangler d1 migrations list wiki-newsletter --remote
pnpm exec wrangler d1 migrations apply wiki-newsletter --remote
pnpm exec wrangler deploy
```

Review the target in the root `wrangler.jsonc` before any remote command.
Production source changes go through a PR to the private repository
`lingadevaru-hp/wiki-website`.

## Production deployment record

| Item | Value |
|------|-------|
| PR | [#109 — Require confirmation for newsletter email changes](https://github.com/lingadevaru-hp/wiki-website/pull/109) |
| Merged | 26-10-2026 |
| Merge commit | `245aab64c7bd9b233707e7c8157d7ae9dd827f10` |
| D1 database | `wiki-newsletter` |
| Applied migration | `0003_newsletter_email_change_confirmation.sql` |
| Worker | `wiki-website` |
| Cloudflare version | `e33c2d56-9972-4a82-8679-68f7154a7179` |

Post-deploy checks returned HTTP 200 for the apex site, Kannada site, and
English/Kannada locale assets. Invalid confirmation GET and POST requests
returned HTTP 410; normal browser HTML responses carried the nonce-based
Content Security Policy. No real subscriber email was used, so SMTP delivery
to an actual recipient was not verified.
