# AUDIT — every screen & overlay (portfolio)

> Format: current → target (token) → exact change. Implemented on `upgrade/v10-integration`.

## Overlays

- **GlobalSearch**: centered modal + 65% blur scrim → mobile bottom sheet (done #94); FIX: scrim 32% flat on coarse, radius 28px top, entry 250ms decelerate. Focus trap ✓ (#112-144), restore: verify.
- **CommandMenu**: same sheet treatment; restore ✓ (:106). FIX: scrim/radius/entry same as search.
- **ChatPanel embed**: detents 60/90 + drag + trap + restore + announce ✓ pre-existing. FIX: scrim to 32%, handle to 32×4 spec where applicable.
- **ThemePicker/LanguageSwitcher**: popovers, anchored. Target: keep anchored (not sheets — small menus), entry 200ms standard ease, 150ms exit. FIX: verify durations.
- **MediaViewer/ShortcutsModal/Newsletter**: dialogs. Target: 200ms in/150ms out, Esc ✓, restore (Newsletter ✓:174; verify others).
- **Toasts**: timing → 3000ms + swipe-away; undo pattern where destructive.
- **AudioReader + mini**: floating panel ✓; FIX: dvh done (#93); verify 48px controls + Esc (R: Esc TODO open → add if missing).

## Pages

- **Landing**: single entry (Start Reading + search) ✓. FIX: chips snap-row ≤640px, press 0.97/70ms.
- **Home**: featured + recent + tabs ✓. FIX: card press + stagger 40ms (exists? verify), content-visibility on grids.
- **Article**: TOC/progress/action-row/infobox/Read-Next ✓. FIX: back-to-top 40px/150ms pattern, table edge-fade, code 13px + copy header (verify ContentBlock).
- **Search page**: skeleton/empty ✓. FIX: spinner-300ms guard.
- **404**: recovery action ✓ (verify one-action rule).
- **Header**: 56px sticky, blur ok (header exempt). FIX: 48px targets on coarse, chat pulse kept.

## Cross-cutting (implemented below)

- Tokens: page 300ms, ease-standard (0.2,0,0.2,1), +decelerate/accelerate/spring, press 0.97/70ms.
- KN: strict break rules; URL/code `anywhere` exception documented.
- Perf: blur flatten on coarse (sheets/menus only), content-visibility lists, one lazy split (MediaViewer if static).
- A11y: 48dp coarse bump, focus-restore gaps closed, 22-theme contrast script.
