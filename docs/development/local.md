# Local Development

## Start All Services

```bash
pnpm dev
```

## Newsletter

The production architecture uses the portfolio Worker and D1 binding. During
`wrangler dev`, newsletter data uses the local D1 database; collecting test
signups does not require PostgreSQL or Zoho credentials. Build the frontend
first so the Worker has assets to serve:

```bash
pnpm --filter @workspace/thoshan-wiki build
pnpm exec wrangler dev
```

If local SMTP is not configured, welcome messages remain pending for the
existing backfill flow. Existing subscriber email changes require the current
mailbox confirmation flow; use synthetic addresses and an isolated local D1
database when testing it. See
[Newsletter email-change confirmation](newsletter-email-changes.md).

## Legacy Node API

1. Copy `artifacts/api-server/.env.example` to
   `artifacts/api-server/.env`; set a PostgreSQL `DATABASE_URL` and Zoho
   mailbox credentials. Create a Zoho app password for SMTP.
2. Apply the database schema with
   `pnpm --filter @workspace/db push` while `DATABASE_URL` is available in the
   environment.
3. Start the API with `pnpm --filter api-server dev` and the site with
   `pnpm --filter thoshan-wiki dev`. This legacy path is for API development
   and backfill; the default production newsletter path is D1 in the Worker.

## Individual Services

```bash
# Frontend only
pnpm --filter thoshan-wiki dev

# API server only
pnpm --filter api-server dev

# Mockup sandbox only
pnpm --filter mockup-sandbox dev
```

## Hot Reload

Vite provides instant HMR for the frontend. API server restarts on file changes.
