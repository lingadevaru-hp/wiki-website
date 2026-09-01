# Backend

## Stack

- **Hono** — lightweight web framework
- **Cloudflare Workers** — runtime
- **Drizzle ORM** — database queries
- **Zod** — request validation

## Structure

```
artifacts/api-server/
├── src/
│   ├── index.ts        # Hono app entry
│   ├── routes/         # API route handlers
│   └── middleware/      # Auth, CORS, etc.
└── wrangler.jsonc      # Cloudflare config
```

## API Conventions

- REST endpoints under `/api/`
- JSON request/response bodies
- Zod validation on all inputs
- Consistent error format: `{ error: string, code: number }`
