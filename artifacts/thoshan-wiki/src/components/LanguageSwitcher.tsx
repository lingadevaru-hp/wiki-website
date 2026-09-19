import { Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { SUPPORTED_LOCALES, openLocaleNewTab } from '@/i18n/supportedLocales'
import { useLocale } from '@/contexts/LocaleContext'

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
    // Subdomain switches (including back to English) open in a NEW tab.
    openLocaleNewTab(code)
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
