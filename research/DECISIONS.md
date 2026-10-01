# DECISIONS — evidence for judgement calls

1. **Press feedback: desktop-only ripple + mobile scale.** Telegram uses ripple in BOTH clients (tweb `--ripple-duration .4s mobile/.7s desktop`, `use:ripple`; tt `ANIMATION_DURATION_MS 700`, `mousedown`-only, `ripple={!isMobile}`). So "no ripple" was wrong. Decision: keep desktop ripple where free, mobile = `scale(0.96)` + opacity (cheaper on low-end, no 700ms overlay). Provenance: measured.
2. **Reply: swipe primary, long-press fallback.** WhatsApp has swipe-to-reply; Telegram thresholds measured (tweb 48–64px, tt 10–20px). Decision: swipe-to-quote + context-menu fallback. Provenance: measured/documented.
3. **Route transition ≤150ms or none.** Manus `--page-fade-dur .15s`; tt layer 300ms is the SLOW end for large panels. 450ms too slow on 4×CPU. Decision: page fade 150ms max or none on mobile. Provenance: measured.
4. **Keyboard: visualViewport primary.** Both Telegram clients use `visualViewport resize` listeners (tweb iOS guard, tt `body.keyboard-visible`); `interactive-widget` is enhancement only (Safari gap, ~31% Mobile Safari). Decision: VV + dvh primary. Provenance: measured.
5. **Kannada wrap: `break-word` + `lang`.** `anywhere` splits words ugly; correct `lang="kn"` + `overflow-wrap:break-word`. Provenance: documented CSS behavior.
6. **No merge/deploy unattended.** Owner didn't say "go". Stop at open PRs + previews. Provenance: safety rule.
