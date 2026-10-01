# CROSS-APPLY — chat ↔ portfolio matrix

> Rule: agentic findings → chat first; design findings → portfolio first; mobile fundamentals → both. Same token values both sides; no shared file (different stacks) — values mirrored, sync rule noted here.

| Finding | Chat | Portfolio | Notes |
|---|---|---|---|
| Input attrs (enterkeyhint/inputmode/autocomplete) | ✅ PR #56 | ✅ PR #92 | both |
| 44/48px targets + press scale(.96) + touch-action | ✅ PR #56 | existing (44/48 + scale verified) | chat caught up to portfolio |
| 150ms page fade + standard ease-in | n/a (no routes) | ✅ PR #92 | portfolio only |
| visualViewport keyboard path + dvh | ✅ PR #57 (--kb, focus scroll) | ✅ PR #93 (dvh fallbacks; --chat-kb existed) | both |
| Half-sheets (search/menu/drawer) | ✅ PR #58 (settings drawer) | ✅ PR #94 (search + command); ChatPanel detents pre-existing | both |
| Kannada Noto + break-word + lang | ✅ PR #59 (fallback stack) | ✅ PR #95 (:lang(kn) rules) | both |
| Chips scroll-row + clear-chat undo | ✅ PR #60 | n/a (no destructive chat action; newsletter subscribe non-destructive, no undo needed) | chat only |
| Skeletons/error states | pre-existing (thinking phases, fallbacks, 403 reload) | pre-existing (frame skeleton, role=alert, ErrorBoundary) | verified both, no PR |
| content-visibility lists | ✅ PR #61 | ✅ PR #96 | both |
| Swipe-to-quote, drag sheets, state glyphs, unread pill | ❌ deferred (needs device) | ❌ same | BLOCKERS.md |
| 22-theme contrast AA, measured LCP/INP/CLS | ❌ deferred (needs device/tooling) | ❌ same | BLOCKERS.md |

Sync rule: motion (150/200/300ms, ease-out .2,0,0,1), scrim ~45%, detents 45/60/92, radii 12/16/24, toast 3000ms — mirrored per-repo; change one → mirror in the other + note here.
