# Thoshan's Wiki — Design System

## Philosophy

Editorial, calm, Wikipedia-influenced with Apple-style interaction refinements. Dark-first, restrained motion, translucent utility surfaces, sharp borders.

## Color Tokens

All colors use HSL CSS custom properties. Light and dark themes via `.dark` class.

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--background` | `0 0% 100%` | `221 16% 8%` | Page background |
| `--foreground` | `210 4% 20%` | `240 9% 91%` | Primary text |
| `--card` | `210 17% 98%` | `0 0% 11%` | Card/surface background |
| `--border` | `210 14% 66%` | `220 4% 25%` | Borders, dividers |
| `--accent` | `219 79% 47%` | `219 67% 60%` | Links, active states |
| `--muted-foreground` | `207 7% 46%` | `0 0% 47%` | Secondary text |
| `--destructive` | `0 59% 52%` | `0 59% 60%` | Error/danger |
| `--audio-accent` | `#e2ab52` | `#e2ab52` | Audio reader warm accent |

## Typography

- **Display/Heading:** Georgia, serif (editorial feel)
- **Body:** System font stack (`-apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`)
- **Mono:** `"Courier New", monospace`

### Type Scale

| Level | Size | Line-height | Usage |
|-------|------|-------------|-------|
| `h1` | `clamp(2.35rem, 6vw, 4.2rem)` | 0.98 | Article title |
| `h2` | `clamp(1.25rem, 3vw, 1.75rem)` | 1.3 | Section headings |
| `h3` | `clamp(1.125rem, 2.5vw, 1.5rem)` | 1.4 | Sub-sections |
| Body | `clamp(0.875rem, 1.5vw, 1rem)` | 1.7 | Paragraphs |
| Caption | 12px | 1.5 | Metadata, timestamps |
| Eyebrow | 10px, uppercase, 0.11em tracking | 1 | Category labels |

## Spacing

Base unit: 4px (`--spacing: 0.25rem`). Common values: 4, 7, 8, 10, 12, 14, 16, 18, 22, 24, 28, 32, 34, 36, 42, 46, 48, 64, 80, 90, 96, 120.

## Border Radius

- **Sharp** (default): `2px` — Wikipedia-style
- **Buttons/Controls:** `12px` — Apple-inspired
- **Icon buttons:** `10px`
- **Search bar:** `13px`
- **Category pills:** `999px` (full round)
- **Audio reader:** `24px`
- **Cards/Sections:** `18px`

## Elevation System

Translucent overlays using `--elevate-1` and `--elevate-2`:
- **Hover:** `--elevate-1` overlay via `::after` pseudo-element
- **Active/Pressed:** `--elevate-2` overlay
- **Toggle:** `--elevate-2` background via `::before` pseudo-element

Utility classes: `.hover-elevate`, `.active-elevate`, `.toggle-elevate`

## Motion

### Token System

All transitions and animations use CSS custom properties for consistency:

| Token | Value | Usage |
|-------|-------|-------|
| `--duration-instant` | `0ms` | Immediate feedback |
| `--duration-fast` | `120ms` | Hover states, micro-interactions |
| `--duration-normal` | `200ms` | Standard transitions |
| `--duration-slow` | `320ms` | Modal/panel entrances |
| `--duration-page` | `450ms` | Page-level transitions |
| `--stagger-step` | `40ms` | Sequential element delays |
| `--ease-out` | `cubic-bezier(0.2, 0, 0, 1)` | Default easing |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations |
| `--ease-in-out` | `cubic-bezier(0.2, 0, 0, 1)` | Bidirectional transitions |
| `--ease-spring` | `cubic-bezier(0.2, 0.9, 0.2, 1)` | Apple-style spring |
| `--ease-bounce` | `cubic-bezier(0.34, 1.3, 0.64, 1)` | Modal bounce-in |

### Patterns

- **Press feedback:** `scale(0.96)` with `--duration-instant`
- **Hover lift:** `translateY(-1px)` or `translateY(-2px)`
- **Stagger reveals:** `calc(var(--stagger-step) * N)` for sequential items
- **Theme toggle suppression:** `.theme-transitioning` class temporarily disables transitions
- **Always respects `prefers-reduced-motion: reduce`** — all animations disabled, hover transforms removed

## Key Components

### Buttons
- `.landing-primary` — filled accent, 12px radius
- `.landing-secondary` — translucent glass, 12px radius
- `.action-button` — inline tool actions, translucent glass
- `.category-row button` — pill filters, 999px radius

### Cards
- `.recent-card` — article preview grid cards
- `.read-next-card` — recommendation cards
- `.featured-article` — hero article card with gradient

### Navigation
- `.wiki-header` — sticky, translucent blur, 50 z-index
- `.header-search-button` — expanded search affordance
- `.header-nav` — desktop text links

### Audio Reader
- `.audio-reader` — floating panel, warm accent, 24px radius
- `.audio-reader-mini` — minimized pill, 999px radius
- Custom seek bar with `--audio-accent` color

## Accessibility

- **Skip link:** `<a href="#main-content" class="skip-link">` — visible on Tab, jumps to main content
- `prefers-reduced-motion: reduce` — disables all animations and hover transforms
- `prefers-reduced-transparency: reduce` — solid backgrounds
- `prefers-contrast: more` — `currentColor` borders
- `focus-visible` — 2px outline with ring color on all interactive elements
- Disabled states — `opacity: 0.45`, `cursor: not-allowed`, `pointer-events: none`
- Touch targets ≥ 34px (buttons), ≥ 44px (mobile)
- Semantic HTML: proper heading hierarchy, `aria-hidden` on decorative elements
- Search modal — focus trap, `role="dialog"`, `aria-modal`, `aria-label`
- Theme toggle — descriptive `aria-label` ("Switch to light/dark mode"), `aria-pressed` state

## Responsive Breakpoints

| Breakpoint | Behavior |
|------------|----------|
| > 900px | Desktop: 2-column article layout with settings rail |
| ≤ 900px | Tablet: single column, hide settings rail, hide header nav |
| ≤ 640px | Mobile: compact header, full-width cards, stacked layouts |
