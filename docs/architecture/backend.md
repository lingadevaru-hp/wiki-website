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

`POST /api/newsletter/signup` accepts `{ firstName, email, language }`. The
portfolio Worker stores each email once in the free D1 table
`newsletter_subscribers` (`migrations/0001_newsletter_subscribers.sql`) and
validates the same rules as the Node API (name 1–80 chars, valid email,
one of `en`, `kn`, `hi`, `ja`, `ml`, `ta`, `te`, or `gu`).

The welcome email from `newsletter@lingadevaru.in` is sent later by the
Node email backfill once Zoho SMTP credentials exist; until then the D1 row
stays pending (`welcome_email_sent_at IS NULL`). Run it from
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
