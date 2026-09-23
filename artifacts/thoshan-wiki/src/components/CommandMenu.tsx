import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'wouter'
import { Linkedin, MessageCircle, UserRound } from 'lucide-react'
import { useSearch } from '@/contexts/SearchContext'
import {
  GithubIcon,
  PageIcon,
  PaletteIcon,
  SearchIcon,
} from '@/components/icons'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { ThoshanMark } from '@/components/Brand'
import { OPEN_PICKER_EVENT } from '@/lib/theme'
import { toggleChatPanel } from '@/lib/chat-panel'
import type { CommandIcon, CommandItem } from '@/lib/command-menu'
import {
  OPEN_PALETTE_EVENT,
  childrenOf,
  everyRow,
  filterRows,
  opensMenu,
} from '@/lib/command-menu'
import { useLocale } from '@/contexts/LocaleContext'
import { SUPPORTED_LOCALES, openLocaleNewTab } from '@/i18n/supportedLocales'

const LABEL_KEY: Record<string, string> = {
  home: 'menu.home',
  wiki: 'menu.wikiHome',
  articles: 'menu.articles',
  search: 'menu.search',
  themes: 'menu.themes',
  language: 'menu.language',
  github: 'menu.github',
  linkedin: 'menu.linkedin',
  chat: 'menu.chat',
  about: 'menu.about',
}

/**
 * Site-wide command menu, copied from the omarchy-site SearchPalette pattern:
 * a narrow card, mono rows, prompt line instead of a field, destinations on
 * screen before anything is typed. Typing filters; submenus (Language) walk
 * with arrows/Enter/Backspace/Escape like the desktop menu.
 */

const ICONS: Record<CommandIcon, typeof PageIcon> = {
  home: ThoshanMark as unknown as typeof PageIcon,
  wiki: PageIcon,
  articles: PageIcon,
  search: SearchIcon,
  themes: PaletteIcon,
  language: GlobeIcon,
  github: GithubIcon,
  linkedin: Linkedin as unknown as typeof PageIcon,
  chat: MessageCircle as unknown as typeof PageIcon,
  about: UserRound as unknown as typeof PageIcon,
}

export function CommandMenu() {
  const [, setLocation] = useLocation()
  const { openSearch, closeSearch } = useSearch()
  const { t } = useLocale()

  const labelFor = (item: CommandItem): string => {
    if (item.id.startsWith('language.')) {
      const code = item.id.slice('language.'.length)
      const entry = SUPPORTED_LOCALES.find((l) => l.code === code)
      if (!entry) return item.label
      // Native script + English name in brackets so every reader can identify it.
      return entry.code === 'en' ? entry.native : `${entry.native} (${entry.name})`
    }
    const key = LABEL_KEY[item.id]
    return key ? t(key) : item.label
  }
  const titleFor = (menuId: string): string =>
    menuId === 'root' ? t('menu.go') : labelFor({ id: menuId } as CommandItem)
  const input = useRef<HTMLInputElement>(null)
  const list = useRef<HTMLUListElement>(null)
  const pointer = useRef({ x: -1, y: -1 })
  const scroller = useRef<HTMLDivElement>(null)
  const restore = useRef<HTMLElement | null>(null)

  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [menu, setMenu] = useState('root')
  const [active, setActive] = useState(0)

  const show = useCallback(() => {
    // Only one overlay at a time: never stack on the search modal.
    closeSearch()
    restore.current = document.activeElement as HTMLElement | null
    setOpen(true)
    setQuery('')
    setMenu('root')
    setActive(0)
  }, [closeSearch])

  const close = useCallback(() => {
    setOpen(false)
    restore.current?.focus({ focusVisible: false })
  }, [])

  const searching = menu === 'root' && query.trim().length > 0
  const rows = useMemo<CommandItem[]>(() => {
    const own = searching ? everyRow() : childrenOf(menu)
    const labeled = own.map((item) => {
      if (item.id.startsWith('language.')) {
        const code = item.id.slice('language.'.length)
        const entry = SUPPORTED_LOCALES.find((l) => l.code === code)
        return {
          ...item,
          label: !entry
            ? item.label
            : entry.code === 'en'
              ? entry.native
              : `${entry.native} (${entry.name})`,
        }
      }
      const key = LABEL_KEY[item.id]
      return key ? { ...item, label: t(key) } : item
    })
    return filterRows(labeled, query)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searching, menu, query, t])

  useEffect(() => setActive(0), [menu, query])

  useEffect(() => {
    const onRequest = () => show()
    window.addEventListener(OPEN_PALETTE_EVENT, onRequest)
    return () => window.removeEventListener(OPEN_PALETTE_EVENT, onRequest)
  }, [show])

  useEffect(() => {
    if (open) input.current?.focus()
  }, [open ])

  useEffect(() => {
    const box = scroller.current
    const row = list.current?.children[active] as HTMLElement | undefined
    if (!box || !row) return
    const view = box.getBoundingClientRect()
    const rect = row.getBoundingClientRect()
    if (rect.top < view.top) box.scrollTop -= view.top - rect.top
    else if (rect.bottom > view.bottom) box.scrollTop += rect.bottom - view.bottom
  }, [active, rows])

  if (!open) return null

  const goItem = (item: CommandItem) => {
    if (opensMenu(item)) {
      setMenu(item.id)
      setQuery('')
      return
    }
    if (item.action === 'search') {
      close()
      openSearch()
      return
    }
    if (item.action === 'themes') {
      close()
      window.dispatchEvent(new CustomEvent(OPEN_PICKER_EVENT))
      return
    }
    if (item.action === 'chat') {
      close()
      toggleChatPanel()
      return
    }
    if (item.locale) {
      close()
      openLocaleNewTab(item.locale)
      return
    }
    close()
    if (item.href) {
      window.location.href = item.href
      return
    }
    if (item.to) setLocation(item.to)
  }

  const back = () => {
    setQuery('')
    setMenu((at) =>
      at.includes('.') ? at.slice(0, at.lastIndexOf('.')) : 'root',
    )
  }

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      if (query) setQuery('')
      else if (menu !== 'root') back()
      else close()
      return
    }
    if (
      (event.key === 'Backspace' || event.key === 'ArrowLeft') &&
      !query &&
      menu !== 'root'
    ) {
      event.preventDefault()
      back()
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      if (rows.length === 0) return
      event.preventDefault()
      const step = event.key === 'ArrowDown' ? 1 : -1
      setActive((at) => Math.min(rows.length - 1, Math.max(0, at + step)))
    } else if (event.key === 'Enter' || event.key === 'ArrowRight') {
      const row = rows[active]
      if (!row) return
      if (event.key === 'ArrowRight' && !opensMenu(row)) return
      event.preventDefault()
      goItem(row)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Site menu"
      onKeyDown={onKeyDown}
      className="command-palette"
    >
      <div aria-hidden="true" onClick={close} className="command-backdrop" />
      <div className="command-card">
        <div className="command-prompt">
          <input
            ref={input}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={`${titleFor(menu)}…`}
            aria-label="Site menu"
            autoComplete="off"
            spellCheck={false}
            enterKeyHint="go"
            className="command-input"
          />
        </div>
        <div
          ref={scroller}
          className="command-list-scroll"
        >
          {rows.length === 0 ? (
            <p className="command-empty">Nothing matches {query.trim()}.</p>
          ) : (
            <ul ref={list} role="listbox" aria-label="Menu" className="command-list">
              {rows.map((row, at) => {
                const Icon = ICONS[row.icon]
                return (
                  <li key={row.id}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={at === active}
                      tabIndex={-1}
                      onPointerDown={(event) => event.preventDefault()}
                      onClick={() => goItem(row)}
                      onPointerMove={(event) => {
                        if (
                          event.clientX === pointer.current.x &&
                          event.clientY === pointer.current.y
                        )
                          return
                        pointer.current = { x: event.clientX, y: event.clientY }
                        setActive(at)
                      }}
                      className={
                        'command-row' + (at === active ? ' command-row-active' : '')
                      }
                    >
                      {row.glyph ? (
                        <span aria-hidden="true" className="command-glyph">
                          {row.glyph}
                        </span>
                      ) : (
                        <Icon className="size-4 shrink-0 opacity-80" />
                      )}
                      <span dir="auto" className="command-label">
                        {row.label}
                      </span>
                      {opensMenu(row) ? (
                        <span aria-hidden="true" className="command-chevron">
                          ›
                        </span>
                      ) : null}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
