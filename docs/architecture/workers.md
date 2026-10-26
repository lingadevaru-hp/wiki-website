# Workers & Queues

## Cloudflare Workers

The production portfolio Worker is `wiki-website`, configured by the root
`wrangler.jsonc` with `src/worker.ts` as its entry point. It serves the
`artifacts/thoshan-wiki/dist` assets, handles the site's API routes, and uses
the `DB` binding for D1-backed newsletter data. Newsletter messages, including
email-change confirmation links, use the configured Zoho SMTP account.

`artifacts/api-server/wrangler.jsonc` is a separate deployment configuration;
it is not the production portfolio Worker. See
[Cloudflare Workers deployment](../deployment/workers.md).

## Article TTS Worker

`article-tts/` contains a worker that processes text-to-speech requests for
articles.

## Queues

Queues are used for background job processing where configured. Newsletter
welcome-email retry/backfill is handled by the GitHub Actions workflow and
the legacy Node email sender, not by a Cloudflare Queue.
