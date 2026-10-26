# Database Migrations

The repository has separate migration workflows for the legacy PostgreSQL
API and the production portfolio's Cloudflare D1 database. Use the workflow
that matches the database being changed.

## PostgreSQL (legacy API)

1. Edit schema in `lib/db/src/schema.ts`
2. Generate migration: `pnpm -r db:generate`
3. Apply: `pnpm -r db:push`

Drizzle tracks PostgreSQL schema changes via its migration directory. Always
generate and review migrations before committing.

## Cloudflare D1 (portfolio/newsletter)

D1 migrations are top-level SQL files in the repository-root `migrations/`
directory and are applied with the project-local Wrangler version. For a
production deployment:

1. Add and test a numbered migration, keeping it additive when possible.
2. Check the target in the root `wrangler.jsonc`; the production database is
   `wiki-newsletter`, bound as `DB`.
3. After the code PR is merged, apply migrations before deploying code that
   depends on them:

   ```bash
   pnpm exec wrangler d1 migrations list wiki-newsletter --remote
   pnpm exec wrangler d1 migrations apply wiki-newsletter --remote
   pnpm exec wrangler d1 migrations list wiki-newsletter --remote
   ```

Wrangler records applied migrations in D1. `--remote` targets production;
omit it only when intentionally applying against the local development
database. Follow the confirmation prompt and review the database name before
applying.

The email-change confirmation table was added by
`0003_newsletter_email_change_confirmation.sql`. It stores only the token
hash and pending change data, not the raw token. See
[Newsletter email-change confirmation](newsletter-email-changes.md).
