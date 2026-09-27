# Cloudflare Workers Deployment

## Setup

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login
```

## Newsletter storage (free — Cloudflare D1)

Signups are stored directly in the Worker's D1 database. No paid Postgres
or separately hosted API is needed to collect subscribers.

```bash
# One-time: create the database and wire its ID into wrangler.jsonc
wrangler d1 create wiki-newsletter
# copy the returned database_id into d1_databases in wrangler.jsonc

# Apply migrations (remote for production, local is automatic in wrangler dev)
wrangler d1 migrations apply wiki-newsletter --remote
```

Pending welcome emails are rows with `welcome_email_sent_at IS NULL`.
They are sent later by the Node email sender once Zoho SMTP credentials
exist — see `docs/development/env.md`.

## Newsletter API Server (legacy / email backfill only)

```bash
# Deploy artifacts/api-server as a Node.js service (Node.js 22.9+).
# Configure DATABASE_URL, ZOHO_SMTP_USER, and ZOHO_SMTP_PASSWORD
# as private environment variables on the API hosting provider.
```

Apply the Drizzle schema against the production database before enabling
signups: `pnpm --filter @workspace/db push` with the production
`DATABASE_URL` set securely.

Set `NEWSLETTER_API_URL` in the portfolio Worker's environment only if you
use the legacy Node API path. When the `DB` (D1) binding exists, the Worker
stores signups itself and never calls the Node service. Set
`NEWSLETTER_PROXY_TOKEN` as a Worker secret and the same secret on the
Node API host only for the legacy path; the Worker always requires the
site's Turnstile verification cookie before it accepts a signup.

## Deploy TTS Worker

```bash
cd article-tts
wrangler deploy
```

## Worker Secrets

```bash
wrangler secret put TURNSTILE_SECRET
wrangler secret put NEWSLETTER_PROXY_TOKEN
```

Zoho and database secrets belong only on the Node API host, not in the
portfolio Worker or frontend build.
