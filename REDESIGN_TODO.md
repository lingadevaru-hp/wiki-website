# Thoshan's Wiki Redesign TODO

Last updated: 2026-08-15

## Product Direction

- [x] Separate the product into Landing, Wiki Home, Search, About, and Article views.
- [x] Treat mobile as the primary layout and interaction target.
- [x] Use an editorial, calm, Apple-influenced interaction language: clear hierarchy, responsive feedback, translucent utility surfaces, and restrained motion.
- [x] Keep the redesign local-only. No GitHub push, merge, commit, pull request, or external deployment.
- [ ] Preserve the current article JSON contract while expanding the reader and media contracts only when needed.

## Completed In This Pass

### Information Architecture

- [x] Rebuilt `/` as a minimal identity-first Landing page.
- [x] Rebuilt `/wiki/home` as the real Wiki Home and article index.
- [x] Removed duplicate Home labels and added explicit Landing, Wiki Home, Search, and About navigation.
- [x] Removed the redundant internal mobile bottom navigation.
- [x] Removed duplicate article title and metadata rendering.
- [x] Moved sub-article navigation after the article lead.
- [x] Replaced stale parent-article detection with longest matching parent lookup.

### Article Reading

- [x] Added a Listen control to every article detail page.
- [x] Added a compact floating reader panel for mobile and desktop.
- [x] Added play and pause controls.
- [x] Added 10-second backward and forward actions.
- [x] Added draggable reading progress control.
- [x] Added playback-speed options.
- [x] Added minimize and close behavior.
- [x] Added article reader status and action feedback.
- [x] Kept copy link, cite, save, print, and listen actions together in one responsive action row.
- [x] Added reading progress indicator and back-to-top control.
- [x] Added text-size, content-width, and theme preferences.
- [x] Added related pages and Read Next sections.

### Search and Interaction

- [x] Made full-text search deterministic by loading article content before scoring it.
- [x] Centralized global keyboard shortcut handling in the app shell.
- [x] Added `/` as a search shortcut when focus is not inside a text input.
- [x] Added responsive states for buttons, cards, empty pages, skeleton loading, and toast feedback.
- [x] Added reduced-motion CSS fallback.

### Visual and Responsive Work

- [x] Added mobile-first editorial layout system.
- [x] Added desktop reading column and secondary reading settings rail.
- [x] Added responsive article index, featured article, recent article, and category filtering layouts.
- [x] Added safe mobile layout rules for infoboxes, media, callouts, tables, and long article content.
- [x] Added Apple Design skill locally at `/home/libre/.codex/skills/apple-design`.
- [x] Applied Apple Design principles to response, hierarchy, motion, translucency, direct feedback, reduced motion, and typography decisions.

## Remaining Critical Work

### Voice Reading Provider

- [ ] Define a small `TextToSpeechProvider` interface so the current browser Speech Synthesis implementation can be replaced by Cloudflare audio later.
- [ ] Add provider states: unavailable, loading, ready, playing, paused, failed, and ended.
- [ ] Replace estimated timeline seeking with exact media seeking when the Cloudflare provider returns an audio file or stream.
- [ ] Decide where generated audio is cached and how long it remains valid.
- [ ] Add loading and failure UI for slow or unavailable speech generation.
- [ ] Confirm whether the Cloudflare implementation should use a Worker endpoint, R2-backed audio, or another service before adding backend code.

### Apple-Style Interaction Refinement

- [ ] Add pointer-down feedback to primary buttons, reader controls, and article rows.
- [ ] Replace fixed slide transitions for the mobile reader panel with an interruptible bottom-sheet interaction.
- [ ] Add pointer capture and 1:1 drag tracking to the reader seek control if native range input behavior is insufficient.
- [ ] Add spring-style opening and minimizing behavior using the existing motion dependency or a small local utility.
- [ ] Add keyboard Escape handling for the reader panel and navigation drawer.
- [ ] Add `prefers-reduced-transparency` and `prefers-contrast: more` fallbacks.
- [ ] Review reader motion at slow speed for jumps, delayed feedback, and non-mirrored enter/exit paths.

### Reliability and Accessibility

- [ ] Add browser-level interaction checks for Listen, pause, skip, seek, speed, minimize, close, save, copy, cite, print, search, and category filtering.
- [ ] Verify all article routes and all article-to-article links against the current dataset.
- [ ] Add explicit fallback handling for missing thumbnails, remote media, broken images, and unsupported speech synthesis.
- [ ] Add focus restoration when search, navigation, or the audio reader closes.
- [ ] Verify screen-reader names and keyboard order for all icon-only controls.
- [ ] Verify 320px, 375px, 768px, 1024px, 1440px, and wide desktop layouts.
- [ ] Check horizontal overflow programmatically on every primary route.

## Feature Backlog

These are the planned upgrades from the redesign discussion, with current status:

1. [x] Minimal Landing experience.
2. [x] Unified Wiki Home.
3. [x] Global search redesign foundation.
4. [x] Search loading and empty states foundation.
5. [x] Compact mobile reading header.
6. [x] Desktop reading layout.
7. [x] Article progress indicator.
8. [x] Article table of contents integration.
9. [x] Compact sub-article navigation.
10. [x] Reading preferences.
11. [x] Persistent article actions.
12. [x] Toast and interaction feedback foundation.
13. [x] Responsive infobox and media rules.
14. [ ] Full spring-based motion system.
15. [x] Keyboard and accessibility foundation.
16. [x] Front-end voice article reader.
17. [ ] Cloudflare text-to-speech provider.
18. [ ] Optional AI article chat, only after the reader and search flows are stable.

## Verification Checklist

- [x] Typecheck passes: `pnpm --filter @workspace/thoshan-wiki typecheck`.
- [x] Production build passes: `pnpm --filter @workspace/thoshan-wiki build`.
- [x] Local route checks pass for Landing, Wiki Home, article, Search, and About.
- [x] Article index data loads and contains the expected entries.
- [x] Mobile Landing screenshot reviewed.
- [x] Mobile article screenshot reviewed.
- [x] Desktop Wiki Home screenshot reviewed.
- [x] Desktop article screenshot reviewed.
- [ ] Interactive browser acceptance pass for reader controls.
- [ ] Final accessibility and overflow audit.

## Delivery Boundary

- Development remains local to this workspace.
- Do not push to GitHub.
- Do not create or merge a branch.
- Do not create a pull request.
- Do not add Cloudflare credentials, deployment configuration, or production endpoints until the provider design is approved.

## Expanded Autonomous Pass

The following inventory reflects the broader request for 20+ features, 20+ motion details, 20+ UX improvements, and 10+ corrections. Items marked complete are implemented in the current local workspace; remaining items are the next safe increments.

### 20+ Product Features

- [x] Landing identity view with Start Reading and Search actions.
- [x] Wiki Home featured reading.
- [x] Wiki Home recent articles.
- [x] Wiki Home category tabs.
- [x] Wiki Home article count.
- [x] Deterministic full-text search.
- [x] Search keyboard navigation.
- [x] Search recent-query memory.
- [x] Article reading time estimate.
- [x] Article reading progress indicator.
- [x] Resumable article reading position.
- [x] Table of contents with active section state.
- [x] Compact sub-article list.
- [x] Read Next recommendations.
- [x] Save/bookmark article state.
- [x] Copy article link.
- [x] Copy citation.
- [x] Native share fallback to copy link.
- [x] Print article action.
- [x] Font-size preference.
- [x] Content-width preference.
- [x] Light/dark theme preference.
- [x] Browser voice reading.
- [x] Reader pause and resume.
- [x] Reader 10-second backward and forward controls.
- [x] Reader draggable estimated timeline.
- [x] Reader playback-speed control.
- [x] Reader minimize and reopen control.
- [x] Reader status feedback.
- [ ] Cloudflare TTS provider adapter.
- [ ] Optional AI article chat with clear privacy and cost boundaries.

### 20+ Motion and Micro-Interaction Details

- [x] Landing archive arrow float.
- [x] Landing orbit identity motion.
- [x] Button press compression feedback.
- [x] Button hover lift feedback.
- [x] Article card hover lift.
- [x] Article row hover surface change.
- [x] Header translucent material blur.
- [x] Search surface focus transition.
- [x] Navigation drawer slide and backdrop.
- [x] Reader panel materialized entrance.
- [x] Reader minimized-pill entrance.
- [x] Active reader pulse indicator.
- [x] Reader play button scale feedback.
- [x] Reader seek thumb direct manipulation.
- [x] Reader progress movement.
- [x] Resume banner entrance.
- [x] Toast entrance feedback.
- [x] Article loading skeleton pulse.
- [x] Smooth back-to-top movement.
- [x] Smooth Landing-to-archive scroll.
- [x] Smooth table-of-contents anchor scroll.
- [x] Section heading active-color response.
- [x] Category pressed-state response.
- [x] Focus-visible outline response.
- [x] Reduced-motion static fallback.
- [x] Reduced-transparency material fallback.
- [x] High-contrast border fallback.
- [ ] Pointer-capture reader sheet drag.
- [ ] Interruptible spring reader sheet snap.
- [ ] Velocity-aware reader sheet dismissal.

### 20+ UX and Visual Improvements

- [x] Clear Landing versus Wiki Home distinction.
- [x] One article title authority.
- [x] One article action row.
- [x] Mobile-first header density.
- [x] Desktop reading column width.
- [x] Desktop secondary settings rail.
- [x] No internal mobile bottom navigation duplication.
- [x] Explicit navigation labels.
- [x] Compact article index rows.
- [x] Featured content before browsing controls.
- [x] Recent content before the full index.
- [x] Category filter hierarchy.
- [x] Full-width mobile infobox behavior.
- [x] Long content overflow protection.
- [x] Loading skeleton instead of blank article screen.
- [x] Article not-found recovery action.
- [x] Search empty state.
- [x] Search clear and recent-query affordances.
- [x] Share support on capable devices.
- [x] Keyboard Home and End article navigation.
- [x] Escape-to-close navigation drawer.
- [x] Visible accessible icon labels.
- [x] Safe area and responsive spacing foundation.
- [x] Optical heading scale and restrained tracking.
- [x] Material depth for floating reader controls.
- [x] No fabricated content added to the redesign.
- [ ] Full focus restoration for every modal and drawer.
- [ ] Formal contrast audit across both themes.

### 10+ Corrections to Old Practices

- [x] Removed duplicate Home navigation destinations.
- [x] Removed redundant mobile bottom navigation.
- [x] Removed duplicate article title and metadata.
- [x] Removed decorative/competing article control surfaces.
- [x] Removed duplicate global search shortcut ownership.
- [x] Corrected nondeterministic cached-only body search.
- [x] Corrected parent/sub-article matching for nested slugs.
- [x] Corrected mobile article action overflow risk.
- [x] Corrected long media and table overflow risk.
- [x] Corrected stale fictional not-found navigation exposure in the primary path.
- [x] Corrected missing loading and error states in article routing.
- [x] Corrected reader minimize behavior so playback remains discoverable.
- [x] Corrected missing share fallback behavior.
- [x] Corrected missing page-progress persistence.
- [ ] Replace estimated speech timeline with exact audio duration from the future TTS provider.
- [ ] Complete route-wide invalid-link audit.

## Media, Verification, and Performance Pass

- [x] Removed the FOSS animated GIF from the article data.
- [x] Removed the GIF asset from public delivery.
- [x] Replaced verification media emphasis with a compact evidence map.
- [x] Made the verification map explicit about front-end-only behavior.
- [x] Kept future Cloudflare integration as a backend/provider boundary.
- [x] Removed eager preload of every article from initial page work.
- [x] Kept article search deterministic through on-demand loading.
- [x] Preserved lazy loading for non-critical thumbnails and media.
- [x] Added media overflow protection for images, iframes, tables, and long URLs.
- [ ] Add production asset compression and cache headers when deployment is introduced.

## 60+ Feature Expansion Inventory

This is the expanded product surface to build incrementally without turning the interface into a crowded dashboard.

1. [x] Landing identity view
2. [x] Wiki Home index
3. [x] Featured reading
4. [x] Recent articles
5. [x] Category filtering
6. [x] Deterministic full-text search
7. [x] Recent search memory
8. [x] Search keyboard navigation
9. [x] Article breadcrumbs
10. [x] Article reading time
11. [x] Article progress bar
12. [x] Resume reading
13. [x] Table of contents
14. [x] Collapsible sections
15. [x] Sub-article navigation
16. [x] Previous article navigation
17. [x] Next article navigation
18. [x] Read Next recommendations
19. [x] Bookmarks
20. [x] Copy link
21. [x] Copy citation
22. [x] Native share
23. [x] Print view
24. [x] Text size settings
25. [x] Content width settings
26. [x] Theme settings
27. [x] Browser voice reader
28. [x] Voice reader pause/resume
29. [x] Voice reader skip controls
30. [x] Voice reader seek control
31. [x] Voice reader speed control
32. [x] Voice reader voice selection
33. [x] Voice reader sleep timer
34. [x] Voice reader minimized state
35. [x] Verification evidence map
36. [x] Verification front-end boundary label
37. [x] Loading skeletons
38. [x] Error recovery actions
39. [x] Empty search states
40. [x] Mobile drawer navigation
41. [x] Escape drawer close
42. [x] Keyboard Home/End reading
43. [x] Reduced-motion support
44. [x] Reduced-transparency support
45. [x] High-contrast support
46. [x] Responsive infoboxes
47. [x] Responsive media
48. [x] Safe long-content wrapping
49. [x] Touch-friendly action sizing
50. [x] Material header surface
51. [x] Material audio surface
52. [x] Toast feedback
53. [x] Active section tracking
54. [x] Accessible icon labels
55. [x] Responsive desktop settings rail
56. [x] Search shortcut `/`
57. [x] Search shortcut `Ctrl/Cmd + K`
58. [x] Parent article detection
59. [x] Local-only delivery boundary
60. [ ] Cloudflare TTS provider
61. [ ] Exact audio duration and seeking
62. [ ] Audio cache strategy
63. [ ] Optional AI article chat
64. [ ] Related-article graph view
65. [ ] Export article as Markdown
66. [ ] Export saved articles as JSON
67. [ ] Offline article cache
68. [ ] Installable PWA shell
69. [ ] Reading history page
70. [ ] Per-article notes
71. [ ] Text selection quote action
72. [ ] Shareable section anchors
73. [ ] Formal automated accessibility suite
74. [ ] Formal performance budget
75. [ ] Cloudflare-backed verification checks

## Latest Visual, SEO, and Media Pass

- [x] Restored the original FOSS Coin GIF locally from the project capture source.
- [x] Placed the GIF at the top of the FOSS Coin article as an aesthetic project capture.
- [x] Kept the GIF out of the Landing cover and Wiki Home card grid.
- [x] Added a lightweight CSS star field to Wiki Home.
- [x] Enhanced the article progress bar with a position marker and percentage label.
- [x] Added current spoken-sentence context to the floating reader.
- [x] Moved the desktop reader surface to a visible floating top position.
- [x] Rounded action controls with Apple-style translucent material.
- [x] Added tactile press scaling and glass depth to interactive controls.
- [x] Fixed the Wiki wordmark to return to Landing instead of Wiki Home.
- [x] Set dark theme as the default while preserving the light-theme option.
- [x] Added per-route SEO metadata updates.
- [x] Added canonical URL generation at runtime.
- [x] Added author and social identity metadata for `lingadevaruhp` and GitHub `lingadevaru-hp`.
- [x] Added sitemap coverage for the main portfolio and priority project pages.
- [x] Added sitemap declaration to robots.txt.
- [x] Removed the static GIF preload from the global HTML shell.
- [x] Kept the GIF lazy-loaded on the article where it is actually needed.
- [x] Added a compact landing-page project capture with the same fullscreen viewer.
- [x] Made the FOSS Coin article capture clickable with Escape and new-tab support.
- [x] Added an animated reader equalizer and warm non-blue audio accent.
- [x] Reduced the reader surface width and moved it to the desktop edge to protect reading space.
- [x] Added a subtle animated night-sky field to the Landing view.
- [x] Moved parent and sub-article pages into a desktop Related pages rail.
- [x] Kept recommended articles as a separate lower reading section.
- [x] Added collapsible mobile project-page navigation.
- [x] Promoted GitHub and deployed-project actions into the article toolbar.
- [x] Made the reading-width control expand the actual desktop article column.
- [x] Added dark print/PDF styling for article output.
- [x] Removed unrelated GIFs from the Cloudflare Turnstile gate.
- [x] Documented the FOSS Coin asset and Cloudflare verification boundary in README.
- [ ] Add a deployment base URL to sitemap generation before public launch.
