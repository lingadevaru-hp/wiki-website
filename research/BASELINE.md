# BASELINE — 360px EN/KN, before v10.10 (Part A)

> Static baseline 01-10-2026. Live LCP/INP/CLS + device screenshots still require browser/throttled phone — logged in BLOCKERS.md.

## Wiki (`artifacts/thoshan-wiki`)

- Viewport: `width=device-width, initial-scale=1.0, maximum-scale=5, interactive-widget=resizes-content` — zoom ALLOWED (good, keep). Gap: mostly `100vh`, one `100dvh` fallback — needs dvh migration.
- Keyboard: `ChatPanel visualViewport.resize → --chat-kb` + scroll-lock exists; `App` re-centers focused input on narrow screens. `enterKeyHint="go"` on CommandMenu; GlobalSearch has aria-autocomplete.
- Kannada: NO Kannada webfont (system fallback); `html lang="en"` + per-span `lang={code}`; hreflang en/kn/hi/ja/ml/ta/te/gu + x-default. Needs Noto Sans/Serif Kannada + clipping test at 360px.
- Theme-color: static `#0d1117` + dynamic `paintChrome()` sampling on scroll/resize — keep pattern, extend per-theme.
- Touch: base 44px, mobile 48px, sheet handle 54px; counter-examples 30/35px chips — audit to 48dp.
- Perf proxy: heavy deps (Radix ×20, framer-motion, recharts, embla, query, posthog, tailwind) + Google fonts + poster/mp4 preloads; NO manualChunks/visualizer; NO lighthouse/web-vitals config. Expect large JS — verify with production build + `du -sh dist`.
- Chat embed: iframe `chat.lingadevaru.in?embed=1`, never-unmount, postMessage theme sync, detents 0.6/0.9vh + drag handle + backdrop.

## Chat (`thoshan-chat/src/worker.ts` single file)

- Viewport: `width=device-width,initial-scale=1,viewport-fit=cover` — NO interactive-widget, NO maximum-scale. CSS all `100dvh` no fallback. NO visualViewport listener, NO --kb var, static footer composer.
- Composer: `#inp rows=1`, placeholder only; MISSING inputmode/enterkeyhint/autocomplete/autocapitalize. Voice `lang en-IN` ok.
- Sheets: none — left drawer 288px + right settings + popover menus; no detents/drag.
- Kannada/lang: `lang="en"` only, Inter+Newsreader+Caveat, no KN stack.
- Theme-color: static `#12121f` + `paintMeta()` on theme change; `color-scheme:dark`.
- Touch: `.iconBtn 38px`, `#sendBtn 42px` (<48 — fix in Stage 1); states present (Ready/Thinking/typing/Offline, thinking phases, typing dots, streaming+caret, stop, #jump, chips, copy, TTS, voice spinner, 403 reload, fallbacks). No skeleton.
- Weight: no bundler (inline HTML_UI), deps agents@0.11 + voice — light by construction. NO build/typecheck/test/lighthouse scripts.

## Baseline screenshots (to capture with device)

`research/baseline/` — 360×800 EN + KN: landing, home, article, search-closed/open, keyboard-open (search + chat), sheet states. Before/after table per stage goes in PROGRESS.md + PR bodies.
