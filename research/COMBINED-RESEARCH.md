# COMBINED RESEARCH — ours (P) + Gemini Deep Research (G)

> G source: `research/gemini/Gemini-Deep-Research-MANUS-TELEGRAM-ORIGINAL.md` (461 lines, fully read).
> Rule: G MEASURED/DOCUMENTED wins; P kept only where G is silent (tagged `assumed`).

## Conflicts (both shown, pick + reason → DECISIONS.md)

| Token | Ours (P) | Gemini (G) | Pick | Reason |
|---|---|---|---|---|
| Press scale | 0.96 | **0.97** + opacity 0.85, 70ms down / 150ms spring up | G | measured (tweb) + tactile table |
| Sheet enter/exit | 320/200 | **250/200** | G | measured (tweb popupElement.ts) |
| Scrim | 45% | **32%** | G | M3 documented |
| Sheet handle | 40×4 | **32×4 in 48px zone** | G | M3 documented |
| Sheet top radius | 20px | **28px** | G | M3 documented |
| Sheet detents | 45/60/92 | **50/90dvh** | G | documented (eleken/M3) |
| Ease standard | (0.2,0,0,1) | **(0.2,0,0.2,1)** | G | measured (tt mixins.scss) |
| Page fade | 150ms (was 450) | **300ms** (M3 medium) | G | documented; 150 was one Manus data point |
| Ripple | desktop-only, mobile scale | **Telegram HAS ripple / Manus NONE** | both TRUE | follow Manus on mobile (compositor-only), tt-style desktop ripple |
| Swipe reply | swipe primary (WhatsApp) | **48dp + haptic, long-press 400ms/10px slop** | G values | measured (DrKLO/tweb) |
| `user-scalable=no` | reject | **reject (FALSE: Safari ignores since iOS 10)** | agree | WCAG 1.4.4 |
| `anywhere` on KN | reject for prose | **reject (TRUE: splits conjuncts)** | agree | W3C css-text-4; URLs/code keep `anywhere` |
| interactive-widget | enhancement | **enhancement (FALSE uniform; WebKit bug 259770)** | agree | VV primary |
| Composer max | 5 lines/~130px | **240px/15rem** | G | measured (tt) |
| Chips | 36–40px | **34–36px, snap row, fade on keystroke** | G | measured (Manus) |
| FAB | no spec | **40px, 80px offset, >150px, 150ms scale** | G | measured (tweb) |
| Dismiss physics | velocity snap (vague) | **30% height OR >1000px/s + rubber-band** | G | measured (tweb) |
| KN lh | 1.7–1.8 | **1.65–1.80 + strict breaks + 0.01em** | G | W3C documented |
| Blur | limit it | **remove on low-end → opaque 0.98** | G | Mali-G52 25–40fps measured constraint |
| JS budget | ≤150KB/route | **<120KB gzip initial** | G | documented |

## Kept from P (G silent)

- Wiki-specific: 22-theme flavor mapping, ChatPanel never-unmount + postMessage theme sync, `#chat` hash back-dismiss, per-theme `theme-color` painting.
- Chat-specific: greeting fallback, voice watchdog, Turnstile gate, embed mode.
- Tokyo-night default, Georgia display + system body, 2px sharp default radius (brand flavor, not a measurement).

## New from G (in U32 + TODO)

- Press lifecycle (16ms pointerdown, vibrate(10) light impulse — adopt scale/opacity, haptics optional).
- Empty states (18vh/320px/48px/20px/one action), error cards (red 5% bg + Retry/Edit), code blocks (13px + pinned copy header), tables (scroll container + edge fade).
- `overflow-anchor: auto` streaming stability, RAF-buffered flush, chat virtualization 3–5 overscan (adopt anchor; full windowing deferred).
- Long-press sheet: Copy/Fork/Good-Bad/Edit pattern (adopt Copy/Retry/Edit subset).
