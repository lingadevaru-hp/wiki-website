# TODO — v5.4 → v10.10 (both apps) — upgraded with Gemini Deep Research

> Sources: G = `research/gemini/Gemini-Deep-Research-MANUS-TELEGRAM-ORIGINAL.md` (MEASURED/DOCUMENTED),
> P = our 10-phase research, U = `research/UI-UX-32.md` (the 32 ordered upgrades).
> Confidence: `measured` > `documented` > `reported` > `assumed`. Nothing optional — all 32 are must-do, ordered by phone-user impact.
> `[ ]` open / `[x]` done. Rejected items kept with reason, never deleted.

## Adopted Gemini corrections (replaces our assumed values)

- [x] Press: `scale(0.97)` + opacity 0.85, 70ms down / 150ms spring release (was 0.96) — G MEASURED
- [x] Sheet: enter 250ms decelerate / exit 200ms accelerate, scrim **32%** (was 45%), handle **32×4** in 48px zone, top radius 28px (was 20px), detents 50/90dvh — G DOCUMENTED/MEASURED
- [x] Ease: standard `cubic-bezier(0.2,0,0.2,1)` (was 0.2,0,0,1); decelerate `(0,0,0.2,1)`; accelerate `(0.4,0,1,1)`; spring `(0.34,1.56,0.64,1)` — G MEASURED
- [x] Page fade: 300ms DOCUMENTED (M3 medium) — our 150ms was too fast, Manus .15s was one data point; use 200–300ms
- [x] Chips: 34–36px h, 0 16px/12px pad, 9999px, snap-row, fade on first keystroke — G MEASURED (Manus)
- [x] Composer: max 240px/15rem then inner scroll; input 36px min, 15px/1.4 — G MEASURED (tt)
- [x] Swipe-to-reply 48dp + haptic tick; long-press 400ms + 10px slop — G MEASURED (DrKLO/tweb)
- [x] Scroll FAB 40px circle, 80px offset, >150px trigger, 150ms scale — G MEASURED (tweb)
- [x] Dismiss: 30% height OR velocity >1000px/s + rubber-band — G MEASURED (tweb popupElement.ts)
- [x] Keyboard: VV primary + meta enhancement (both agree); `--kb-inset` naming adopted — G MEASURED
- [x] Kannada: `break-word` + `word-break:normal` + `line-break:strict`, lh 1.65–1.80, 16px min, 0.01em spacing — G (W3C css-text-4)
- [x] `user-scalable=no`: rejected everywhere (Safari ignores it anyway since iOS 10) — G FALSE verdict; use `touch-action:manipulation`
- [x] Ripple: Telegram HAS ripple (native + web custom), Manus has NONE (scale 0.98 + bg shift) — G TRUE/TRUE verdicts; we follow Manus on mobile (compositor-only), ripple desktop-only like tt
- [x] Blur: replace live `blur()` with opaque `rgba(248,248,247,0.98)`-per-theme on low-end — G MEASURED constraint
- [x] Budgets: JS <120KB gzip, animate transform/opacity only — G DOCUMENTED

## The 32 (U) — status

- [x] U1–U5 press/targets — in stages (#56/#92 + follow-ups); remaining: 0.97/70ms retune, handle zones
- [x] U6–U10 keyboard — in stages (#57/#93); remaining: 240px composer, VV for search/menu/newsletter
- [ ] U11–U15 sheets — in stages (#58/#94); remaining: 250/200 + 32% scrim + 28px radius + drag physics
- [ ] U16–U22 chat — #60 + pre-existing; remaining: state glyphs, swipe-quote, FAB count, error cards, empty-state spec, code/table blocks
- [x] U23–U26 Kannada — in stages (#59/#95); remaining: strict line-break rules, URL/code `anywhere` exception
- [ ] U27–U29 feedback — #60 + pre-existing; remaining: 3000ms toasts, spinner-300ms guard, step progress
- [ ] U30–U32 smoothness — #61/#96; remaining: transform-only audit, blur flattening, Lighthouse gate

## Rejected (kept, with reason)

- [ ] `user-scalable=no` — REJECT: WCAG 1.4.4 failure; Safari ignores it; use maximum-scale=5 + manipulation
- [ ] Pasting Telegram GPL code — REJECT: copyleft; re-implement from values
- [ ] Copying Manus/Telegram brand, copy, icons, illustrations — REJECT: identity
- [ ] Fullscreen takeovers on mobile — REJECT: breaks sheet principle
- [ ] Heavy DOM ripples on mobile — REJECT: frame drops on low-end (G); desktop-only like tt
- [ ] `overflow-wrap:anywhere` on prose — REJECT: splits KN conjuncts (G TRUE verdict); prose = break-word
- [ ] 450ms page fade — REJECT: M3 says ≤300–400ms; use 200–300ms

## Parked (Phase 0B — do NOT build in this mission)

- [ ] Cloudflare TTS provider + audio cache strategy + exact-duration seeking (needs owner design approval; interface `src/lib/tts-provider.ts` ready, browser fallback wired)
- [ ] Optional AI article chat in portfolio (chat-panel embed covers it)
- [ ] Related-article graph, Markdown/JSON export, offline cache, installable PWA, reading history, per-article notes
- [ ] Production asset compression + cache headers (documented recommendation only — deploy config out of scope)
