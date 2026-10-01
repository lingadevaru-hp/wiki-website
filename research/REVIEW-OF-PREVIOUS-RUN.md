# REVIEW OF PREVIOUS RUN (lightweight-model stages #92–#96)

> Integration branch: `upgrade/v10-integration`. All merges applied cleanly; tsc + build pass.

## Verdict per stage PR

- #92 quick wins: GOOD. Input attrs present (GlobalSearch:201-214, CommandMenu:239-250). BUT `--duration-page:150ms` was too aggressive — Gemini/M3 says 300ms. Fix in this branch.
- #93 keyboard dvh: GOOD. Pure fallbacks, zero risk. ChatPanel `--chat-kb` VV path pre-existed — confirmed in ChatPanel.tsx.
- #94 half-sheets: GOOD but incomplete. Sheets lack drag physics, 32% scrim (we kept darker), 28px radius (we used 20px), handle affordance. Fixed below where safe; drag needs device.
- #95 Kannada: GOOD. Fonts + :lang rules present. Missing `word-break:normal; line-break:strict` (W3C) — added below.
- #96 perf: WEAK but harmless. One `content-visibility` line; no measurements. Real work (bundle split, blur audit) done below.
- #91 research: SUPERSEDED by `research/v10-combined` + COMBINED-RESEARCH.md + new tokens.json.

## Bugs / half-finished found

1. `--ease-in: (0.4,0,1,1)` is NOT the Material standard — correct is `(0.4,0,0.2,1)`. (Stage-1 PR claimed "standard" wrongly.) Fixed.
2. `--duration-page:150ms` contradicts M3 medium (300ms). Fixed to 300ms.
3. Press `scale(0.96)` vs measured 0.97 + 70ms down-beat. Retuned.
4. Search backdrop `blur(8px)+65%` and command `72%` scrim contradict 32% flat spec on mobile. Flattened on coarse pointers.
5. No fake drag handles added anywhere (correct — a handle without physics is decoration).

## Stage-5 "pre-existing" claim: VERIFIED TRUE (with bounds)

- ChatPanel iframe skeleton (ChatPanel.tsx:472-477) + `role=alert` frame error (:481) ✓
- Newsletter `role=alert` errors + aria-invalid (:432-438) ✓; ErrorBoundary ✓; article skeletons (per R) ✓
- Genuinely missing (chat-app scope, not portfolio): optimistic glyphs, swipe-quote, FAB count, Retry/Edit cards — moved to chat integration.
