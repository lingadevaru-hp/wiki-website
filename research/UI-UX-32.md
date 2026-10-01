# 32 UI/UX Usability Upgrades — ordered, nothing optional

> Scope: BOTH apps. Portfolio = `artifacts/thoshan-wiki/`, chat = `thoshan-chat/src/worker.ts` (single file).
> Evidence: G = Gemini report (`research/gemini/`), P = our 10-phase research, R = REDESIGN_TODO, D = DESIGN_SYSTEM.
> Order = impact on phone users first. Each item: files → spec → evidence → Effort/Impact.

## Touch & press (do first — every tap)

1. **48×48dp primary targets everywhere** — chat `.iconBtn`/`#sendBtn`/chips (worker.ts), portfolio reader controls + palette rows + `30/35px` chips (index.css:1765,2472,3122). G: `--touch-target-min 48px` DOCUMENTED; M3. S/M · 5
2. **Press state = scale(0.97) + opacity 0.85 in 70ms, release 150ms spring** — replace chat-only-scale + portfolio-only-scale with one shared spec; desktop may add ripple, mobile never. G: press lifecycle table MEASURED (tweb ripple.ts, tt RippleEffect 700ms mousedown-only). S · 5
3. **`touch-action: manipulation` on all buttons/rows/chips** — kills 80–120ms tap delay (G §tactile). Audit both apps; portfolio has it on some rows only. S · 4
4. **48×48 hit area on sheet handles + icon-only controls** — handles are 32×4 visual inside 48px zone (G: M3 DOCUMENTED). Portfolio ChatPanel handle, chat drawer handle, audio seek thumb. S · 4
5. **No layout shift on press** — fixed bounding frames for icon morphs (send→stop), skeleton space reservation (G: Phase 4 async). Chat `#sendBtn`/`#stopBtn` swap, portfolio reader play/pause. S · 4

## Keyboard (highest impact — half the screen is gone)

6. **visualViewport as THE keyboard path, meta as enhancement** — chat `--kb` (done in stage-2 PR, verify on device); portfolio ChatPanel `--chat-kb` exists, GlobalSearch/CommandMenu/newsletter rely on meta only → add VV listener. G: tweb composer.ts + tt MiddleColumn MEASURED; WebKit Bug 259770. M · 5
7. **Composer autosize to 240px (15rem), then inner scroll** — chat `#inp` max-height:130px today → 240px per G MEASURED (tt Composer.module.scss); portfolio search/chat inputs same rule. S · 4
8. **Input/send/results visible above keyboard at 360×640, EN + KN** — test matrix: portfolio search, command menu, newsletter, chat panel; chat landing + thread composer. Screenshots to `research/after/`. No code, proof. M · 5
9. **Correct input attributes on every field** — `inputmode`/`enterkeyhint`/`autocomplete`/`autocapitalize` (done in stage-1 PRs, verify + extend to newsletter/auth/drawer search). S · 4
10. **Scroll-into-view +300ms on focus, no jump on close** — chat has it (stage-2); portfolio search/menu inputs need the same; `overscroll-behavior: contain` on sheets. S · 4

## Sheets, not fullscreen (the signature feel)

11. **Search + command + chat + pickers = bottom sheets ≤640px** — 20–28px top radius, 92dvh max, sheetUp 200ms ease-out (shipped stage-3 PRs, verify). G: detents 50/90dvh, scrim 32% DOCUMENTED (M3). Adopt 32% scrim (we use 45% — change it). S · 5
12. **Scrim 32% flat dim, no blur on sheets** — G DOCUMENTED (M3 32%); Mali-G52 drops to 25–40fps with blur. Portfolio `.global-search-backdrop blur(8px)` → flat on mobile; keep header blur only. S · 4
13. **Drag-to-dismiss: 30% height or 1000px/s velocity + rubber-band** — G MEASURED (tweb popupElement.ts). Portfolio ChatPanel has drag; extend to search/command sheets + chat drawer. Needs device tuning. M · 5
14. **Every sheet: tap-out + Android back + Esc + focus trap/restore + SR announce** — ChatPanel has all; audit search/command/newsletter/drawer for the same (R: focus restoration still open). M · 4
15. **Sheet entry 250ms decelerate, exit 200ms accelerate** — G MEASURED (tweb). Replace our 320/200 with 250/200 + `cubic-bezier(0.2,0,0.2,1)` in/out. S · 4

## Chat experience (chat first, portfolio where it matches)

16. **Optimistic send: clock → single ✓ → double ✓, red retry on fail** — G MEASURED (tt messages.ts). Chat has instant insert but no glyphs; portfolio ChatPanel inherits via iframe. M · 5
17. **Swipe-to-quote (48dp threshold + haptic tick) + long-press fallback (400ms/10px slop)** — G MEASURED (DrKLO ChatMessageCell, tweb fastClick.ts). WhatsApp users expect swipe. Both apps' bubbles. M · 5
18. **Scroll FAB: 40px circle, 80px offset, unread count, 150ms scale** — G MEASURED (tweb scrollDownButton.ts, >150px trigger). Chat `#jump` exists without count; add count + "new messages" pill. Portfolio article back-to-top same pattern. S · 4
19. **Streaming stability: `overflow-anchor: auto` + RAF-buffered 60fps flush** — G (Part 4). Chat `typeInto` scrolls manually; add anchor. Portfolio ChatPanel inherits. S · 4
20. **Suggestion chips: 34–36px h, 8px gap, scroll-snap row above composer, fade on first keystroke** — G MEASURED (Manus chips 36px/9999px/snap). Chat `.fchips` row done (stage-5); landing chips + portfolio category pills same. S · 4
21. **Inline error card below partial output + Retry/Edit, never raw errors** — G (Part 4: red 5% bg card). Chat fallback rotation exists; add Retry button. Portfolio newsletter/article errors same. S · 4
22. **Empty states: 18vh offset, 320px max, 48px icon, 20px headline, ONE action** — G (Part 4). Audit chat landing, portfolio search-empty, 404, history. S · 3

## Type & Kannada (EN + KN first, always)

23. **Noto Sans/Serif Kannada everywhere KN renders** — shipped stage-4 PRs (verify glyphs on device). G: U+0C80–U+0CFF subsets ~35–45KB DOCUMENTED. S · 5
24. **KN body 16px min, lh 1.65–1.80; never `anywhere`** — `break-word` + `word-break: normal` + `line-break: strict` (G: W3C/css-text-4 TRUE verdict). Fix chat `.bub overflow-wrap:anywhere` → keep `anywhere` ONLY for URLs/code, `break-word` for prose. S · 5
25. **No clipped tall glyphs: heading `padding-block: 0.12em`** — shipped wiki (verify); chat bubbles lh 1.65 already roomy (verify ottus). S · 3
26. **Chips/placeholders/buttons legible in KN at 360px** — explicit screenshot pass: search placeholder, chips, reader controls, composer (both apps). Proof, not code. S · 4

## Feedback & anticipation

27. **Toasts 3000ms + swipe-away, undo instead of confirm** — G MEASURED (both clients 3000ms). Chat clear-undo done (stage-5); portfolio newsletter/subscribe + bookmark same pattern. S · 4
28. **Loading: skeletons for lists/articles, spinner only past 300ms** — both apps have skeletons; add minimum-display guard so spinners never flash. S · 3
29. **Typing indicator + step progress for waits** — chat thinking phases exist; add Manus-style step list for multi-turn; portfolio reader "loading/generating" states same. M · 4

## Smoothness (low-end Android gate)

30. **Animate transform/opacity ONLY; kill layout-property anims** — audit both: chat `filter:brightness` hover ok (not anim); portfolio `translateY(-5px)` cards ok; remove any height/width/top anims. G: Mali/Adreno budget. S · 5
31. **Blur only on header; flat `rgba(248,248,247,0.98)`-equivalent elsewhere** — G MEASURED constraint. Portfolio search backdrop + command blur → flat on coarse pointers. S · 4
32. **Throttle gate before done: Slow 4G + 4× CPU, 360×800** — LCP/INP/CLS + dropped-frame count for sheet-open + send + theme-switch, EN + KN. Lighthouse via npx (available v13.5.0). Proof. M · 5

## Deferred to owner (needs your phone — logged, not dropped)

- 60fps clips of Manus app + Telegram (sheet, send, keyboard) to replace remaining `assumed` tokens.
- 22-theme contrast AA sign-off; bundle-split numbers; final merge order approval.
