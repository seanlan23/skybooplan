'use client'

import { SkybooplanFlightLoader } from '@/components/brand/SkybooplanFlightLoader'
import { useTranslations } from '@/i18n/LocaleProvider'
import { useFlightResultsStore } from '@/store/useFlightResultsStore'

/** Logo na sredini zaslona med iskanjem letov */
export function FlightSearchLoadingOverlay() {
  const { t } = useTranslations()
  const isSearching = useFlightResultsStore((s) => s.isSearching)

  if (!isSearching) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-busy="true"
      aria-label={t('loading.ariaSearchingFlights')}
    >
      <SkybooplanFlightLoader
        size="xl"
        label={t('loading.searchingFlightsLabel')}
        className="drop-shadow-lg"
      />
    </div>
  )
}
