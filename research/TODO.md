# Research TODO — v5.4 → v10.10 Mobile UI/UX (wiki-website target)

> Target: `wiki-website` (English + Kannada first). Refs: Manus ~70%, Telegram ~30%.
> Rules: research only until Phase 10 approval. Copy behavior, not brand. Telegram GPL — re-implement, don't paste. Reject `user-scalable=no`.
> Format: `[ ]` open / `[x]` done. Never delete rejected items.

## 🔴 Must-do

- [ ] [P3] ChatPanel mobile → true bottom-sheet with detents (peek 45% / half 60% / expanded 92%), drag handle 40×4px, scrim 40-50%, Android back dismisses — Effort M / Impact 5
- [ ] [P7] Keyboard-aware layout: `interactive-widget=resizes-content` + `dvh` + `visualViewport` resize for search/command palette/chat/composer — S / 5
- [ ] [P7] Composer/search attributes: `inputmode`, `enterkeyhint=search/send`, `autocomplete`, autocapitalize, scroll-into-view +300ms — S / 5
- [ ] [P4] Motion tokens adopt: fast 120-150ms, base 200ms, slow 320ms, page 450ms; `ease-out cubic-bezier(0.2,0,0,1)`; exit faster than entry — S / 5
- [ ] [P5] Touch targets → ≥48×48dp primary (reader controls, palette rows, chips, send/attach) — S / 5
- [ ] [P9] Animate only `transform/opacity`; audit `will-change`, `content-visibility`, list virtualization — M / 5
- [ ] [P9] Throttled test: Slow 4G + 4× CPU, LCP/INP/CLS on 360×800 before/after — M / 5
- [ ] [P6] Kannada mobile type: Noto Sans Kannada / Noto Serif Kannada, min 16px body, lh ≥1.7, no clipping, mixed en-kn wrapping — S / 5
- [ ] [P2] 360px no-h-scroll guarantee + safe-area (`env(safe-area-inset-*)`) on header/bottom-sheet/composer — S / 5
- [ ] [P10] Per-theme flavor mapping for all 22 themes (not flattening) — M / 5

## 🟠 High-value

- [ ] [P1] IA: single prompt/search entry on landing + home; 2-tap reach to search/chat/article — S / 4
- [ ] [P2] Spacing scale lock to 4px base; content gutter 16px@360px, card padding 16px, row height 56-64px — S / 4
- [ ] [P3] GlobalSearch/CommandMenu as half-sheet on mobile (not fullscreen), max-w 480px on desktop — M / 4
- [ ] [P3] Long-press context (copy/cite/share) + swipe-reply analogue for quotes; focus trap + scroll lock + SR announce — M / 4
- [ ] [P5] Radius scale lock: 10 icon-btn / 12 controls / 13 search / 18 cards / 24 reader / 999 pills; squircle approx via large radii — S / 4
- [ ] [P5] Press states: `scale(0.96)` instant + opacity; no ripple (Manus/Telegram-web convention) — S / 4
- [ ] [P8] Optimistic send + clock/checks in ChatPanel; typing dots; scroll FAB with unread count + "new messages" pill — M / 4
- [ ] [P8] Agent-task progress pattern (Manus): plan → steps → partial results → share/retry; skeletons for articles, spinners only for 300ms+ waits — M / 4
- [ ] [P6] Calm color: neutrals ≥90%, one accent; contrast AA check all 22 themes — M / 4
- [ ] [P9] Fonts: subset + `font-display:swap`, WebP/AVIF hero, code-split palette/reader — S / 4

## 🟡 Nice-to-have

- [ ] [P5] Icon stroke audit: 1.75-2px outline @24px grid, active filled vs inactive outline — S / 3
- [ ] [P4] Spring only for delight (send hop, sheet snap `cubic-bezier(0.2,0.9,0.2,1)` / bounce `(0.34,1.3,0.64,1)`); list stagger 40ms — S / 3
- [ ] [P8] Undo instead of confirm (clear chat, newsletter); haptics on send/sheet-snap only, no sound by default — S / 3
- [ ] [P2] Thumb-zone map: primary in bottom 2/3, destructive never bottom-right — S / 3
- [ ] [P6] Theme-color meta per theme (like Manus `#f8f8f7`) to avoid white flash — S / 3

## ⚪ Rejected (with reason)

- [ ] `user-scalable=no` (Manus uses it) — REJECT: blocks pinch-zoom, WCAG failure. We use `maximum-scale=5`, test 200% zoom.
- [ ] Copying Manus/Telegram logos, illustrations, copy, proprietary icons/code — REJECT: identity/license. Re-implement from measured specs.
- [ ] Pasting Telegram GPL code (Web K GPL-3.0, Web A GPL-3.0, Android GPL-2.0-or-later) — REJECT: copyleft. Read for technique only.
- [ ] Fullscreen takeovers for search/menu/chat on mobile — REJECT: breaks "doesn't go full screen" principle + keyboard space.

## Phase log

- [x] Phase 1 — recon + IA. Key: Manus single-prompt loop vs Telegram triage loop; wiki has 8 screens + 20 overlays. Items +4. Surprise: wiki ChatPanel already never-unmounts + theme-syncs — keep. Next: Phase 2.
- [x] Phase 2 — density. Key: 4px base, 16px gutters@360px, 56-64px rows = "packed not cramped". Items +4. Surprise: 7px/14px odd steps in wiki scale — normalize. Next: Phase 3.
- [x] Phase 3 — overlays. Key: half-sheet 60% + scrim 40-50% + drag is the signature. Items +4. Surprise: Telegram peek→expand 2-detent sheet maps directly to ChatPanel. Next: Phase 4.
- [x] Phase 4 — motion. Key: 120/200/320/450ms + ease-out; exit faster; transform/opacity only. Items +3. Surprise: restraint (what doesn't animate) matters more. Next: Phase 5.
- [x] Phase 5 — micro-details. Key: radius + press `scale(0.96)` + 48dp = feel. Items +4. Surprise: squircle ≈ big radius + border, cheap in CSS. Next: Phase 6.
- [x] Phase 6 — type/color/kn. Key: calm neutrals + per-theme flavor + Noto Kannada 16px/1.7. Items +3. Surprise: 22 themes already — mapping, not flattening, is the work. Next: Phase 7.
- [x] Phase 7 — keyboard. Key: `resizes-content` + dvh + 360×640 test. Items +3. Surprise: 300ms scroll-into-view delay is the Telegram convention. Next: Phase 8.
- [x] Phase 8 — feedback. Key: optimistic + progress + undo. Items +3. Surprise: Manus async-notify fits patchy 4G perfectly. Next: Phase 9.
- [x] Phase 9 — perf/a11y. Key: Slow-4G + 4×CPU gate; 48dp + reduced-motion path. Items +3. Surprise: blur/glass is the main jank risk on low-end. Next: Phase 10.
- [x] Phase 10 — synthesis. Tokens + roadmap + v10.10 story done. STOPPING for approval. No code touched.
