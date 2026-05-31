'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { signIn, signOut, useSession } from 'next-auth/react'
import { ChevronDown, Loader2, LogOut, Map, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'
import { savePendingExportAction } from '@/lib/authPendingExport'
import { useAuthUiStore } from '@/store/useAuthUiStore'

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  )
}

export function LoginModal() {
  const { t } = useTranslations()
  const { status } = useSession()
  const loginModalOpen = useAuthUiStore((s) => s.loginModalOpen)
  const pendingAction = useAuthUiStore((s) => s.pendingAction)
  const closeLoginModal = useAuthUiStore((s) => s.closeLoginModal)

  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    if (!loginModalOpen) {
      setMode('login')
      setEmail('')
      setPassword('')
      setConfirmPassword('')
      setError(null)
      setIsSubmitting(false)
    }
  }, [loginModalOpen])

  useEffect(() => {
    if (loginModalOpen && status === 'authenticated') {
      closeLoginModal()
    }
  }, [loginModalOpen, status, closeLoginModal])

  if (!loginModalOpen) return null

  async function handleGoogleLogin() {
    setError(null)
    if (pendingAction) savePendingExportAction(pendingAction)
    await signIn('google', { callbackUrl: `${window.location.origin}/` })
  }

  async function handleCredentialsSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (mode === 'register') {
      if (password !== confirmPassword) {
        setError(t('auth.passwordMismatch'))
        return
      }
      setIsSubmitting(true)
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        })
        const data = (await res.json()) as { error?: string }
        if (!res.ok) {
          if (data.error === 'EMAIL_EXISTS') setError(t('auth.emailExists'))
          else if (data.error === 'WEAK_PASSWORD') setError(t('auth.weakPassword'))
          else setError(t('auth.genericError'))
          return
        }
      } catch {
        setError(t('auth.genericError'))
        return
      } finally {
        setIsSubmitting(false)
      }
    }

    setIsSubmitting(true)
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })
      if (result?.error) {
        setError(t('auth.invalidCredentials'))
        return
      }
      closeLoginModal()
    } catch {
      setError(t('auth.genericError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="login-modal-title"
    >
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px]"
        aria-label={t('auth.closeAria')}
        onClick={closeLoginModal}
      />

      <div className="relative w-full max-w-md rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden">
        <button
          type="button"
          onClick={closeLoginModal}
          className="absolute top-3 right-3 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          aria-label={t('auth.closeAria')}
        >
          <X className="w-5 h-5" />
        </button>

        <div className="px-6 pt-8 pb-6">
          <div className="flex justify-center mb-5">
            <Image
              src="/full-logo.png"
              alt="skybooplan"
              width={200}
              height={80}
              className="h-12 w-auto object-contain"
            />
          </div>

          <h2 id="login-modal-title" className="text-xl font-bold text-slate-900 text-center">
            {t('auth.modalTitle')}
          </h2>
          <p className="mt-2 text-sm text-slate-500 text-center leading-relaxed">
            {t('auth.modalSubtitle')}
          </p>

          <div className="mt-6 space-y-4">
            <button
              type="button"
              onClick={() => void handleGoogleLogin()}
              disabled={isSubmitting}
              className={cn(
                'w-full inline-flex items-center justify-center gap-3 rounded-xl border border-slate-200',
                'bg-white px-4 py-3 text-sm font-semibold text-slate-700',
                'hover:bg-slate-50 hover:border-slate-300 transition-colors',
                'disabled:opacity-60 disabled:cursor-not-allowed'
              )}
            >
              <GoogleIcon />
              {t('auth.googleLogin')}
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-slate-200" />
              <span className="text-xs text-slate-400 font-medium">{t('auth.dividerOr')}</span>
              <div className="flex-1 border-t border-slate-200" />
            </div>

            <form onSubmit={(e) => void handleCredentialsSubmit(e)} className="space-y-3">
              <div>
                <label htmlFor="auth-email" className="sr-only">
                  {t('auth.emailLabel')}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t('auth.emailLabel')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                />
              </div>

              <div>
                <label htmlFor="auth-password" className="sr-only">
                  {t('auth.passwordLabel')}
                </label>
                <input
                  id="auth-password"
                  type="password"
                  autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('auth.passwordLabel')}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                />
              </div>

              {mode === 'register' ? (
                <div>
                  <label htmlFor="auth-confirm-password" className="sr-only">
                    {t('auth.confirmPasswordLabel')}
                  </label>
                  <input
                    id="auth-confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t('auth.confirmPasswordLabel')}
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-100 focus:border-sky-400"
                  />
                </div>
              ) : null}

              {error ? (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                  {error}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className={cn(
                  'w-full rounded-xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white',
                  'hover:bg-sky-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
                  'inline-flex items-center justify-center gap-2'
                )}
              >
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {mode === 'login' ? t('auth.loginButton') : t('auth.registerButton')}
              </button>
            </form>

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login')
                setError(null)
              }}
              className="w-full text-center text-xs text-sky-600 hover:text-sky-700 font-medium"
            >
              {mode === 'login' ? t('auth.registerLink') : t('auth.haveAccount')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function userInitials(name?: string | null, email?: string | null): string {
  const source = name?.trim() || email?.trim() || '?'
  const parts = source.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  return source.slice(0, 2).toUpperCase()
}

export function UserMenu() {
  const { t } = useTranslations()
  const { data: session, status } = useSession()
  const openLoginModal = useAuthUiStore((s) => s.openLoginModal)
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  if (status === 'loading') {
    return <div className="w-9 h-9 rounded-full bg-slate-100 animate-pulse" aria-hidden />
  }

  if (!session?.user) {
    return (
      <button
        type="button"
        onClick={() => openLoginModal()}
        className="px-3 py-1.5 text-sm font-semibold text-sky-700 hover:text-sky-800 hover:bg-sky-50 rounded-lg transition-colors"
      >
        {t('auth.login')}
      </button>
    )
  }

  const image = session.user.image
  const initials = userInitials(session.user.name, session.user.email)

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-1 pr-2 py-1 hover:border-sky-200 hover:bg-sky-50/50 transition-colors"
        aria-expanded={open}
        aria-haspopup="menu"
      >
        {image ? (
          <img
            src={image}
            alt=""
            className="w-8 h-8 rounded-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="w-8 h-8 rounded-full bg-sky-600 text-white text-xs font-bold inline-flex items-center justify-center">
            {initials}
          </span>
        )}
        <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>

      {open ? (
        <div
          role="menu"
          className="absolute right-0 top-full mt-2 z-50 min-w-[180px] rounded-xl border border-slate-200 bg-white shadow-lg py-1 overflow-hidden"
        >
          <Link
            href="/dashboard"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50"
          >
            <Map className="w-4 h-4 text-slate-400" />
            {t('auth.myPlans')}
          </Link>
          <Link
            href="/login"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-500 hover:bg-slate-50 border-t border-slate-100"
          >
            {t('auth.login')} (račun za plane)
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              void signOut({ callbackUrl: '/' })
            }}
            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 text-left border-t border-slate-100"
          >
            <LogOut className="w-4 h-4 text-slate-400" />
            {t('auth.logout')}
          </button>
        </div>
      ) : null}
    </div>
  )
}

export function AuthSessionBridge() {
  const { status } = useSession()
  const pendingAction = useAuthUiStore((s) => s.pendingAction)
  const clearPendingAction = useAuthUiStore((s) => s.clearPendingAction)
  const closeLoginModal = useAuthUiStore((s) => s.closeLoginModal)

  useEffect(() => {
    if (status !== 'authenticated') return
    if (pendingAction) {
      closeLoginModal()
    }
  }, [status, pendingAction, closeLoginModal])

  return null
}
