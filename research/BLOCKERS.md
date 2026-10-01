# BLOCKERS

- Live LCP/INP/CLS + Slow-4G/4×CPU + 360px device screenshots (EN/KN, keyboard-open): no browser-automation or real-device harness in this environment. Tried: static analysis only. Need: owner 60fps clips (sheet open, message send, prompt+keyboard) +/or Lighthouse run on preview. Stages proceed with build-size/static proxy; values stay `assumed` until measured.
- Manus hero/chip exact CSS: tokenized via `var(--background-*/--border-*)`, no literals in fetched chunks — marked assumed-missing. Needs DevTools computed-style capture.
- `dist/` gzip bytes + production build numbers: not run yet (will run per-stage typecheck/build before PRs).
