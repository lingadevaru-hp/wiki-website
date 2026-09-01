# Troubleshooting

## Common Issues

### Port already in use

```bash
# Kill process on port 5173
lsof -ti:5173 | xargs kill -9
```

### Database connection failed

Check that PostgreSQL is running and `DATABASE_URL` is correct.

### Type errors after pull

```bash
pnpm install
pnpm run typecheck
```

### Build fails

Check Node.js version (v20+) and that all dependencies are installed.
