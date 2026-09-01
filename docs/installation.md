# Installation

## Clone & Install

```bash
git clone https://github.com/lingadevaru-hp/wiki-website.git
cd wiki-website
pnpm install
```

## Environment Setup

Copy the example env file and configure:

```bash
cp .env.example .env
```

See [Environment Variables](development/env.md) for details.

## Database Setup

```bash
# Run migrations
pnpm -r db:push
```

## Verify

```bash
pnpm run build
```
