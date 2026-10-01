# Phase 6 — Typography, color, themes and Indic-language support

## Type scale (keep, verify at 360px)

Georgia display / system body / Courier mono. `h1 clamp(2.35rem,6vw,4.2rem)/0.98`, `h2 clamp(1.25rem,3vw,1.75rem)/1.3`, body `clamp(0.875rem,1.5vw,1rem)/1.7`, caption 12/1.5, eyebrow 10px +0.11em. Body never below 16px rendered on mobile (iOS zoom + Kannada legibility).

## Color system

- HSL vars `--background/foreground/card/border/accent/muted/destructive` + `--audio-accent #e2ab52`; surfaces: background → card → raised; neutrals ≥90%, one accent; semantic only for status.
- Manus anchor: warm off-white `#f8f8f7` light; wiki light equivalent per theme (not forced `#fff`).
- Contrast: AA for body (4.5:1), AAA aspirational for headings; audit all 22 themes (catppuccin, latte, ethereal, everforest, flexoki-light, gruvbox, hackerman, kanagawa, last-horizon, lumon, lupine, matte-black, miasma, nord, osaka-jade, retro-82, ristretto, rose-pine, solitude, tokyo-night default, vantablack, white).
- `theme-color` meta per theme (like Manus) to kill white flash; dark themes set dark value.

## Per-theme flavor (do not flatten)

Each of the 22 keeps accent/surface personality; v10.10 maps principles (sheet radius, calm ratio, press scale) onto theme tokens, never one global palette. Tokyo-night stays default dark.

## Kannada (mobile-first, tested requirement)

- Fonts: Noto Sans Kannada (UI/body) + Noto Serif Kannada (display, where Georgia lacks glyphs); `font-display: swap`; subset + preload for kn route.
- Sizes: body 16-17px min, lh 1.7-1.8 (tall glyphs + ottaksharas need headroom); line-padding to avoid clipping (`overflow: visible`, `padding-block: 0.15em` on headings); mixed en-kn lines keep same lh, no size drop.
- Wrapping: `overflow-wrap: anywhere` for long compounds + URLs; truncation after 2 lines max with "read more".
- Verify at 360px: kn article title, chips, search placeholder, reader controls — screenshots in build; en+kn first, hi next.
- Effort S-M / Impact 5.
