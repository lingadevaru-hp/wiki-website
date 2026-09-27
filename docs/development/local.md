# Local Development

## Start All Services

```bash
pnpm dev
```

## Newsletter API

Free path (default): the portfolio Worker stores signups in local D1 during
`wrangler dev` — no Postgres or Zoho credentials needed to collect
subscribers. Build the frontend first so the Worker has assets to serve:

```bash
pnpm --filter @workspace/thoshan-wiki build
wrangler dev
```

Welcome emails stay pending until Zoho SMTP credentials exist; they are
sent later by the Node email sender. Legacy Node path below is only for
that backfill.

1. Copy `artifacts/api-server/.env.example` to
   `artifacts/api-server/.env`; set a PostgreSQL `DATABASE_URL` and Zoho
   mailbox credentials. Create a Zoho app password for SMTP.
2. Apply the database schema with
   `pnpm --filter @workspace/db push` while `DATABASE_URL` is available in the
   environment.
3. Start the API with `pnpm --filter api-server dev` and the site with
   `pnpm --filter thoshan-wiki dev`. The Vite proxy sends newsletter signups
   to `http://localhost:3000` by default; set `NEWSLETTER_API_URL` to use a
   different API origin.

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
