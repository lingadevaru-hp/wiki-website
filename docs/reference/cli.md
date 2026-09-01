# CLI Commands

## Root Scripts

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start all dev servers |
| `pnpm build` | Typecheck + build all |
| `pnpm run typecheck` | Typecheck only |
| `pnpm run book:build` | Build HonKit documentation |
| `pnpm run book:serve` | Serve HonKit documentation |

## Per-Package

```bash
# Database
pnpm -r db:push
pnpm -r db:generate
pnpm -r db:studio

# Individual package build
pnpm --filter thoshan-wiki build
pnpm --filter api-server build
```
