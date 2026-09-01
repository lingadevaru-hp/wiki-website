# Architecture Overview

## System Diagram

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  React SPA   │────▶│  API Server  │────▶│  PostgreSQL   │
│  (Vite)      │     │  (Hono)      │     │  (Drizzle)    │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                     ┌──────┴──────┐
                     │   Workers   │
                     │  (Queues)   │
                     └─────────────┘
```

## Workspace Structure

This is a **pnpm workspace** monorepo:

| Package | Path | Purpose |
|---------|------|---------|
| `thoshan-wiki` | `artifacts/thoshan-wiki/` | React SPA (frontend) |
| `api-server` | `artifacts/api-server/` | Hono API backend |
| `mockup-sandbox` | `artifacts/mockup-sandbox/` | Sandpack component sandbox |
| `article-tts` | `article-tts/` | Text-to-speech for articles |
| `scripts` | `scripts/` | Build & utility scripts |
| `db` | `lib/db/` | Drizzle ORM schema & client |
| `api-spec` | `lib/api-spec/` | API type definitions |
| `api-zod` | `lib/api-zod/` | Zod validation schemas |
| `api-client-react` | `lib/api-client-react/` | React API client hooks |
