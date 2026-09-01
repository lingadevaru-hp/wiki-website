# Local Development

## Start All Services

```bash
pnpm dev
```

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
