'use client'

import '@/lib/safeUrl'
import { SessionProvider } from 'next-auth/react'
import { LocaleProvider } from '@/i18n/LocaleProvider'
import { AuthSessionBridge, LoginModal } from '@/components/auth/LoginModal'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <LocaleProvider>
        {children}
        <LoginModal />
        <AuthSessionBridge />
      </LocaleProvider>
    </SessionProvider>
  )
}
