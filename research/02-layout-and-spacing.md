# Phase 2 — Layout, spacing and the "packed but not cramped" feel

## Spacing scale (adopt)

| Token | Value | Use |
|---|---|---|
| base | 4px (`0.25rem`) | all multiples |
| xs/sm/md | 4 / 8 / 12 | icon gaps, chip padding |
| gutter-mobile | 16px @360px | page + card padding |
| section | 24 / 32 | card gaps, article blocks |
| row | 56–64px | list rows, palette rows |
| radius set | 10/12/13/18/24/999 | see Phase 5 |

Wiki today: 4,7,8,10,12,14,16,18,22,24,28,32,34,36,42,46,48,64,80,90,96,120 — normalize odd 7/14/34/46 out in v10.10.

### Packed-but-not-cramped (Manus principle, re-implemented)
- Where seen: Manus hero + Telegram chat list.
- Measured: content max-w ~720px mobile-full; gutters 16px; rows 56-64px; 5-7 rows visible per 800px viewport; truncation 1-2 lines + ellipsis.
- Why it works: 16px gutter + 12-16px card padding + 8px inter-row gives density without touch overlap.
- Adopt: gutter 16px@360 → 20px@390 → 24px@768; cards 16px padding; rows min-height 56px; chips single-row scroll-snap (not wrap) under prompt.
- Effort S / Impact 4 / low risk.

### Safe-area + no-h-scroll
- `env(safe-area-inset-*)` on header, sheets, composer; `overflow-x: clip` on body; `max-width:100vw` media; audit 320/360/375/390/412/768/1024/1440.
- Sticky: header blur `backdrop-filter` + z-50; article progress bar top 2px (`#0081f2`-like accent per theme, cf. Manus bprogress 2px); bottom bars only for sheet/composer, never persistent nav (already removed — keep).

### Thumb zone
- Primary in bottom 2/3 within thumb arc; send/attach bottom-right of composer; scroll FAB bottom-right above composer (Telegram); destructive never bottom-right; back via Android gesture/`#chat` hash for sheet.

Evidence: `evidence/manus-head.txt` (viewport, theme-color, nav/hero strings); screenshots to capture on real 360×800 device in build phase.
