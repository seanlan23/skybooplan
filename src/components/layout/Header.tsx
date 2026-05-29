'use client'
import Link from 'next/link'
import Image from 'next/image'
import { LanguageSelector } from '@/components/layout/LanguageSelector'
import { UserMenu } from '@/components/auth/LoginModal'
import { useTranslations } from '@/i18n/LocaleProvider'

export default function Header() {
  const { t } = useTranslations()

  const navItems = [
    { key: 'nav.flights', href: '#' },
    { key: 'nav.accommodations', href: '#' },
    { key: 'nav.aiPlanner', href: '#' },
  ] as const

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
      {/* BACKUP container: max-w-6xl mx-auto px-4 py-3 flex items-center justify-between */}
      <div className="w-full px-4 md:px-8 py-3 flex items-center justify-between">
        {/*
          BACKUP — podvojen logotip (ikona + besedilo ločeno):
          <Link href="/" className="flex items-center gap-3 group min-h-[40px] py-0.5">
            <Image src="/logo.png" alt="skybooplan" width={42} height={42}
              className="shrink-0 w-[42px] h-[42px] object-contain" priority />
            <span className="font-display font-bold text-slate-900 text-[1.35rem] leading-none tracking-tight">
              sky<span className="text-sky-500">boo</span>plan
            </span>
          </Link>
          BACKUP — SVG ikona (SkybooplanLogoMark) + besedilo, src="/logo-icon.png"
        */}
        <Link
          href="/"
          className="flex items-center shrink-0 py-0.5"
          aria-label={t('nav.homeAria')}
        >
          {/* BACKUP velikost logotipa: h-12 max-w-[min(240px,50vw)], header h-14 */}
          {/* BACKUP velikost logotipa: h-14 max-w-[min(320px,62vw)], header h-16 */}
          <Image
            src="/full-logo.png"
            alt="skybooplan"
            width={2816}
            height={1536}
            className="h-[168px] w-auto max-w-[min(960px,95vw)] object-contain"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.key}
              href={item.href}
              className="px-3 py-1.5 text-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 rounded-lg transition-colors"
            >
              {t(item.key)}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <UserMenu />
          <LanguageSelector />
        </div>
      </div>
    </header>
  )
}
