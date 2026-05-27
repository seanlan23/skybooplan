'use client'

import { useEffect, useRef, useState } from 'react'
import { Globe } from 'lucide-react'
import { LOCALES, LOCALE_FLAGS, LOCALE_LABELS } from '@/i18n/config'
import { useLocale } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

export function LanguageSelector() {
  const { locale, setLocale, t } = useLocale()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white',
          'px-2.5 py-1.5 text-xs font-semibold text-slate-600 shadow-sm',
          'hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/60 transition-colors'
        )}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t('nav.selectLanguage')}
      >
        <Globe className="w-4 h-4 text-sky-600 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{LOCALE_FLAGS[locale]}</span>
        <span className="uppercase tracking-wide">{locale}</span>
      </button>

      {open ? (
        <ul
          role="listbox"
          aria-label={t('nav.language')}
          className={cn(
            'absolute right-0 top-full z-50 mt-2 max-h-[min(70vh,420px)] w-52 overflow-y-auto',
            'rounded-xl border border-slate-200 bg-white py-1 shadow-lg'
          )}
        >
          {LOCALES.map((code) => {
            const selected = code === locale
            return (
              <li key={code} role="option" aria-selected={selected}>
                <button
                  type="button"
                  onClick={() => {
                    setLocale(code)
                    setOpen(false)
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                    selected
                      ? 'bg-sky-50 text-sky-800 font-semibold'
                      : 'text-slate-700 hover:bg-slate-50'
                  )}
                >
                  <span aria-hidden>{LOCALE_FLAGS[code]}</span>
                  <span className="flex-1">{LOCALE_LABELS[code]}</span>
                  <span className="text-[10px] uppercase text-slate-400">{code}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : null}
    </div>
  )
}
