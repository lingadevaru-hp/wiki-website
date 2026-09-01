# Cloudflare Workers Deployment

## Setup

```bash
# Install Wrangler
npm install -g wrangler

# Login
wrangler login
```

## Deploy API Server

```bash
cd artifacts/api-server
wrangler deploy
```

## Deploy TTS Worker

```bash
cd article-tts
wrangler deploy
```

## Environment Secrets

```bash
wrangler secret put DATABASE_URL
```
