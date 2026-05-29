import {
  de,
  enGB,
  es,
  fr,
  hr,
  it,
  ja,
  nl,
  pl,
  pt,
  ru,
  sl,
  tr,
  zhCN,
  type Locale as DateFnsLocale,
} from 'date-fns/locale'
import type { Locale } from '@/i18n/config'

const DATE_FNS_LOCALES: Record<Locale, DateFnsLocale> = {
  sl,
  en: enGB,
  de,
  es,
  fr,
  it,
  hr,
  pt,
  nl,
  pl,
  tr,
  zh: zhCN,
  ar: enGB,
  ru,
  ja,
}

export function getDateFnsLocale(locale: Locale): DateFnsLocale {
  return DATE_FNS_LOCALES[locale] ?? sl
}
