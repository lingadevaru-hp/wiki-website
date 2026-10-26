# Production Checklist

Before deploying to production:

- [ ] All environment variables set
- [ ] Database migrations applied
- [ ] For D1 schema changes, confirm the remote database name and migration
      status; apply required migrations before deploying dependent Worker code
- [ ] `pnpm run build` passes
- [ ] Type checking clean
- [ ] `pnpm exec wrangler deploy --dry-run` passes for Worker changes
- [ ] No console errors in browser
- [ ] API endpoints tested
- [ ] Article content verified
- [ ] Wrangler secrets configured
- [ ] Merge the change through a PR to the private `wiki-website` repository
- [ ] Verify production site and changed routes after deployment
