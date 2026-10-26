# Testing

## Run All Checks

```bash
pnpm run build  # typecheck + build
```

## Type Checking

```bash
pnpm run typecheck
```

## Worker security tests

```bash
node --test src/security.test.mjs
pnpm exec wrangler deploy --dry-run
```

The security tests cover safe return paths, HTML escaping, email-change token
hashing, signed verification cookies, and CSP policy behavior. The Wrangler
dry run checks Worker bundling and configured bindings without deploying.

## Linting

Check `.editorconfig` for code style rules. The project uses Prettier for formatting:

```bash
npx prettier --check .
```
