import { Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import {
  SUPPORTED_LOCALES,
  localeUrl,
  openLocaleSameTab,
} from '@/i18n/supportedLocales'
import { useLocale } from '@/contexts/LocaleContext'

/**
 * Language popup: globe icon → dropdown with every SUPPORTED_LOCALES entry.
 * Plain click / tap switches in the SAME tab (single codebase, single
 * worker — only the dictionary differs). Each row is a real <a href> so
 * Ctrl/Cmd+click, middle-click, or right-click → "Open in new tab" still
 * opens a new tab natively. No window.open, no popups.
 */
export function LanguageSwitcher({
  triggerClassName = 'header-icon-button',
}: {
  triggerClassName?: string
} = {}) {
  const { locale, t } = useLocale()

  const active =
    SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0]

  const go = (code: string, event: React.MouseEvent) => {
    if (code === locale) {
      event.preventDefault()
      return
    }
    // Modified clicks (Ctrl/Cmd+click, middle button) and right-click →
    // "Open in new tab" follow the <a href> natively. Plain click swaps
    // in the same tab; localhost debug swaps in place via locale event.
    if (
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      event.button === 1
    ) {
      return
    }
    event.preventDefault()
    // Subdomain switches (including back to English) stay in the SAME tab.
    openLocaleSameTab(code)
  }

  // Localhost debug has no subdomains — rows swap the dictionary in
  // place via locale event instead of navigating.
  const isLocalHost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  const hrefFor = (code: string) =>
    isLocalHost
      ? `?lang=${code}`
      : localeUrl(
          code,
          typeof window === 'undefined' ? '/' : window.location.pathname,
          typeof window === 'undefined' ? '' : window.location.search,
        )

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        className={triggerClassName}
        aria-label={`${t('lang.language')}: ${active.name}`}
        data-testid="button-language"
      >
        <GlobeIcon className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        side="bottom"
        sideOffset={10}
        collisionPadding={12}
        avoidCollisions
        sticky="always"
        hideWhenDetached={false}
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-56 wiki-lang-menu"
      >
        <DropdownMenuLabel>{t('lang.language')}</DropdownMenuLabel>
        {SUPPORTED_LOCALES.map((entry) =>
          isLocalHost ? (
            <DropdownMenuItem
              key={entry.code}
              onSelect={() => openLocaleSameTab(entry.code)}
              aria-current={entry.code === locale ? 'true' : undefined}
              className="flex items-center gap-3"
            >
              <span aria-hidden="true" className="text-base">
                {entry.flag}
              </span>
              <span dir="auto" lang={entry.code}>
                {entry.native}
                {entry.code === "en" ? null : (
                  <span className="ml-1 opacity-60">({entry.name})</span>
                )}
              </span>
              {entry.code === locale ? (
                <Check size={15} className="ml-auto" aria-hidden="true" />
              ) : null}
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem key={entry.code} asChild>
              <a
                href={hrefFor(entry.code)}
                hrefLang={entry.code}
                onClick={(event) => go(entry.code, event)}
                aria-current={entry.code === locale ? 'true' : undefined}
                className="flex items-center gap-3"
              >
                <span aria-hidden="true" className="text-base">
                  {entry.flag}
                </span>
                <span dir="auto" lang={entry.code}>
                  {entry.native}
                  {entry.code === "en" ? null : (
                    <span className="ml-1 opacity-60">({entry.name})</span>
                  )}
                </span>
                {entry.code === locale ? (
                  <Check size={15} className="ml-auto" aria-hidden="true" />
                ) : null}
              </a>
            </DropdownMenuItem>
          ),
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
