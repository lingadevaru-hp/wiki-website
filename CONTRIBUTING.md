# Contributing

This is a personal project. Contributions are welcome via pull request.

## Setup

```bash
pnpm install
pnpm --filter @workspace/thoshan-wiki dev
```

## Code style

- TypeScript strict mode
- Prettier for formatting (`pnpm prettier --write .`)
- No ESLint configured
- CSS custom properties for design tokens (see `DESIGN_SYSTEM.md`)
- Sharp borders (`2px radius`) for Wikipedia-style aesthetic
- Translucent elevation surfaces, not drop shadows

## Workflow

1. Create a feature branch
2. Make changes
3. Run `pnpm typecheck` and `pnpm build`
4. Submit pull request

## Commit messages

Conventional commits preferred:

- `feat:` new feature
- `fix:` bug fix
- `refactor:` code restructuring
- `docs:` documentation only
- `chore:` maintenance tasks
