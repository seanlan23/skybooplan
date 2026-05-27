'use client'

import { createContext, useContext, useEffect, useMemo } from 'react'
import { isRtlLocale, type Locale } from '@/i18n/config'
import { translate } from '@/i18n/getMessage'
import { messages } from '@/i18n/messages'
import type { Messages } from '@/i18n/messages/types'
import { useLocaleStore } from '@/store/useLocaleStore'

export type TranslateFn = (
  key: string,
  params?: Record<string, string | number>
) => string

interface LocaleContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: TranslateFn
  messages: Messages
}

const LocaleContext = createContext<LocaleContextValue | null>(null)

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const locale = useLocaleStore((s) => s.locale)
  const setLocale = useLocaleStore((s) => s.setLocale)

  const activeMessages = messages[locale] ?? messages.sl

  const t = useMemo<TranslateFn>(() => {
    return (key, params) => translate(activeMessages, key, params)
  }, [activeMessages])

  useEffect(() => {
    document.documentElement.lang = locale
    document.documentElement.dir = isRtlLocale(locale) ? 'rtl' : 'ltr'
  }, [locale])

  const value = useMemo(
    () => ({ locale, setLocale, t, messages: activeMessages }),
    [locale, setLocale, t, activeMessages]
  )

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale() {
  const ctx = useContext(LocaleContext)
  if (!ctx) {
    throw new Error('useLocale must be used within LocaleProvider')
  }
  return ctx
}

export function useTranslations() {
  const { t, locale } = useLocale()
  return { t, locale }
}
