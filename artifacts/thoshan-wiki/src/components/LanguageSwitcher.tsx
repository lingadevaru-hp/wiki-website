import { Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { SUPPORTED_LOCALES, localeHost, localeUrl } from '@/i18n/supportedLocales'
import { useLocale } from '@/contexts/LocaleContext'
import { LOCALE_EVENT } from '@/lib/command-menu'

/**
 * Language popup: globe icon → dropdown with English (default), Kannada, Hindi.
 * Selecting a language redirects to the same path on that locale's subdomain
 * (single codebase, single worker — only the dictionary differs).
 */
export function LanguageSwitcher({
  triggerClassName = 'header-icon-button',
}: {
  triggerClassName?: string
} = {}) {
  const { locale, t } = useLocale()

  const active =
    SUPPORTED_LOCALES.find((l) => l.code === locale) ?? SUPPORTED_LOCALES[0]

  const go = (code: string) => {
    if (code === locale) return
    const host = window.location.hostname
    const targetHost = localeHost(code)
    // Local dev / unknown host: swap in place via locale event (no redirect).
    if (host === 'localhost' || host === '127.0.0.1' || targetHost === host) {
      window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale: code } }))
      return
    }
    window.location.href = localeUrl(
      code,
      window.location.pathname,
      window.location.search,
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClassName}
        aria-label={`${t('lang.language')}: ${active.name}`}
        data-testid="button-language"
      >
        <GlobeIcon className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-56">
        <DropdownMenuLabel>{t('lang.language')}</DropdownMenuLabel>
        {SUPPORTED_LOCALES.map((entry) => (
          <DropdownMenuItem
            key={entry.code}
            onSelect={() => go(entry.code)}
            aria-current={entry.code === locale ? 'true' : undefined}
            className="flex items-center gap-3"
          >
            <span aria-hidden="true" className="text-base">
              {entry.flag}
            </span>
            <span dir="auto" lang={entry.code}>
              {entry.native}
            </span>
            {entry.code === locale ? (
              <Check size={15} className="ml-auto" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
