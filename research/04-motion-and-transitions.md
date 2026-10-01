# Phase 4 — Motion, transitions and smoothness

## Motion tokens (adopt as CSS vars)

| Token | Value | Use |
|---|---|---|
| `--duration-instant` | 0ms | press scale |
| `--motion-fast` | 120-150ms | hover, tap feedback, toggles, tab switch |
| `--motion-base` | 200ms | menus, toasts, icon swap, exit anims |
| `--motion-slow` | 320ms | sheet/modal entrance |
| `--motion-page` | 450ms | route transitions (subtle fade only) |
| `--stagger-step` | 40ms | list/chip stagger (max 6 items) |
| `--ease-out` | `cubic-bezier(0.2,0,0,1)` | default in |
| `--ease-in` | `cubic-bezier(0.4,0,1,1)` | exits (faster) |
| `--spring-soft` | `cubic-bezier(0.2,0.9,0.2,1)` | sheet snap, send hop |
| `--bounce` | `cubic-bezier(0.34,1.3,0.64,1)` | expand-grid only |

Wiki already has 0/120/200/320/450 + same easings — keep names, add `--motion-*` aliases + document exit-faster rule.

## Catalog

- Press: `scale(0.96)` instant; hover lift `translateY(-1px)` desktop only.
- Sheet in 320ms ease-out / out 200ms ease-in (exit faster — strong convention Manus+Telegram).
- Toast 200ms `opacity/transform ease`; skeleton shimmer 1.5s infinite; loading overlay 300ms fade (Telegram Mini-Apps numbers, med confidence).
- Message send: optimistic insert + hop (transform only); typing dots; no layout anim.
- Page: fade 450ms or none; no slide on mobile (avoids jank + back-gesture conflict).
- `prefers-reduced-motion: reduce` → disable all (already in wiki — keep + test).

## What does NOT animate (restraint)

Content inside sheets, article body on scroll, theme switch (`.theme-transitioning` suppresses — keep), icon grids, dividers. Reason: motion reserved for state change + delight moments; everything else instant = calm + fast on 4×CPU.

Evidence: Manus bprogress 2px `#0081f2`, spinner 400ms linear; Telegram "transform/opacity only, 150-300ms" guidance. Frame-verify on device in build.
