# Database Migrations

## Workflow

1. Edit schema in `lib/db/src/schema.ts`
2. Generate migration: `pnpm -r db:generate`
3. Apply: `pnpm -r db:push`

## Schema Changes

Drizzle tracks schema changes via the migration directory. Always generate and review migrations before committing.
