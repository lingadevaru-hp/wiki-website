# Phase 1 — Recon and information architecture

> Target: wiki-website. Refs: Manus (web `manus.im` verified 01-10-2026) ~70%, Telegram (Web K/A + Android) ~30%. Evidence: `evidence/` + measured head values below.

## Manus — measured facts (verified, not guessed)

- `title` "Manus: Hands On AI"; `viewport` `width=device-width, initial-scale=1, user-scalable=no` (NOTE: we record but REJECT — blocks zoom).
- `theme-color` `#f8f8f7` (warm off-white, not pure white); `og:image 1028×538`; `apple-itunes-app app-id=6740909540`; Next.js+Turbopack via `files.manuscdn.com`, Plausible analytics.
- Nav: logo + Features, Solutions, Resources, Events (`events.manus.im`), Team (`/team`), Pricing (`/pricing`), Sign in/up (DOM duplicated → desktop+mobile header hypothesis).
- Hero: eyebrow pill "Introducing Manus 2.0" → H1 "What can I do for you?" → chips [Create slides, Build website, Create games(New), Video(New), Design, More] (DOM duplicated → scroll-carousel hypothesis) → H2 "Less structure, more intelligence."
- Footer: Product/Resources/Community/Compare/Download (mobile via `manus.go.link`, Desktop, My Browser)/Team/Company + ©2026 + 6 socials + English selector.
- App (store consensus, med confidence): Projects (Instructions/Files/Skills + connectors + scheduled tasks), Chat vs Agent Mode, async cloud run + notify, stop/edit mid-task. Reviews: clean minimal chat (4.6★) but generic outputs without redesign; credit/support complaints.
- Core loop: ask → agent works (visible plan/progress) → result + share. Optimized: single entry, visible work, async-notify for waits.

## Telegram — structure (technique, GPL-noted)

- Licenses: Web K `morethanwords/tweb` GPL-3.0; Web A `Ajaxy/telegram-tt` GPL-3.0; Android `DrKLO/Telegram` GPL-2.0-or-later. Read-only; re-implement.
- Web K: Webogram-descended SPA + Vite + SW/PWA + IndexedDB snapshots. Web A: contest winner, near-zero-deps custom Teact + GramJS, WS/workers/WASM, optimistic UI.
- Core loop: open chat → read → reply. Optimized: list triage (swipe pin/mute/archive), instant composer, optimistic send.
- Screens: chat list (folders, stories pull-down), chat view, media viewer, settings, attach sheet, emoji/sticker keyboard, toasts, scroll FAB.

## wiki-website — screen inventory (from DESIGN_SYSTEM + REDESIGN_TODO + src)

| # | Screen/file | Route | Core job |
|---|---|---|---|
| 1 | LandingPage | `/` | identity, Start Reading, Search, starfield |
| 2 | HomePage | `/wiki/home` | featured, recent grid, category tabs |
| 3 | ArticlesPage/Collections | `/wiki /projects /news /collections` | index + filter |
| 4 | ArticlePage | `/wiki/:slug` | TOC, progress %, action row, infobox, Read Next, prev/next |
| 5 | SearchPage | `/search` | full-text + skeleton/empty |
| 6 | NotFoundPage | `404` | recovery |
| 7 | Overlays | global | WikiHeader(z-50 blur), CommandMenu, GlobalSearch, ShortcutsModal, LanguageSwitcher, ThemePicker(22), MediaViewer, TOC, AudioReader(+mini pill), ChatPanel (iframe `chat.lingadevaru.in?embed=1`, never-unmount, theme-sync postMessage, resizable, `<1100px` collapse, `≤900px` bottom-sheet + `#chat` hash), TextSelectionCopy, Newsletter, SEO |
| 8 | i18n | `*.lingadevaru.in` | 8 locales en/kn/hi/ja/ml/ta/te/gu, `t(key)` + en fallback, NEW-TAB locale switch |

Taps to key actions (target ≤2): search 1 (`/` or `Ctrl+K`), chat 1, article→Read Next 1, theme 2, language 2 (new tab — keep, low frequency).

## What is absent (deliberate)

- Manus: no chrome beyond prompt+chips on hero; no feature grid. Telegram: no landing marketing in app. Wiki to mirror: landing keeps one CTA + search; no bottom-nav (already removed); no AI chat in wiki yet (TODO #63 deferred — ChatPanel embed is the bridge).

## Gaps / confidence

- No login-walled Manus app screens accessed; app claims med confidence from store/reviews. Telegram timings from Mini-Apps docs + audits, not source constants — med confidence. All flagged inline in later phases.
