# Wrangler Configuration

## Portfolio website Worker

The production website Worker is configured in the repository-root
`wrangler.jsonc`:

```jsonc
{
  "name": "wiki-website",
  "main": "src/worker.ts",
  "compatibility_date": "2025-03-01"
}
```

The config also binds the built SPA as `ASSETS`, the newsletter database as
`DB` (`wiki-newsletter`), and Cloudflare AI as `AI`. The D1 database ID and
asset directory are declared there; check the config before deploying rather
than creating replacement resources.

Use project-local Wrangler:

```bash
pnpm exec wrangler deploy --dry-run
pnpm exec wrangler deploy
```

`artifacts/api-server/wrangler.jsonc` is separate and does not configure the
portfolio Worker.
