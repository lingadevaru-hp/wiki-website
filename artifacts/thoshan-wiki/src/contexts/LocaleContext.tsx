import { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  DEFAULT_LOCALE,
  detectLocale,
  isSupportedLocale,
  localeEntry,
} from "../i18n/supportedLocales";

const STORAGE_KEY = "thoshan-wiki-locale";
export const LOCALE_EVENT = "thoshan:locale";

type Dictionary = Record<string, string>;

type LocaleContextValue = {
  locale: string;
  /** Translate a key; falls back to the key itself (English source). */
  t: (key: string) => string;
  loadLocale: (code: string) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: DEFAULT_LOCALE,
  t: (key) => key,
  loadLocale: () => {},
});

async function fetchDictionary(code: string): Promise<Dictionary> {
  try {
    const res = await fetch(`/locales/${code}.json`);
    if (!res.ok) throw new Error(`locale ${code} missing`);
    return (await res.json()) as Dictionary;
  } catch {
    /* missing file -> English fallback */
    return {};
  }
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_LOCALE;
    const detected = detectLocale(window.location.hostname, window.location.search);
    if (detected !== DEFAULT_LOCALE) return detected;
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (isSupportedLocale(saved)) return saved;
    } catch {
      /* ignore */
    }
    return DEFAULT_LOCALE;
  });
  const [dict, setDict] = useState<Dictionary>({});

  const applyLocale = useCallback(async (code: string) => {
    const next = isSupportedLocale(code) ? code : DEFAULT_LOCALE;
    const entry = localeEntry(next);
    setLocaleState(next);
    setDict(next === DEFAULT_LOCALE ? {} : await fetchDictionary(next));
    document.documentElement.lang = next;
    document.documentElement.dir = entry.dir;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore */
    }
    if (import.meta.env?.DEV) console.info("[locale]", next, window.location.hostname);
    window.dispatchEvent(new CustomEvent(LOCALE_EVENT, { detail: { locale: next } }));
  }, []);

  useEffect(() => {
    void applyLocale(locale);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Stay in sync when globe/palette dispatch LOCALE_EVENT (redirect or in-place).
  useEffect(() => {
    const onLocale = (event: Event) => {
      const next = (event as CustomEvent<{ locale?: string }>).detail?.locale;
      if (next && next !== locale) void applyLocale(next);
    };
    window.addEventListener(LOCALE_EVENT, onLocale);
    return () => window.removeEventListener(LOCALE_EVENT, onLocale);
  }, [locale, applyLocale]);

  const t = useCallback((key: string) => dict[key] ?? key, [dict]);

  return <LocaleContext.Provider value={{ locale, t, loadLocale: (c) => void applyLocale(c) }}>{children}</LocaleContext.Provider>;
}

export const useLocale = () => useContext(LocaleContext);
