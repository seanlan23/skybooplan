export const LOCALES = [
  'en',
  'de',
  'es',
  'fr',
  'it',
  'sl',
  'hr',
  'pt',
  'nl',
  'pl',
  'tr',
  'zh',
  'ar',
  'ru',
  'ja',
] as const

export type Locale = (typeof LOCALES)[number]

export const DEFAULT_LOCALE: Locale = 'sl'

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  es: 'Español',
  fr: 'Français',
  it: 'Italiano',
  sl: 'Slovenščina',
  hr: 'Hrvatski',
  pt: 'Português',
  nl: 'Nederlands',
  pl: 'Polski',
  tr: 'Türkçe',
  zh: '中文',
  ar: 'العربية',
  ru: 'Русский',
  ja: '日本語',
}

export const LOCALE_FLAGS: Record<Locale, string> = {
  en: '🇬🇧',
  de: '🇩🇪',
  es: '🇪🇸',
  fr: '🇫🇷',
  it: '🇮🇹',
  sl: '🇸🇮',
  hr: '🇭🇷',
  pt: '🇵🇹',
  nl: '🇳🇱',
  pl: '🇵🇱',
  tr: '🇹🇷',
  zh: '🇨🇳',
  ar: '🇸🇦',
  ru: '🇷🇺',
  ja: '🇯🇵',
}

export function isRtlLocale(locale: Locale | string): boolean {
  return locale === 'ar' || locale === 'he'
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value)
}
