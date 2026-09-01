# Environment Variables

## Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgres://user:pass@localhost:5432/wiki` |

## Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | API server port | `3000` |
| `NODE_ENV` | Environment mode | `development` |

## Cloudflare

For production, secrets are managed via Wrangler:

```bash
wrangler secret put DATABASE_URL
```
