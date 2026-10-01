# Phase 5 — Shapes, buttons and component micro-details

## Radius scale (lock)

| Use | Radius | Note |
|---|---|---|
| default sharp | 2px | Wikipedia flavor keep |
| icon buttons | 10px | 40→48px box |
| buttons/controls | 12px | h 44→48px |
| search bar | 13px | keep (brand) |
| cards/sections | 18px | sheets/dialogs too |
| audio reader | 24px | keep |
| pills/chips/mini | 999px | chips, category, mini-player |

Squircle: approximate with large radii + 1px border; no proprietary continuous-corner code.

## Component specs

### Buttons (filled/tonal/ghost)
- H 48px mobile (44 desktop min), min-w 48px, h-padding 16-20px, icon-label gap 8px, weight 600, radius 12px.
- States: default / pressed `scale(0.96)` + 8% darken overlay (`--elevate-2`) / disabled `opacity .45` + `not-allowed` / loading spinner replaces label (min 300ms to avoid flash).
- No ripple (Manus/Telegram-web convention; cheaper + calmer). Effort S / Impact 4.

### Chips / tabs / segmented / toggles / sliders
- Chips: h 36-40px, hit 48px via padding, 999px, tonal; overflow = horizontal scroll-snap under prompt (Manus More-pattern), not wrap.
- Switch: track 48×28, thumb 24, 200ms ease-out slide; hit 48×48. Slider (seek): track 4px, thumb 20px visual / 48px hit; `--audio-accent #e2ab52` keep.
- Tabs: underline 2px accent, 200ms slide; segmented: 12px container, sliding pill 200ms.

### Prompt/composer + inputs
- Autosize to max 5 lines then inner scroll; border neutral → accent on focus; placeholder  secondary; clear ✕ ≥44px; send enabled only with text (accent) else muted; `enterkeyhint` correct.
- Effort S / Impact 5 (see Phase 7).

### Icons
- Outline 1.75-2px @24px grid, rounded caps; active = filled or accent, inactive = outline secondary; swap (not morph) 200ms; licensed set (e.g. Lucide/Tabler-equivalent feel), never proprietary. Label all icon-only buttons.

### Logo/brand moments
- Boxed serif "T" keep; splash = static mark (no anim >300ms); empty states get mark + one-line + one CTA; no logo anim on every load (restraint).

### Elevation
- Borders > shadows on mobile (perf); `--elevate-1` hover / `--elevate-2` pressed overlays (keep); glass/blur only header/sheet-top, never full-page on low-end; dividers 1px neutral.
