# Phase 7 — Input, keyboard and composer behavior

> Keyboard covers ~half of 360×640. Everything must work in the remaining ~320px.

## Rules

- Layout resizes, never overlays: `meta interactive-widget=resizes-content`, `height: 100dvh`, `visualViewport` listeners for sheet/composer/suggestions.
- Composer: autosize ≤5 lines → inner scroll; attach+send ≥48px stay visible above keyboard; `inputmode=text|search`, `enterkeyhint=search/send/go`, `autocomplete`, `autocapitalize=sentences` (en) / off for code.
- Focus: autofocus only on explicit user tap (no keyboard ambush); `scrollIntoView({smooth})` +300ms delay after focus (Telegram convention); no jump/flicker — `position: sticky` composer, `overscroll-behavior: contain`.
- Suggestions/chips: above keyboard, horizontal scroll-snap, ≥48px targets, never hidden behind keyboard; sheet detents shrink (expanded 92% → visible-area 100%).
- Test matrix: 360×640 keyboard-open for GlobalSearch, CommandMenu, ChatPanel embed, Newsletter; closed+open screenshots required.

### Keyboard-open annotated states (to capture in build)
1. Search focused: field + results visible, no page h-scroll.
2. Chat composer: input + send + latest bubble visible.
3. Sheet + keyboard: sheet snaps to visible top, drag still works.

Effort S (attrs) → M (viewport wiring) / Impact 5 / low-med risk.
