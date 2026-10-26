# Cloudflare Workers Deployment

## Setup

Use the repository's pinned Wrangler through pnpm (`pnpm exec wrangler`).
The root `wrangler.jsonc` configures the production `wiki-website` Worker,
static assets, and the `wiki-newsletter` D1 binding. Authenticate with the
Cloudflare account that owns these resources before deploying.

## Newsletter storage (free — Cloudflare D1)

Signups are stored directly in the Worker's D1 database. No paid Postgres
or separately hosted API is needed to collect subscribers.

```bash
# One-time: create the database and wire its ID into wrangler.jsonc
pnpm exec wrangler d1 create wiki-newsletter
# copy the returned database_id into d1_databases in wrangler.jsonc

# Apply migrations (remote for production, local is automatic in wrangler dev)
pnpm exec wrangler d1 migrations apply wiki-newsletter --remote
```

The Worker sends welcome emails directly when Zoho SMTP is configured.
Unsent welcome emails (`welcome_email_sent_at IS NULL`) are retried by the
scheduled GitHub Actions backfill. Existing subscriber email changes require
confirmation through the current mailbox; see
[Newsletter email-change confirmation](../development/newsletter-email-changes.md).

## Newsletter API Server (legacy / email backfill only)

```bash
# Deploy artifacts/api-server as a Node.js service (Node.js 22.9+).
# Configure DATABASE_URL, ZOHO_SMTP_USER, and ZOHO_SMTP_PASSWORD
# as private environment variables on the API hosting provider.
```

Apply the Drizzle schema against the production database before enabling
signups: `pnpm --filter @workspace/db push` with the production
`DATABASE_URL` set securely.

Set `NEWSLETTER_API_URL` only when deliberately using the legacy Node API
fallback. When the `DB` (D1) binding exists, the Worker handles newsletter
data itself. The Worker requires the site's Turnstile verification cookie
before accepting signup requests.

## Deploy TTS Worker

```bash
cd article-tts
wrangler deploy
```

## Portfolio Worker secrets

```bash
pnpm exec wrangler secret put TURNSTILE_SECRET
pnpm exec wrangler secret put ZOHO_SMTP_PASSWORD
pnpm exec wrangler secret put NEWSLETTER_PROXY_TOKEN
```

`TURNSTILE_SECRET` and `ZOHO_SMTP_PASSWORD` are used by the portfolio Worker.
The proxy token is needed only for the legacy API path. Keep secret values out
of source and frontend assets. Use a Zoho app password; see
[Environment Variables](../development/env.md).

## Production deployment

Build and check the Worker before deployment:

```bash
pnpm run build
pnpm exec wrangler deploy --dry-run
```

After merging the private-repository PR, apply any required remote D1
migrations first, then deploy with `pnpm exec wrangler deploy`. Verify the
live site and relevant routes. See
[Newsletter email-change confirmation](../development/newsletter-email-changes.md)
for the production rollout record for PR #109.
