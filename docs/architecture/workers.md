# Workers & Queues

## Cloudflare Workers

The API server deploys as a Cloudflare Worker. See `artifacts/api-server/wrangler.jsonc` for configuration.

## Article TTS Worker

`article-tts/` contains a worker that processes text-to-speech requests for articles.

## Queues

Used for background job processing (TTS generation, content indexing, etc.).
