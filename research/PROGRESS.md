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
