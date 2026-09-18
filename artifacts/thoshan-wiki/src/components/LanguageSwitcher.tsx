import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { GlobeIcon } from '@/components/icons/GlobeIcon'
import { LOCALE_EVENT } from '@/lib/command-menu'

/**
 * Language popup, copied from the omarchy-site LanguageSwitcher pattern
 * (globe icon trigger → bottom-aligned popup list with flag + name rows).
 * Omarchy uses @base-ui/react Popover; here we use the repo's existing
 * Radix dropdown-menu primitive — same trigger/menu/row structure.
 * Default: English. Options: Kannada, Hindi.
 */
const LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇬🇧' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
] as const

const STORAGE_KEY = 'thoshan-wiki-locale'

export function readLocale(): string {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && LANGUAGES.some((l) => l.code === saved)) return saved
  } catch {
    /* storage unavailable */
  }
  return 'en'
}

export function LanguageSwitcher({
  triggerClassName = 'header-icon-button',
}: {
  triggerClassName?: string
} = {}) {
  const [locale, setLocale] = useState('en')

  useEffect(() => {
    setLocale(readLocale())
    const onLocale = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: string }>).detail?.locale
      if (next && LANGUAGES.some((l) => l.code === next)) setLocale(next)
    }
    window.addEventListener(LOCALE_EVENT, onLocale)
    return () => window.removeEventListener(LOCALE_EVENT, onLocale)
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale
    try {
      localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      /* storage unavailable */
    }
  }, [locale])

  const active = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={triggerClassName}
        aria-label={`Language: ${active.name}`}
        data-testid="button-language"
      >
        <GlobeIcon className="size-[18px]" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-56">
        <DropdownMenuLabel>Language</DropdownMenuLabel>
        {LANGUAGES.map((entry) => (
          <DropdownMenuItem
            key={entry.code}
            onSelect={() => setLocale(entry.code)}
            aria-current={entry.code === locale ? 'true' : undefined}
            className="flex items-center gap-3"
          >
            <span aria-hidden="true" className="text-base">
              {entry.flag}
            </span>
            <span dir="auto">{entry.native}</span>
            {entry.code === locale ? (
              <Check size={15} className="ml-auto" aria-hidden="true" />
            ) : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
