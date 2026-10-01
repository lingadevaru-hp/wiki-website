# BLOCKERS

- Live LCP/INP/CLS + Slow-4G/4×CPU + 360px device screenshots (EN/KN, keyboard-open): no browser-automation or real-device harness in this environment. Tried: static analysis only. Need: owner 60fps clips (sheet open, message send, prompt+keyboard) +/or Lighthouse run on preview. Stages proceed with build-size/static proxy; values stay `assumed` until measured.
- Manus hero/chip exact CSS: tokenized via `var(--background-*/--border-*)`, no literals in fetched chunks — marked assumed-missing. Needs DevTools computed-style capture.
- `dist/` gzip bytes + production build numbers: not run yet (will run per-stage typecheck/build before PRs).

## Stages 2–6 deferred (needs owner device/tooling)
- Drag-to-dismiss velocity + detent snaps (both); swipe-to-quote; message state glyphs; unread-count pill.
- 360px EN/KN screenshots incl. keyboard-open; 22-theme contrast AA; throttled LCP/INP/CLS before/after.
- Stage branches are independent (all off main) — merge sequentially 1→6 per repo; later branches may need rebase.
