'use client'

import { useTranslations } from '@/i18n/LocaleProvider'

export default function Footer() {
  const { t } = useTranslations()

  return (
    <footer className="shrink-0 border-t border-slate-100 bg-white mt-8">
      <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <p className="text-xs text-slate-400">{t('footer.copyright')}</p>
        <div className="flex items-center gap-4">
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            {t('footer.privacy')}
          </a>
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            {t('footer.terms')}
          </a>
          <a href="#" className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            {t('footer.contact')}
          </a>
        </div>
      </div>
    </footer>
  )
}
