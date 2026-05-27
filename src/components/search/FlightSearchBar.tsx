'use client'

import { useRef, useState, useCallback } from 'react'
import { ArrowLeftRight, Search, Building2 } from 'lucide-react'
import { AirportInput } from './AirportInput'
import { DestinationInput } from './DestinationInput'
import { DateRangePicker } from './DateRangePicker'
import { PassengerSelector } from './PassengerSelector'
import { TripTypeDropdown } from './TripTypeDropdown'
import { SearchModeTabs } from './SearchModeTabs'
import { AISearchPlannerTab } from './AISearchPlannerTab'
import { useSearchStore } from '@/store/useSearchStore'
import { SkybooplanFlightLoader } from '@/components/brand/SkybooplanFlightLoader'
import { useFlightSearch } from '@/hooks/useFlightSearch'
import { useHotelsOnlySearch } from '@/hooks/useHotelsOnlySearch'
import { useSearchUIStore } from '@/store/useSearchUIStore'
import { CONTENT_CONTAINER } from '@/lib/layoutConstants'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

export default function FlightSearchBar() {
  const { t } = useTranslations()
  const { setDestination, searchMode, origins, destination } = useSearchStore()
  const isHotelsOnly = searchMode === 'hotels_only'
  const isAiPlanner = searchMode === 'ai_planner'
  const { isSearching, search: searchFlights } = useFlightSearch()
  const { search: searchHotelsOnly, isSearching: isHotelsSearching } = useHotelsOnlySearch()
  const openSearch = useSearchUIStore((s) => s.openSearch)
  const closeSearch = useSearchUIStore((s) => s.closeSearch)
  const setOverlayActive = useSearchUIStore((s) => s.setOverlayActive)

  const [hotelsError, setHotelsError] = useState<string | null>(null)
  const [guestsPopoverOpen, setGuestsPopoverOpen] = useState(false)
  const formRef = useRef<HTMLDivElement>(null)

  function swapOriginDestination() {
    if (!origins.length || !destination) return
    const firstOrigin = origins[0]
    const currentDest = destination
    setDestination(firstOrigin)
    useSearchStore.setState({ origins: [currentDest] })
  }

  const handleFocusIn = useCallback((e: React.FocusEvent) => {
    const t = e.target as HTMLElement
    if (t.closest('[data-skip-search-overlay]')) return
    openSearch()
  }, [openSearch])

  const handleBlur = useCallback(
    (e: React.FocusEvent) => {
      const next = e.relatedTarget as Node | null
      if (formRef.current?.contains(next)) return
      if (guestsPopoverOpen) return
      window.setTimeout(() => {
        if (!formRef.current?.contains(document.activeElement) && !guestsPopoverOpen) {
          closeSearch()
        }
      }, 150)
    },
    [closeSearch, guestsPopoverOpen]
  )

  async function handleHotelsSearch() {
    setHotelsError(null)
    const result = await searchHotelsOnly()
    if (!result.ok) setHotelsError(result.error)
    else closeSearch()
  }

  async function handleFlightSearch() {
    await searchFlights()
    closeSearch()
  }

  return (
    <section className="w-full font-sans">
      <div className={cn(CONTENT_CONTAINER, 'pt-4 md:pt-6 pb-5')}>
        <div className="mb-5 md:mb-7 text-center">
          <h1 className="font-display text-3xl md:text-4xl font-bold text-slate-900 mb-2 leading-tight tracking-tight">
            {t('hero.titleBefore')}{' '}
            <span className="text-sky-600">{t('hero.titleHighlight')}</span>{' '}
            {t('hero.titleAfter')}
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            {isHotelsOnly
              ? t('hero.subtitleHotels')
              : isAiPlanner
                ? t('hero.subtitleAi')
                : t('hero.subtitleFlights')}
          </p>
        </div>

        <div
          ref={formRef}
          onFocusCapture={handleFocusIn}
          onBlurCapture={handleBlur}
          className={cn(
            'relative z-50 w-full rounded-3xl bg-white overflow-visible',
            'border-2 border-sky-500 shadow-[0_4px_24px_rgba(14,165,233,0.12)]'
          )}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-2.5 border-b border-slate-100 bg-slate-50/90 rounded-t-3xl">
            <SearchModeTabs />
            {searchMode === 'flights' && <TripTypeDropdown />}
          </div>

          {isAiPlanner ? (
            <AISearchPlannerTab />
          ) : isHotelsOnly ? (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_1.2fr_auto] lg:items-stretch gap-2 p-2 w-full">
              <DestinationInput placeholder={t('search.whereTo')} label={t('search.whereTo')} />
              <PassengerSelector
                open={guestsPopoverOpen}
                onOpenChange={(open) => {
                  setGuestsPopoverOpen(open)
                  setOverlayActive(open)
                }}
              />
              <DateRangePicker forceRange label={t('search.dates')} />
              <button
                type="button"
                onClick={handleHotelsSearch}
                disabled={isHotelsSearching || guestsPopoverOpen}
                className={cn(
                  'flex items-center justify-center gap-2 font-bold text-white bg-sky-600',
                  'hover:bg-sky-700 disabled:opacity-50 disabled:pointer-events-none',
                  'px-6 py-4 lg:py-0 lg:min-h-[72px] rounded-xl'
                )}
              >
                {isHotelsSearching ? (
                  <span className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : (
                  <Building2 className="w-5 h-5" />
                )}
                {t('search.searchHotels')}
              </button>
            </div>
          ) : (
            <div
              className={cn(
                'w-full p-2 gap-2',
                'grid grid-cols-1',
                'lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.1fr)_minmax(0,1.35fr)_minmax(0,1fr)_140px]',
                'lg:items-stretch'
              )}
            >
              <div
                className={cn(
                  'grid grid-cols-[minmax(0,1fr)_40px_minmax(0,1fr)] items-stretch gap-2',
                  'lg:col-span-2'
                )}
              >
                <AirportInput role="origin" variant="skyscanner" className="min-w-0 h-full z-0" />
                <div className="flex items-center justify-center">
                  <button
                    type="button"
                    onClick={swapOriginDestination}
                    className={cn(
                      'flex w-9 h-9 items-center justify-center rounded-full',
                      'bg-white border-2 border-slate-200 text-slate-600 shadow-sm',
                      'hover:border-sky-500 hover:text-sky-600 hover:rotate-180 transition-all duration-300'
                    )}
                    aria-label={t('search.swapAria')}
                  >
                    <ArrowLeftRight className="w-4 h-4" />
                  </button>
                </div>
                <AirportInput role="destination" variant="skyscanner" className="min-w-0 h-full z-0" />
              </div>

              <DateRangePicker variant="skyscanner" className="min-w-0 h-full" />

              <PassengerSelector
                variant="skyscanner"
                open={guestsPopoverOpen}
                onOpenChange={(open) => {
                  setGuestsPopoverOpen(open)
                  setOverlayActive(open)
                }}
                className="min-w-0 h-full"
              />

              <button
                type="button"
                onClick={handleFlightSearch}
                disabled={isSearching || guestsPopoverOpen}
                className={cn(
                  'flex items-center justify-center gap-2 font-bold text-white bg-sky-600',
                  'hover:bg-sky-700 active:bg-sky-800 transition-colors',
                  'disabled:opacity-50 disabled:pointer-events-none',
                  'px-4 py-4 lg:py-0 lg:min-h-[72px] h-full rounded-xl'
                )}
              >
                {isSearching ? (
                  <SkybooplanFlightLoader size="xs" className="!gap-0 [&_p]:hidden" />
                ) : (
                  <Search className="w-5 h-5 shrink-0" />
                )}
                <span className="hidden sm:inline">{t('search.skyscanner')}</span>
              </button>
            </div>
          )}

          {isHotelsOnly && hotelsError && (
            <p className="text-sm text-red-600 bg-red-50 border-t border-red-100 px-4 py-2">
              {hotelsError}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
