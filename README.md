# Thoshan's Wiki

Personal editorial knowledge base for projects, systems, and technical notes.

## Featured project: FOSS Coin

The FOSS Coin article documents a self-created Solana SPL token, its fixed supply, authority revocation, Orca Whirlpool listing, public transactions, and independent verification links. The article keeps the original project capture GIF as a lazy-loaded, fullscreen-openable media asset.

Repository: [Foss-Token](https://github.com/lingadevaru-hp/Foss-Token)

## Technology

- React, TypeScript, Vite, and Wouter for the wiki interface
- JSON article data with generated search and article navigation
- CSS responsive layouts, dark-first theme, accessible controls, and reduced-motion support
- Browser Web Speech API for optional article reading
- Cloudflare Turnstile at the edge for a short-lived connection check; it is not an article-content feature and live verification happens in the Worker

## Local development

```bash
pnpm install
pnpm --filter @workspace/thoshan-wiki dev
```

The front-end is intentionally separate from backend verification and future Cloudflare-backed services.
