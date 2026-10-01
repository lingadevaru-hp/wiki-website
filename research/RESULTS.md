# RESULTS — measured vs not measured

## Measured (this environment)

### Bundle — BEFORE (main f3dd1d1) vs AFTER (integration)

| Chunk | Before | After |
|---|---|---|
| index (app) | 912.62 kB / 286.82 gzip | 467.82 kB / 140.41 gzip |
| vendor-react / radix / query / posthog | single bundle | 13 / 99 / 25 / 307 kB (5 / 33 / 8 / 101 gzip) |
| posthog isolated | — | 307 kB — next split candidate (lazy init) |

Method: `vite build` both commits (main via throwaway worktree). Status: MEASURED.

### Contrast — 22 themes accent-on-bg (static computation from SITE_THEMES HSL)

All ≥7.17 (AA needs 4.5). Lowest: catppuccin-latte + rose-pine 7.17. Highest: vantablack 18.42.
Method: node HSL→sRGB→WCAG ratio script. Status: MEASURED-static (rendered check still needs browser).

### Typecheck / build

`tsc --noEmit` clean; `vite build` passes (3–4s). Status: MEASURED.

## Not measured (no usable browser — Chromium hangs even on about:blank, incl. --version)

- LCP / INP / CLS, throttled or otherwise. No Lighthouse, no screenshots, no axe run.
- Dropped-frame counts, 360px EN/KN visual pass, keyboard-open states.
- These need: owner device pass (checklist in final report) or a working browser harness.
