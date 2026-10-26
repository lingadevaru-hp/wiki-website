# Database

## Stack

- **Cloudflare D1** stores production portfolio newsletter subscribers,
  newsletter history, and pending email-change confirmations.
- **PostgreSQL** remains for the legacy Express API and its backfill path.
- **Drizzle ORM/Kit** manage the Node API's PostgreSQL schema.
- **Wrangler SQL migrations** under root `migrations/` manage the production
  D1 schema.
- Timestamps are stored as UTC ISO values; owner-facing emails display them
  as `DD-MM-YYYY hh:mm AM/PM IST`.

## Schema Location

```
lib/db/
├── src/
│   ├── schema.ts    # Table definitions
│   ├── index.ts     # Client export
│   └── migrate.ts   # Migration runner
└── drizzle.config.ts
```

## Common PostgreSQL Commands

```bash
# Push schema changes
pnpm -r db:push

# Generate migrations
pnpm -r db:generate

# Open Drizzle Studio
pnpm -r db:studio
```

Drizzle tracks PostgreSQL schema changes via the API package's migration
directory. The portfolio D1 database has a separate migration sequence in
the repository-root `migrations/` directory. Review and apply the migration
system for the database being changed; do not use Drizzle commands to update
D1.

See [Database Migrations](../development/migrations.md) for both workflows.
