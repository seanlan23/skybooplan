'use client'

import { LocaleProvider } from '@/i18n/LocaleProvider'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <LocaleProvider>{children}</LocaleProvider>
}
