# Phase 9 — Performance, accessibility and the engineering behind smoothness

## Performance (mid-range Android gate)

- Animate `transform/opacity` only; `will-change` sparingly + released; `content-visibility: auto` for long articles; virtualize lists >50 rows; blur/glass limited to header/sheet-top (main jank risk — flat dim fallback via `prefers-reduced-transparency` + low-end heuristic).
- Budgets: route JS ≤150KB gz (code-split palette/reader/viewer), fonts subset + swap, images WebP/AVIF + `srcset`, SW cache-first assets / network-first nav / API bypass (pattern exists in thoshan-chat — mirror).
- Measure throttled (Slow 4G + 4× CPU, 360×800): LCP <2.5s, INP <200ms, CLS <0.1, 0 long-tasks during sheet open/send; dropped-frame count for sheet + send + theme switch. Table theirs-vs-ours in build.

| Metric | Manus/Telegram bar | Wiki now | v10.10 target |
|---|---|---|---|
| LCP@4G | <2.5s | to measure | <2.5s |
| INP | <200ms | to measure | <200ms |
| CLS | <0.1 | to measure | <0.1 |
| Sheet 60fps | transform-only | to verify | 0 dropped clusters |

## Accessibility (≥48dp + full path)

- Touch ≥48×48dp primary (up from 34/44); `touch-action: manipulation` (no tap delay); `overscroll-behavior: contain`; visible `focus-visible` 2px ring; skip-link keep; dialogs focus trap + restoration (TODO open — close it); SR labels on all icon-only; `aria-live` for chat/toasts/progress; `prefers-reduced-motion` disables all; `prefers-contrast` + 200% zoom + pinch-zoom ALLOWED (reject `user-scalable=no`); contrast AA audit all themes + Kannada.

Touch/scroll: momentum native, no custom scrolljack; snap only for chip carousels.
