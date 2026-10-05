# Keyboard Shortcuts

The whole site is operable with a keyboard alone — a desktop/laptop
enhancement. Touch users get every action as a tap; nothing about mobile
changes. Single-letter keys fire only when the user is **not typing** (no
input, textarea, select, or contenteditable focused) and no search/palette
overlay is open.

Open the in-site manual any time with `?` or from the main menu
(`M` → Keyboard shortcuts).

## Search

| Keys | Action |
|------|--------|
| `Ctrl`+`K` (or `Cmd`+`K`) | Open search (works even while typing) |
| `/` | Focus search |
| `↑` / `↓` | Move in results |
| `Enter` | Open highlighted result |
| `Esc` | Close dialog |

## Menu & pages

| Keys | Action |
|------|--------|
| `M` | Open main menu (command palette) |
| `G` `H` | Go to Home |
| `G` `W` | Go to Wiki home |
| `G` `A` | Go to Articles |
| `G` `P` | Go to Projects |
| `G` `V` | Go to Achievements |
| `G` `N` | Go to News |
| `G` `B` | Go to About |
| `?` or `Ctrl`+`/` | Open this manual |

`G`-sequences disarm after 900 ms; `Esc` cancels a pending `G`.

## Reading & scroll

| Keys | Action |
|------|--------|
| `J` / `K` | Scroll down / up |
| `D` / `U` | Half page down / up |
| `G` `G` | Top of page |
| `Shift`+`G` | Bottom of page |

Scrolling respects `prefers-reduced-motion`.

## Panels & sound

| Keys | Action |
|------|--------|
| `C` | Toggle chat panel (`Ctrl`+`Space` also works, even in inputs) |
| `T` | Open themes |
| `X` | Mute / unmute music |

## General

| Keys | Action |
|------|--------|
| `Tab` / `Shift`+`Tab` | Move focus forward / back |
| `Enter` / `Space` | Activate focused item |

## Design rules (do not break these)

- **Never Super** — Omarchy/Hyprland consumes it before the browser.
- **Never browser-reserved chords** (`Ctrl`+`W/T/N/P/S/R/F/L`, `Alt`+arrows).
- New shortcuts must be added to the manual
  (`src/components/ShortcutsModal.tsx`), the palette help surface if
  applicable, and all 8 `public/locales/*.json` files (see
  `localization.md`).
- Implementation lives in `GlobalKeyboardHandler`
  (`artifacts/thoshan-wiki/src/App.tsx`).
