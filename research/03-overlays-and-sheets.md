# Phase 3 — Overlays: sheets, popups, menus

> Signature principle: things appear WITHOUT taking over the screen.

## Spec table

| Overlay | Detent | Radius/handle | Scrim | Dismiss | Entry/exit |
|---|---|---|---|---|---|
| Bottom sheet (chat/search/menu) | peek 45% / half 60% / expanded 92%; `max-w 480px` desktop centered | top radius 18-24px; handle 40×4px, neutral 30% | 40-50% black, no blur (perf) | drag down (velocity snap), tap-out, Android back (`#chat` hash), Esc desktop | in 320ms `ease-out`, out 200ms `ease-in`; content no separate anim |
| Popover/menu (theme/lang/context) | auto height, anchored to trigger | 12-13px radius | none (small) / 20% for modal menus | tap-out, Esc, selection | 200ms fade+`translateY(4px→0)` |
| Dialog (shortcuts/newsletter) | auto, max 90dvh | 18px | 50% | tap-out (non-destructive), explicit close | 320ms in / 200ms out |
| Toast | bottom above composer/keyboard | 12px pill | none | auto 3s + swipe | 200ms slide-up, spring-lite on arrive |
| Attach/context (Telegram analogue) | peek grid → expanded gallery+caption | same sheet | dim | tap-out | 2-detent drag |

## Findings (format)

### Half-sheet chat, not fullscreen
- Where: ChatPanel `≤900px` → bottom-sheet + Telegram attach sheet.
- Measured: 60% default, 92% expanded; handle 40×4; scrim ~45%.
- Why: keeps page context + thumb reach + keyboard room.
- Adopt: `--chat-w` drag + 60% collapse persist; coarse-sheet `visualViewport` resize; back/hash dismiss; focus restore to invoker; never-unmount keep.
- Effort M / Impact 5 / med risk.

### Tap-out + back always work
- Every sheet/menu closes on outside tap AND Android back AND Esc; focus trapped inside; body scroll locked; SR announces open/close (`chat.opened/closed` pattern exists — extend to all).
- Effort S / Impact 4 / low.

### Long-press → reaction-row → expandable grid (Telegram, adapted)
- TextSelectionCopy/long-press on article: quick row (copy/cite/share) → expand for more; 200ms ease, spring only on expand (`cubic-bezier(0.34,1.3,0.64,1)`).
- Effort M / Impact 4 / med.

### What we reject
- Fullscreen search/menu/chat on mobile; center modals for triage actions; blur-heavy scrims on low-end (use flat dim).
