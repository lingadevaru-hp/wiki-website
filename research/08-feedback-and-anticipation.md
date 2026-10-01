# Phase 8 — Feedback, states and user anticipation

## Manus agentic (adapt to wiki reader + chat)

- Task progress: plan → steps (checklist, live status) → partial results streamed → final + share/retry. Long waits feel short via visible steps + async-notify (fits patchy 4G).
- Errors: plain-language + retry + contact path; never raw errors; history preserved.
- Adopt: ChatPanel thinking → streaming → single Markdown render (already) + step list for multi-turn; newsletter/API forms get inline success + undo.

## Telegram messaging (adapt to ChatPanel)

- Optimistic send + states: clock (sending) → single ✓ (sent) → double ✓ (read, accent-blue); failed red retry; typing dots in header/bubble; reply-quote into composer (swipe/long-press); scroll FAB with unread count + "new messages" pill; `Jump-to-latest` on lock.
- Loading: skeletons for articles/search lists; spinner only if >300ms; streaming for chat; shimmer 1.5s.
- Empty/offline/error/success: one visual + one line + one CTA (e.g. offline "You're offline — reading saved copy" + Retry).
- Anticipation: defaults (Tokyo-night, en→kn switch in new tab hint), prefilled search from selection, suggested next (Read Next), undo for clear-chat/newsletter instead of confirm.
- Haptics: light on send/sheet-snap only; no sound by default; toasts 3s + swipe-away.

Effort M / Impact 4-5. Strong conventions (both refs agree): optimistic UI, exit-faster, undo>confirm, one-CTA empty states.
