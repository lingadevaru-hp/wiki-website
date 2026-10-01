# Phase 10 — Synthesis, gap analysis and the v5.4 → v10.10 upgrade plan

> One-page exec summary: v10.10 keeps wiki's editorial soul + 22 theme flavors, but feels Manus-calm and Telegram-instant on a 360px phone: half-sheets instead of fullscreens, 48dp thumb targets, 120/200/320ms motion, keyboard-aware composer/search/chat, optimistic chat states, Noto Kannada at 16px/1.7, and Slow-4G smoothness. STOP — approve before any code.

## Gap analysis (en + kn first)

| # | Gap (now → v10.10) | Severity |
|---|---|---|
| 1 | ChatPanel coarse-sheet lacks true detents/drag/snap + keyboard resize | High |
| 2 | GlobalSearch/CommandMenu fullscreen on mobile → half-sheet 60% | High |
| 3 | Touch targets 34/44px → 48dp primary | High |
| 4 | Odd spacing steps (7/14/34/46) + missing thumb-zone map | Med |
| 5 | Kannada glyph clipping/line-height untested at 360px | High |
| 6 | No optimistic clock/checks + typing + scroll FAB in chat embed | Med |
| 7 | Focus restoration + SR names incomplete for modals | Med |
| 8 | Blur/glass cost unmeasured on low-end; no throttled benchmarks | High |
| 9 | `theme-color` per theme missing (white flash) | Low-Med |
| 10 | No `interactive-widget=resizes-content` + dvh + 300ms scroll-into-view | High |

## Design tokens → `tokens.json` (readable mirror)

Spacing 4-base/16-gutter/56-row; radii 2/10/12/13/18/24/999; motion 0/120/200/320/450 + easings (out `0.2,0,0,1`, in `0.4,0,1,1`, spring `0.2,0.9,0.2,1`, bounce `0.34,1.3,0.64,1`); elevation overlays; type Georgia/system/mono + Noto Kannada; color roles + `#f8f8f7`-like light per theme + `#e2ab52` audio; sheet 45/60/92% + scrim 45%.

## Roadmap

- **Quick wins (day):** attrs (`enterkeyhint` etc.), press `scale(0.96)`, exit-faster, 48dp upsizing, `theme-color`, skeleton/shimmer, undo, toast timing.
- **Core:** half-sheets + detents + drag + back/hash + focus trap; keyboard-aware dvh/viewport; Kannada fonts/sizes; optimistic chat; contrast AA; code-split + WebP + throttled benchmarks.
- **Signature:** "doesn't go fullscreen" sheets; Manus-single-prompt landing entry; agent-step progress; swipe/long-press quote; scroll FAB + unread pill.

## Adoption notes

- Adopt as principle: half-sheets, 120/200/320 motion, transform-only, optimistic, skeletons, 48dp, keyboard-resize.
- Adapt: palette/radii/type into 22 theme flavors + editorial voice; Telegram swipe → long-press-first (WhatsApp-trained users discover tap faster).
- Reject + why: `user-scalable=no` (a11y), GPL code paste (license), brand/logo/copy theft, fullscreen takeovers, ripple + blur-everywhere (perf).

## Version story (changelog-style)

**v10.10:** "Calm, packed-not-cramped, thumb-first. Sheets glide at 320ms and leave on back-tap. Search, menu and chat never steal the screen — even with the keyboard up. Kannada reads as polished as English. On Slow 4G it still feels instant."

## Approval gate

All 10 files + `tokens.json` + `TODO.md` + `evidence/` present. No project code touched. **Owner: approve + confirm target (`wiki-website`) to start implementation.**
