# PROGRESS

## Part A — research fixes (done 01-10-2026)
- Corrected 6 errors (ripple, swipe, 150ms page, VV primary, break-word, tokens junk removal). Real Telegram values extracted (durations/easings/radii/composer/toast/ripple with file refs). Manus CSS values extracted (radii, beziers, durations, keyframes, colors). tokens.json re-tagged measured/documented/assumed. BASELINE.md + DECISIONS.md + BLOCKERS.md created. Branch: `docs/research-part-a` → PR (research only, no code).

## Stages (all: branch → PR to private repo, no merge/deploy)
- [ ] Stage 1 quick wins (both)
- [ ] Stage 2 keyboard-aware (both)
- [ ] Stage 3 half-sheets (both)
- [ ] Stage 4 Kannada type (both)
- [ ] Stage 5 agentic chat (chat first → portfolio)
- [ ] Stage 6 themes+perf+a11y + CROSS-APPLY.md + final report

## Stage 1 — quick wins (done 01-10-2026, PRs open, NOT merged/deployed)
- Chat (`thoshan-ai` PR #56, branch feat/stage-1-quick-wins): viewport maximum-scale=5, composer/search input attrs, 44px base + 48px coarse targets, scale(.96) press, touch-action manipulation. Pre-existing tsc errors unchanged on HEAD.
- Portfolio (`wiki-website` PR #92, branch feat/stage-1-quick-wins): GlobalSearch/CommandMenu input attrs, --duration-page 150ms, --ease-in standard. tsc clean.
- Before/after numbers: device LCP/INP/CLS still blocked (no harness) — PRs record static deltas only.

## Stages 2–6 (done 01-10-2026, PRs open, NOT merged/deployed)
- Stage 2: chat PR #57 (visualViewport --kb + focus scroll + 100vh fallbacks); wiki PR #93 (dvh fallbacks on command/search/audio panels).
- Stage 3: chat PR #58 (settings drawer → mobile bottom sheet, CSS-only); wiki PR #94 (search + command → bottom sheets <=640px + sheetUp keyframes). Drag velocity/detent snaps deferred (needs device).
- Stage 4: wiki PR #95 (Noto Sans/Serif Kannada + :lang(kn) rules); chat PR #59 (Noto fallback stack). KN screenshots deferred.
- Stage 5: chat PR #60 (follow-up chips scroll-row + clear-chat 5s Undo). Portfolio: verified pre-existing (skeletons, role=alert, ErrorBoundary) — no PR.
- Stage 6: wiki PR #96 + chat PR #61 (content-visibility on lists). Contrast AA audit + measured LCP/INP/CLS deferred.
- CROSS-APPLY.md added. Independent stage branches — merge in order 1→6 per repo to avoid adjacent-line conflicts.

## Deploy (01-10-2026, owner said go)
- Portfolio PR #97 MERGED to main; rebuilt from main; `wrangler deploy` OK (Version e68a79a3). Verified: workers.dev 200, lingadevaru.in 200, sheetUp + Noto markers in served assets.
- Chat PRs #62 (worker) + #63 (live pilot UI) MERGED; `catalyst deploy` OK (functions + Slate). Verified: chat.lingadevaru.in 200 with new markers; API "hi"->greeting, gibberish->graceful error fallback.
- Key find: live chat serves catalyst-pilot/thoshan-chat-ui (not src/worker.ts) — upgrades ported to the live file (PR #63).
- Pre-existing notes: AI backend unreachable for long-tail (RAG endpoint; graceful, untouched functions); Chromium unusable here (no Lighthouse/screenshots/axe).
