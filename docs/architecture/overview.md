# Architecture Overview

## System Diagram

```
┌────────────────┐      ┌────────────────────────┐
│ React SPA      │─────▶│ Cloudflare Worker      │
│ (static assets)│      │ wiki-website           │
└────────────────┘      └──────┬─────────┬───────┘
                               │         │
                               ▼         ▼
                         ┌─────────┐ ┌───────────┐
                         │ D1      │ │ Zoho SMTP │
                         │newsletter│ └───────────┘
                         └─────────┘

        Legacy API server (Express/Drizzle/PostgreSQL)
        supports backfill and fallback operations.
```

## Workspace Structure

This is a **pnpm workspace** monorepo:

| Package | Path | Purpose |
|---------|------|---------|
| `thoshan-wiki` | `artifacts/thoshan-wiki/` | React SPA (frontend) |
| `api-server` | `artifacts/api-server/` | Express API backend |
| `mockup-sandbox` | `artifacts/mockup-sandbox/` | Sandpack component sandbox |
| `article-tts` | `article-tts/` | Text-to-speech for articles |
| `scripts` | `scripts/` | Build & utility scripts |
| `db` | `lib/db/` | Drizzle ORM schema & client |
| `api-spec` | `lib/api-spec/` | API type definitions |
| `api-zod` | `lib/api-zod/` | Zod validation schemas |
| `api-client-react` | `lib/api-client-react/` | React API client hooks |

The root `wrangler.jsonc` deploys the `wiki-website` Worker. It serves the SPA,
handles Turnstile and newsletter endpoints, stores newsletter subscriptions
and pending email changes in D1, and sends email through Zoho SMTP. The
separately hosted Express API and PostgreSQL path is retained for legacy and
backfill operations; see [Backend](backend.md) and
[newsletter email changes](../development/newsletter-email-changes.md).
