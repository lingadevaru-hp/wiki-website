# Database

## Stack

- **PostgreSQL** (or Cloudflare D1 in production)
- **Drizzle ORM** for type-safe queries
- **Drizzle Kit** for migrations

## Schema Location

```
lib/db/
├── src/
│   ├── schema.ts    # Table definitions
│   ├── index.ts     # Client export
│   └── migrate.ts   # Migration runner
└── drizzle.config.ts
```

## Common Commands

```bash
# Push schema changes
pnpm -r db:push

# Generate migrations
pnpm -r db:generate

# Open Drizzle Studio
pnpm -r db:studio
```
