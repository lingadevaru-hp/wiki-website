# Mobile performance and the landing-page critical path

Why the landing page scored **60** on mobile Lighthouse while desktop sat at
95, what was actually responsible, and what must not be undone.

## The numbers

PageSpeed Insights, 27-10-2026, `https://lingadevaru.in/`:

| | Mobile (Moto G Power, Slow 4G) | Desktop |
|---|---|---|
| Performance | **60** | 95 |
| FCP | **4.2 s** | 0.8 s |
| LCP | **7.2 s** | 1.1 s |
| Speed Index | **7.6 s** | 2.1 s |
| TBT | 100 ms | 80 ms |
| CLS | 0.067 | 0.018 |
| Accessibility | 100 | 100 |
| Best Practices | 96 | 96 |
| SEO | 100 | 100 |
| Agentic Browsing | 4/4 | 4/4 |

TBT and CLS were already good on both. The failure was entirely in **when the
page can paint**: a 4.2 s first paint and a 7.2 s largest paint. That is a
delivery and discovery problem, not a JavaScript-execution one.

## Root cause 1 — the 8.8 MB featured loop was on the critical path

`artifacts/thoshan-wiki/public/assets/foss-coin-loop.mp4` is **8.8 MB**, and it
was fetched during every landing-page load twice over:

1. `index.html` carried `<link rel="preload" as="video" type="video/mp4" …>`.
2. `LandingPage.tsx` rendered the hero `<video … autoPlay preload="auto">`,
   which starts the download on mount.

At Slow 4G (≈1.6 Mbit/s) 8.8 MB is roughly 45 seconds of link time. The video
was competing with — and starving — the poster image, the stylesheet and the
fonts that actually needed to arrive first. That is why even the 180 KB poster,
which was correctly preloaded with `fetchpriority="high"`, did not paint for
7.2 s.

A preload is not free and it is not additive: the network is shared. Preloading
a large video to make it "play sooner" delays everything that makes the page
appear at all.

### Fix

- Removed the `as="video"` preload from `index.html`.
- The `<video>` now ships `preload="none"` with **no `src` attribute**.
  `preload="none"` alone is not sufficient in React: setting `src` on mount
  starts the fetch regardless, so the source itself is deferred.
- `LandingPage` attaches the source on the `load` event (or immediately if the
  document is already complete) and then calls `play()`. If autoplay is refused
  — battery saver, data saver — the poster simply stays, which is the desired
  fallback.
- The poster preload with `fetchpriority="high"` is kept: it is the LCP image.

Result: the poster paints as soon as the poster arrives, and 8.8 MB of video
streams after the page is interactive instead of before it can render.

## Root cause 2 — three third-party font stylesheets blocked first paint

`index.html` loaded three separate `fonts.googleapis.com` stylesheets with
`rel="stylesheet"`: Inter, Noto Sans/Serif Kannada, and Caveat. A stylesheet in
the `<head>` blocks rendering until it has been fetched **and** the CSSOM is
built, so FCP waited on a third-party origin — twice over, since each
stylesheet is one request and the font files behind it are another.

### Fix

All three now load as `rel="preload" as="style"` and are promoted to
`rel="stylesheet"` in `onload`, with a `<noscript>` fallback for the no-JS path.
Every family already used `display=swap`, so text paints in the fallback face
immediately and swaps when the webfont arrives. Appearance is unchanged; only
the render-blocking wait is gone.

## Best Practices 96

Two audits were failing:

- **Issues were logged in the Chrome DevTools Issues panel** (scored). A
  `preload` that the browser never uses within a few seconds is reported there,
  and the unused 8.8 MB video preload is exactly that. Removing it addresses the
  likely cause.
- **Missing source maps for large first-party JavaScript** (unscored). The
  detail panel shows the timeouts are for **third-party posthog.com** resources,
  not our bundle.

Source maps were deliberately **not** enabled. The audit is unscored, so it
cannot move the 96, and emitting `.map` files publishes the original source of
every bundle to anyone who requests it. That trade is not worth a zero-point
audit.

## What must not regress

The performance work touches `index.html`, which also carries the SEO and
crawler guarantees fixed earlier. `src/payload.test.mjs` asserts, in addition to
the performance invariants, that the canonical link, the `hreflang` alternates
and the `index, follow` robots meta are still present.

Also unchanged by design:

- The Turnstile gate and its `noindex` directive (`src/crawlers.ts` policy).
- The AI Catalog manifest and its `specVersion`.
- Accessibility: the `<video>` keeps `muted playsInline`, its `aria-label`, and
  the poster, so no accessible name or layout box is lost.

## Verification

`src/payload.test.mjs` (5 tests) is wired into both `ci.yml` and `deploy.yml`.
Run against the pre-change files it fails 3 of 5; against this change all 5
pass. That regression proof matters more than the pass itself.

`pnpm --filter ./artifacts/thoshan-wiki run typecheck` passes with zero errors.

**Not run locally:** `vite build`. The sandbox this was prepared in caps
WebAssembly memory, so Vite could not start (`WebAssembly.instantiate(): Out of
memory`). CI and the deploy workflow both run the full build, so a build failure
would be caught there before it reaches production — but the first real build of
this change is the CI run, not a local one.

## Expected effect and what to watch

Removing 8.8 MB from the load and unblocking the fonts should move mobile FCP
and LCP into the green band; the poster plus a much lighter critical path is the
whole point. Speed Index should follow.

After deploying, re-run PageSpeed Insights on mobile and confirm:

- FCP and LCP are under 2.5 s.
- The featured capture still animates once the page is idle (the poster shows
  first).
- Accessibility stays 100, Best Practices improves, SEO stays 100 and Agentic
  Browsing stays 4/4.

If Best Practices is still 96, the Issues-panel failure had a different cause
than the unused preload; capture the Issues panel contents from that run before
changing anything else.

## Known remaining weight

Not addressed here, listed so it is a decision rather than an oversight:

- `foss-logo.png` is **2.4 MB** and is referenced from 16 article data files. It
  does not affect the landing page, but article pages load it.
- `foss-Thumbnail.gif` is **1.9 MB** and appears unreferenced in `src/` and
  `public/data/`.
- `music/kevin_koontz-we_can_fix_everything.mp3` is **6.9 MB**, loaded only by
  the music control.
- `src/index.css` is ~251 KB and remains a single render-blocking stylesheet.
  Splitting critical CSS out of it is the next meaningful win on mobile, but it
  changes the build and is worth doing on its own with its own measurement.
