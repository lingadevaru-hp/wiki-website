# Troubleshooting

## Common Issues

### Port already in use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database connection failed

For the legacy Express API, check that PostgreSQL is running and
`DATABASE_URL` is correct. The portfolio Worker's default newsletter path
uses D1 instead; check the D1 binding in the root `wrangler.jsonc` and use
`pnpm exec wrangler d1 migrations list wiki-newsletter --remote` to inspect
production migration status.

### Type errors after pull

```bash
pnpm install
pnpm run typecheck
```

### Build fails

Check Node.js version (v20+) and that all dependencies are installed.
