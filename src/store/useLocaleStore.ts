import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LOCALE, isLocale, type Locale } from '@/i18n/config'

interface LocaleState {
  locale: Locale
  setLocale: (locale: Locale) => void
}

export const useLocaleStore = create<LocaleState>()(
  persist(
    (set) => ({
      locale: DEFAULT_LOCALE,
      setLocale: (locale) => {
        if (!isLocale(locale)) return
        set({ locale })
      },
    }),
    {
      name: 'skybooplan-locale',
      partialize: (state) => ({ locale: state.locale }),
      onRehydrateStorage: () => (state) => {
        if (state && !isLocale(state.locale)) {
          state.setLocale(DEFAULT_LOCALE)
        }
      },
    }
  )
)
