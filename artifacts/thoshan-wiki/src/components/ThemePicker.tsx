import { useLocale } from '@/contexts/LocaleContext'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { flushSync } from 'react-dom'
import {
  BrushIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  CrossIcon,
  SearchIcon,
} from '@/components/icons'
import {
  HINT_KEY,
  OPEN_PICKER_EVENT,
  PICKER_STATE_EVENT,
  SITE_THEMES,
  switchTheme,
  paintFavicon,
  watchChrome,
  readTheme,
} from '@/lib/theme'
import { useIsNarrow } from '@/lib/use-media-query'
import { cn } from '@/lib/utils'

const previewSrc = (id: string) => `/assets/images/theme-previews/${id}.webp`

/** Thoshan's card slant: a 2.5% lean, top edge shifted right of the bottom. */
const PARALLELOGRAM = 'polygon(2.5% 0%, 100% 0%, 97.5% 100%, 0% 100%)'

/** Inset in the same coordinate box to keep the slanted border edges parallel. */
const parallelogramInset = (b: string) =>
  `polygon(calc(2.5% + ${b}) ${b}, calc(100% - ${b}) ${b}, calc(97.5% - ${b}) calc(100% - ${b}), ${b} calc(100% - ${b}))`

/** True while the keystroke belongs to a field the reader is typing into. */
const isTyping = (target: EventTarget | null) => {
  const el = target as HTMLElement | null
  if (!el?.tagName) return false
  return (
    el.tagName === 'INPUT' ||
    el.tagName === 'TEXTAREA' ||
    el.tagName === 'SELECT' ||
    el.isContentEditable
  )
}

export function ThemePicker() {
  const { t } = useLocale();
  const portrait = useIsNarrow()
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(0)
  const [hint, setHint] = useState(false)
  const [query, setQuery] = useState('')
  const dialogRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const restoreFocus = useRef<HTMLElement | null>(null)
  /** Whether the trigger was wearing a focus ring when it opened the picker. */
  const restoreRing = useRef(false)
  const indexRef = useRef(0)

  /** Live-filtered deck: type to narrow the 22 themes instead of stepping.
      Prefix matches sort first so typing a theme's start lands on it. */
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return SITE_THEMES
    const starts: typeof SITE_THEMES = []
    const contains: typeof SITE_THEMES = []
    for (const theme of SITE_THEMES) {
      const name = theme.name.toLowerCase()
      const id = theme.id.toLowerCase()
      if (name.startsWith(q) || id.startsWith(q)) starts.push(theme)
      else if (name.includes(q) || id.includes(q)) contains.push(theme)
    }
    return [...starts, ...contains]
  }, [query])

  // A new query restarts the deck at its first match.
  useEffect(() => {
    indexRef.current = 0
    setIndex(0)
  }, [query])

  const markHintSeen = useCallback(() => {
    setHint(false)
    try {
      localStorage.setItem(HINT_KEY, 'true')
    } catch {
      /* storage unavailable */
    }
  }, [])

  const openPicker = useCallback(() => {
    const current = readTheme()
    const at = SITE_THEMES.findIndex((t) => t.id === current)
    const i = at >= 0 ? at : 0
    indexRef.current = i
    setIndex(i)
    setQuery('')
    const trigger = document.activeElement as HTMLElement | null
    restoreFocus.current = trigger
    restoreRing.current = trigger?.matches(':focus-visible') ?? false
    setOpen(true)
    markHintSeen()
  }, [markHintSeen])

  const close = useCallback(() => {
    setOpen(false)
    setQuery('')
    // Restore focus and the trigger's original focus-visible state.
    restoreFocus.current?.focus({
      focusVisible: restoreRing.current,
      preventScroll: true,
    })
  }, [])

  /** Where a finger went down, and how far it has travelled since. */
  const swipe = useRef({ id: -1, from: 0, moved: 0 })

  const step = useCallback(
    (delta: number) => {
      setIndex((at) => {
        const n = matches.length
        if (n === 0) return 0
        const next = (at + delta + n) % n
        indexRef.current = next
        return next
      })
    },
    [matches],
  )

  const choose = useCallback(() => {
    const next = matches[indexRef.current]
    if (!next) {
      close()
      return
    }
    if (next.id === readTheme()) {
      close()
      return
    }
    // The picker has a name in the wipe (see theme-transition.css), so it
    // has to be gone before the browser takes its second snapshot: a named
    // element that disappears mid-transition makes the browser drop the
    // whole wipe. Hence the flush, rather than letting React close it on
    // its own schedule a frame later.
    switchTheme(next.id, () => flushSync(() => close()), { frosted: true })
  }, [close, matches])

  // The entry point is T. Thoshan's own chord still works for anyone not on
  // Thoshan, but on Thoshan itself Hyprland binds it at the compositor and
  // consumes it before the browser sees a thing, so the one audience most
  // likely to try it is the one audience it can never reach.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const chord =
        event.code === 'Space' &&
        event.metaKey &&
        event.ctrlKey &&
        event.shiftKey
      // A bare T only: leave Cmd/Ctrl/Alt combinations to the browser, and
      // never fire while someone is typing, or searching the plugin
      // directory for a theme would open the picker on the first letter.
      const plainT =
        event.key.toLowerCase() === 't' &&
        !event.metaKey &&
        !event.ctrlKey &&
        !event.altKey &&
        !isTyping(event.target)
      if (!chord && !plainT) return
      event.preventDefault()
      if (open) close()
      else openPicker()
    }
    window.addEventListener('keydown', onKey)
    const onOpenRequest = () => openPicker()
    window.addEventListener(OPEN_PICKER_EVENT, onOpenRequest)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener(OPEN_PICKER_EVENT, onOpenRequest)
    }
  }, [open, openPicker, close])

  // The stored theme is stamped before first paint by a script in <head>,
  // which never goes through applyTheme, so the tab icon needs painting
  // once on arrival as well as on every later change.
  useEffect(() => {
    paintFavicon()
    return watchChrome()
  }, [])

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent(PICKER_STATE_EVENT, { detail: { open } }),
    )
  }, [open])

  // Decode only the visible previews and their neighbors before opening the picker.
  const warmed = useRef(new Set<string>())
  const warmAround = useCallback((at: number) => {
    for (let d = -2; d <= 2; d++) {
      const theme =
        SITE_THEMES[(at + d + SITE_THEMES.length) % SITE_THEMES.length]
      if (warmed.current.has(theme.id)) continue
      warmed.current.add(theme.id)
      const img = new Image()
      img.fetchPriority = 'low'
      img.decoding = 'async'
      img.src = previewSrc(theme.id)
      // Not every browser has decode(), whatever lib.dom promises.
      img.decode?.().catch(() => {})
    }
  }, [])
  useEffect(() => {
    if (open) warmAround(index)
  }, [open, index, warmAround])

  useEffect(() => {
    let seen = false
    try {
      seen = localStorage.getItem(HINT_KEY) === 'true'
    } catch {
      /* storage unavailable: show nothing rather than nag every visit */
      seen = true
    }
    if (seen) return
    const timer = setTimeout(() => setHint(true), 1600)
    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    if (!open) return
    dialogRef.current?.focus()
    // Focus the search field on open so typing filters instantly —
    // no click into the box needed.
    searchRef.current?.focus({ preventScroll: true })
    const onKeyDown = (event: KeyboardEvent) => {
      // While searching, arrows belong to the field: Enter takes the
      // front match, Escape closes, nothing steps the deck by accident.
      if (isTyping(event.target)) {
        if (event.key === 'Enter') {
          event.preventDefault()
          choose()
        } else if (event.key === 'Escape') {
          event.preventDefault()
          close()
        }
        return
      }
      // IE/embedded WebViews deliver the legacy names, so accept both.
      if (event.key === 'ArrowLeft' || event.key === 'Left') {
        event.preventDefault()
        step(-1)
      } else if (event.key === 'ArrowRight' || event.key === 'Right') {
        event.preventDefault()
        step(1)
      } else if (event.key === 'Enter') {
        event.preventDefault()
        choose()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        close()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, step, close, choose])

  if (!open) {
    if (!hint) return null
    return (
      <div
        role="status"
        className="notice-in fixed top-[104px] right-4 z-(--z-dropdown) w-72 sm:top-[68px]"
      >
        <div className="ring-elevation relative bg-surface">
          <button
            type="button"
            onClick={openPicker}
            className="flex w-full items-start gap-3 p-4 pr-10 text-left transition-colors duration-150 ease-out hover:bg-surface-2"
          >
            <BrushIcon className="mt-0.5 size-5 shrink-0 text-brand" />
            <span>
              <span className="block font-sans text-sm font-medium text-text">
                {t('theme.change')}
              </span>
              <span className="mt-1 block text-[13px] leading-relaxed text-text-secondary">
                {t(
                  'Press T, or tap here. Inside Lingadevaru H P it is Super + Ctrl + Shift + Space.',
                )}
              </span>
            </span>
          </button>
          <button
            type="button"
            aria-label={t('theme.dismiss')}
            onClick={markHintSeen}
            className="absolute top-2 right-2 flex size-8 items-center justify-center text-text-muted transition-colors duration-150 ease-out hover:text-text"
          >
            <CrossIcon className="size-4" />
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-0 z-(--z-modal) isolate bg-black/55 supports-backdrop-filter:backdrop-blur-xs"
      />
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('theme.picker')}
        tabIndex={-1}
        // Swipe walks the deck. Touch only: a mouse drag across the dimmer is
        // how someone closes this, and stepping the cards instead would be a
        // surprise. A swipe that has travelled is not a tap, so the click it
        // ends with is swallowed rather than allowed to take a theme and close.
        onPointerDown={(event) => {
          if (event.pointerType !== 'touch') return
          swipe.current = { id: event.pointerId, from: event.clientX, moved: 0 }
        }}
        onPointerMove={(event) => {
          const drag = swipe.current
          if (event.pointerId !== drag.id) return
          drag.moved = event.clientX - drag.from
        }}
        onPointerUp={(event) => {
          const drag = swipe.current
          if (event.pointerId !== drag.id) return
          swipe.current = { ...drag, id: -1 }
          if (Math.abs(drag.moved) > 44) step(drag.moved < 0 ? 1 : -1)
        }}
        onClickCapture={(event) => {
          if (Math.abs(swipe.current.moved) <= 44) return
          swipe.current.moved = 0
          event.preventDefault()
          event.stopPropagation()
        }}
        // Disable native panning so it cannot cancel the deck's pointer gesture.
        className="fixed inset-0 z-(--z-modal) flex touch-none flex-col items-center justify-center outline-none"
        // Its own layer in the theme wipe (see theme-transition.css): kept out
        // of the page's snapshot so the page can be frosted as it is on
        // screen while the cards stay sharp, and both open along the slit.
        style={{ viewTransitionName: 'theme-picker' }}
      >
        {/* A click on the dimmer closes the picker. The dimmer itself is
          drawn above, outside the dialog; this is only its click target. */}
        <div aria-hidden="true" onClick={close} className="absolute inset-0" />

        {/* Search narrows the deck without stepping: type, Enter takes
            the front match, arrows keep working once the field blurs. */}
        <div className="pointer-events-auto relative z-10 mb-4 flex w-72 max-w-[80vw] items-center gap-2 border border-border-subtle bg-bg px-3 py-2">
          <SearchIcon className="size-4 shrink-0 text-text-muted" />
          <input
            ref={searchRef}
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
            placeholder={t(`Search ${SITE_THEMES.length} themes…`)}
            aria-label={t('theme.search')}
            className="theme-search-input w-full bg-transparent font-mono text-sm text-text outline-none placeholder:text-text-muted"
          />
          {query ? (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label={t('theme.clearSearch')}
              className="flex shrink-0 cursor-pointer items-center justify-center text-text-muted transition-colors duration-150 ease-out hover:text-text"
            >
              <CrossIcon className="size-3.5" />
            </button>
          ) : (
            <span className="shrink-0 font-mono text-[11px] text-text-muted">
              {matches.length}/{SITE_THEMES.length}
            </span>
          )}
        </div>

        <div
          className={cn(
            'pointer-events-none relative flex w-full items-center justify-center',
          )}
        >
          {matches.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <span className="font-sans text-lg font-medium text-text">
                {t('theme.noMatch')}
              </span>
              <span className="font-mono text-xs text-text-muted">
                {t('theme.clearToSee')}
              </span>
            </div>
          ) : (
            matches.map((theme, i) => {
            // Signed distance from the front card, wrapped so the fan is
            // symmetric around the front of the deck.
            const raw = i - index
            const half = matches.length / 2
            const offset =
              raw > half
                ? raw - matches.length
                : raw < -half
                  ? raw + matches.length
                  : raw
            const depth = Math.abs(offset)
            if (depth > 2) return null
            // Neighbours tuck in close behind the front card and stay solid,
            // just darkened, the way the OS stacks its deck. The first term
            // compensates for the front card being scale 1 against the sides'
            // 0.88, so every card's visible sliver comes out the same width;
            // a flat step per depth did not, the outer gaps ran wider.
            const shift =
              offset === 0 ? 0 : Math.sign(offset) * (6 + depth * 12)
            return (
              <div
                key={theme.id}
                aria-hidden={offset !== 0}
                className="absolute w-[min(68vw,46rem)] sm:w-[min(72vw,46rem)]"
                style={{
                  transform: `translateX(${shift}%) scale(${depth === 0 ? 1 : 0.88})`,
                  zIndex: 10 - depth,
                }}
              >
                <button
                  type="button"
                  tabIndex={-1}
                  aria-hidden={offset !== 0}
                  aria-label={
                    offset === 0 ? `Use ${theme.name}` : `Show ${theme.name}`
                  }
                  onClick={() => (offset === 0 ? choose() : step(offset))}
                  className="pointer-events-auto block w-full cursor-pointer [--card-dim:0.55] hover:[--card-dim:0.78]"
                >
                  <div
                    className={
                      'shadow-2xl ' + (depth === 0 ? 'bg-brand' : 'bg-zinc-500')
                    }
                    style={{ clipPath: PARALLELOGRAM }}
                  >
                    <div
                      className="bg-black"
                      style={{
                        clipPath: parallelogramInset(
                          depth === 0 ? '3px' : '1px',
                        ),
                      }}
                    >
                      <img
                        src={previewSrc(theme.id)}
                        alt={`${theme.name} theme preview`}
                        width={1800}
                        height={1012}
                        draggable={false}
                        // Retry an image failure once with a cache-buster.
                        onError={(event) => {
                          const img = event.currentTarget
                          if (img.dataset.retried) return
                          img.dataset.retried = ''
                          window.setTimeout(() => {
                            img.src = `${previewSrc(theme.id)}?retry`
                          }, 1000)
                        }}
                        className="w-full select-none object-cover"
                        style={{
                          aspectRatio: portrait ? '4 / 5' : '1800 / 1012',
                          filter:
                            depth === 0
                              ? undefined
                              : 'brightness(var(--card-dim))',
                        }}
                      />
                    </div>
                  </div>
                </button>
              </div>
            )
          })
          )}
          {/* Spacer that gives the absolute stack its height */}
          {matches.length > 0 ? (
            <div
              className="invisible w-[min(68vw,46rem)] sm:w-[min(72vw,46rem)]"
              style={{ aspectRatio: portrait ? '4 / 5' : '1800 / 1012' }}
            />
          ) : null}
        </div>

        {matches.length > 0 && matches[index] ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={`Use ${matches[index].name}`}
            onClick={choose}
          className={cn(
            'relative mt-1.5 cursor-pointer px-4 py-3.5 text-center transition-[filter] duration-150 ease-out hover:brightness-125',
          )}
        >
          <span
            data-theme={matches[index].id}
            className="block font-sans text-2xl font-semibold tracking-tight"
            style={{
              color: matches[index].light ? 'var(--t-bg)' : 'var(--t-text)',
              WebkitTextStroke: matches[index].light
                ? '2px var(--t-text)'
                : '2px var(--t-bg)',
              paintOrder: 'stroke fill',
            }}
          >
            {matches[index].name}
          </span>
          </button>
        ) : null}

        <button
          type="button"
          aria-label={t('theme.prev')}
          onClick={(e) => {
            e.stopPropagation()
            step(-1)
          }}
          className={cn(
            'absolute left-3 top-1/2 flex size-11 cursor-pointer -translate-y-1/2 items-center justify-center border border-border-subtle bg-bg text-text transition-colors duration-150 ease-out hover:bg-surface-2 sm:left-6',
          )}
        >
          <ChevronLeftIcon className="size-5" />
        </button>
        <button
          type="button"
          aria-label={t('theme.next')}
          onClick={(e) => {
            e.stopPropagation()
            step(1)
          }}
          className={cn(
            'absolute right-3 top-1/2 flex size-11 cursor-pointer -translate-y-1/2 items-center justify-center border border-border-subtle bg-bg text-text transition-colors duration-150 ease-out hover:bg-surface-2 sm:right-6',
          )}
        >
          <ChevronRightIcon className="size-5" />
        </button>
      </div>
    </>
  )
}
