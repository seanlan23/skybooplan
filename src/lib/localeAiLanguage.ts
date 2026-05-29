import { LOCALE_LABELS, type Locale } from '@/i18n/config'

/** Full language name for AI system prompts (e.g. "Slovenian", "English"). */
export function getAiResponseLanguage(locale: Locale | string | undefined): string {
  if (locale && locale in LOCALE_LABELS) {
    return LOCALE_LABELS[locale as Locale]
  }
  return LOCALE_LABELS.sl
}
