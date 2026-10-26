# Backend

## Stack

- **Express 5** — Node.js API server
- **Drizzle ORM** — database queries
- **PostgreSQL** — persistent application data
- **Zod** — request validation
- **Nodemailer** — Zoho SMTP email delivery

## Structure

```
artifacts/api-server/
├── src/
│   ├── index.ts        # Node server entry
│   ├── app.ts          # Express app and middleware
│   ├── routes/         # API route handlers
│   └── services/       # External services (email)
└── .env.example        # Local API configuration template
```

## API Conventions

- REST endpoints under `/api/`
- JSON request/response bodies
- Zod validation on all inputs
- Do not return credentials or provider errors to clients.

## Newsletter signup

`POST /api/newsletter/signup` accepts `{ firstName?, email, language }`; the
first name is optional and limited to 80 characters. The portfolio Worker
stores each email once in the free D1 table
`newsletter_subscribers` (`migrations/0001_newsletter_subscribers.sql`) and
validates the same rules as the Node API (valid email and one of `en`, `kn`,
`hi`, `ja`, `ml`, `ta`, `te`, or `gu`).

The Worker sends a localized welcome email from `newsletter@lingadevaru.in`
when SMTP is configured. The Node email backfill retries pending D1 rows
(`welcome_email_sent_at IS NULL`) if delivery was unavailable. Run it from
`artifacts/api-server/` (needs `.env` with the Zoho app password):

```bash
pnpm --filter @workspace/api-server run build
pnpm --filter @workspace/api-server run backfill:newsletter -- --db wiki-newsletter
```

Per pending subscriber it sends the localized welcome email, then a
best-effort owner alert to `NEWSLETTER_OWNER_EMAILS`, then marks the row
sent (only if still pending, so parallel runs never double-send). Use
`--dry-run` to list pending rows without sending; `--limit N` caps a run.

No commands needed day-to-day: `.github/workflows/newsletter-backfill.yml`
runs the backfill every 6 hours via GitHub Actions (plus manual
`workflow_dispatch`). It needs three repository secrets — `ZOHO_SMTP_PASSWORD`,
`CLOUDFLARE_API_TOKEN` (Account D1 edit), `CLOUDFLARE_ACCOUNT_ID`. Owner
alerts arrive as email, so the Zoho Mail mobile app's push notifications
deliver them straight to the phone.

Owners can list subscribers (never linked from the site) with the shared
proxy token — JSON by default, `&format=csv` for spreadsheets:

```bash
curl -H "X-Newsletter-Proxy-Token: $NEWSLETTER_PROXY_TOKEN" \
  "https://lingadevaru.in/api/newsletter/subscribers?limit=100&format=csv"
```

Set the token on the Worker with `wrangler secret put NEWSLETTER_PROXY_TOKEN`
(same value as the Node host). Without a token the endpoint answers 403.

The legacy Express route
in `artifacts/api-server/src/routes/newsletter.ts` (Postgres + immediate
send) remains for that backfill and is used only when the Worker has no
`DB` binding but `NEWSLETTER_API_URL` is set.

## Changing an existing subscriber's email

Changing an existing subscriber's email requires confirmation from the
mailbox currently on file. The Worker sends a one-time link through the
existing Zoho SMTP configuration. The current subscription is not changed
until the recipient opens the link and submits the confirmation form.

- The link expires after 30 minutes. Its random token is emailed, but only
  its SHA-256 hash is stored in D1.
- Fetching the link with `GET` only displays a confirmation form; an explicit
  `POST` performs the change so email link scanners do not confirm it.
- A five-minute resend cooldown applies per subscriber. Requests for the same
  pending address return the existing pending state rather than sending again.
- On confirmation, the Worker updates the subscriber, records
  `newsletter_history`, and consumes the pending request in a D1 batch. It
  resets the welcome-email marker so the new address receives the welcome
  message.
- New subscriptions and edits that keep the same email address do not require
  confirmation. If the target address is already subscribed, the change is
  rejected without changing the current subscription.
- The legacy API fallback cannot confirm email changes; changed-address edits
  return an error if the Worker has no D1 binding.

See [Newsletter email-change confirmation](../development/newsletter-email-changes.md)
for the endpoint contract, migration, and deployment record.

Owner notification messages format human-readable timestamps as
`DD-MM-YYYY hh:mm AM/PM IST`; database timestamps remain UTC ISO strings.
