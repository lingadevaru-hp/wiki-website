# Wrangler Configuration

## API Server

See `artifacts/api-server/wrangler.jsonc`:

```jsonc
{
  "name": "wiki-api",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01"
}
```

## Key Settings

- `name` — Worker name on Cloudflare
- `main` — Entry point
- `compatibility_date` — Runtime compatibility
- `kv_namespaces` — KV bindings (if used)
- `d1_databases` — D1 database bindings
