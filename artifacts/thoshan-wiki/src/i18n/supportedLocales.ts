/**
 * Single source of truth for supported locales.
 * Add a language = add one entry here + one public/locales/<code>.json + one DNS record.
 * Everything else (globe menu, palette submenu, validation) reads this file.
 */
export type SupportedLocale = {
  code: string;
  name: string;
  native: string;
  flag: string;
  dir: "ltr" | "rtl";
  /** Production host serving this locale. */
  host: string;
};

export const DEFAULT_LOCALE = "en";

export const SUPPORTED_LOCALES: SupportedLocale[] = [
  { code: "en", name: "English", native: "English", flag: "🇬🇧", dir: "ltr", host: "lingadevaru.in" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳", dir: "ltr", host: "kn.lingadevaru.in" },
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳", dir: "ltr", host: "hi.lingadevaru.in" },
];

export const isSupportedLocale = (code: string | null | undefined): code is string =>
  !!code && SUPPORTED_LOCALES.some((l) => l.code === code);

export const localeEntry = (code: string): SupportedLocale =>
  SUPPORTED_LOCALES.find((l) => l.code === code) ?? SUPPORTED_LOCALES[0];

export const localeHost = (code: string): string => localeEntry(code).host;

/** Detect locale from hostname (?lang= override for local debug without DNS). */
export function detectLocale(hostname: string, search = ""): string {
  try {
    const param = new URLSearchParams(search).get("lang");
    if (isSupportedLocale(param)) return param;
  } catch {
    /* ignore */
  }
  const found = SUPPORTED_LOCALES.find(
    (l) => l.code !== "en" && (hostname === l.host || hostname.startsWith(l.code + "."))
  );
  return found ? found.code : DEFAULT_LOCALE;
}

/** Absolute URL of the same path on another locale's host. */
export function localeUrl(code: string, pathname: string, search = ""): string {
  return `https://${localeHost(code)}${pathname}${search}`;
}
