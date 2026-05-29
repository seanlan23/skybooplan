'use client'

import { useMemo, useState } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useItineraryHotelsStore } from '@/store/useItineraryHotelsStore'
import { ArrowLeft, FileDown, FileText, Loader2 } from 'lucide-react'
import AIPlanner from '@/components/planner/AIPlanner'
import HotelAggregator from '@/components/accommodations/HotelAggregator'
import { FlightResults } from '@/components/search/FlightResults'
import { MapViewDynamic } from '@/components/map/MapViewDynamic'
import { useFlightSearch } from '@/hooks/useFlightSearch'
import { useSkyscannerRedirect } from '@/hooks/useSkyscannerRedirect'
import { useFlightResultsColumnHeight } from '@/hooks/useFlightResultsColumnHeight'
import {
  buildItineraryExportPayload,
  sendItineraryToMakePdfWebhook,
} from '@/lib/itineraryPdfExport'
import { CONTENT_CONTAINER, PLANNER_RESULTS_GRID } from '@/lib/layoutConstants'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

export function FlightsPlanGridSection() {
  const { t } = useTranslations()
  const { offers, isSearching, error, skyscannerUrl, hasSearched, duffelTestMode } =
    useFlightSearch()
  const { openSkyscannerForOffer } = useSkyscannerRedirect()

  const [showMap, setShowMap] = useState(false)
  const [mapInstanceKey, setMapInstanceKey] = useState(0)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const itinerary = usePlannerStore((s) => s.itinerary)

  const mapItineraryDays = useMemo(
    () =>
      itinerary.map((d) => ({
        dayNumber: d.day,
        location: d.location,
        transportFromPrevious: d.transportFromPrevious,
      })),
    [itinerary]
  )

  const remeasureKey = `${offers.length}-${isSearching}-${hasSearched}`
  const { ref: cardsHeightRef, height: plannerScrollHeight } =
    useFlightResultsColumnHeight(remeasureKey)

  function handleShowMapView() {
    setShowMap(true)
  }

  function handleGenerirajNacrt() {
    setShowMap(true)
    setMapInstanceKey((k) => k + 1)
  }

  function handleBackToFlights() {
    setShowMap(false)
  }

  return (
    <section
      id="plan-section"
      className="w-full py-5 md:py-6 bg-[#eef2f6]"
      aria-label={t('planner.sectionAria')}
    >
      <div className={CONTENT_CONTAINER}>
        <div
          className={cn(
            'grid grid-cols-1 gap-4 lg:gap-x-5 lg:gap-y-5',
            showMap
              ? 'lg:flex lg:flex-row lg:items-start'
              : `${PLANNER_RESULTS_GRID} lg:grid-rows-[auto_auto]`
          )}
        >
          {/* LEVO: AI planer — 70 % ko je zemljevid viden */}
          <div
            className={cn(
              'hidden lg:flex flex-col min-h-0 min-w-0',
              showMap ? 'lg:w-[70%] lg:max-w-[70%] lg:shrink-0' : 'lg:row-start-1 lg:col-start-1'
            )}
          >
            <p className="text-sm font-bold text-slate-800 mb-1.5 shrink-0">{t('planner.planTitle')}</p>
            <p className="text-[11px] text-slate-500 mb-2 shrink-0">{t('planner.planSubtitle')}</p>
            <div
              className={cn(
                'bg-white rounded-lg border border-slate-200 shadow-sm min-h-0 overflow-hidden flex flex-col flex-1',
                showMap && 'min-h-[78vh] max-h-[85vh]'
              )}
              style={
                showMap
                  ? undefined
                  : { height: plannerScrollHeight, maxHeight: plannerScrollHeight }
              }
            >
              <div className="p-3 min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain">
                <AIPlanner title="" compact onGenerirajNacrt={handleGenerirajNacrt} />
              </div>
              {showMap ? <PlannerExportActions /> : null}
            </div>
          </div>

          {/* Mobil */}
          <div className={cn('lg:hidden min-w-0', showMap && 'order-1')}>
            <p className="text-sm font-bold text-slate-800 mb-1">{t('planner.planTitle')}</p>
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm mt-2 flex flex-col overflow-hidden">
              <div
                className="p-3 overflow-y-auto overscroll-y-contain min-h-0 flex-1"
                style={{ maxHeight: showMap ? 'min(65vh, 640px)' : 'min(70vh, 520px)' }}
              >
                <AIPlanner title="" compact onGenerirajNacrt={handleGenerirajNacrt} />
              </div>
              {showMap ? <PlannerExportActions /> : null}
            </div>
          </div>

          {/* DESNO: leti ali zemljevid — 30 % ko je zemljevid viden */}
          <div
            id="flight-results-column"
            className={cn(
              'w-full min-w-0 flex flex-col',
              showMap
                ? 'lg:w-[30%] lg:max-w-[30%] lg:shrink-0 order-2'
                : 'lg:row-start-1 lg:col-start-2 min-h-0'
            )}
            style={!showMap ? { minHeight: plannerScrollHeight } : undefined}
          >
            {showMap ? (
              <div
                className={cn(
                  'w-full flex flex-col gap-3 min-w-0 min-h-0',
                  'lg:sticky lg:top-4 lg:self-start',
                  'lg:min-h-[min(78vh,720px)] lg:h-[min(78vh,720px)]'
                )}
              >
                <button
                  type="button"
                  onClick={handleBackToFlights}
                  className={cn(
                    'inline-flex items-center gap-2 self-start shrink-0',
                    'rounded-xl border border-slate-200 bg-white px-4 py-2.5',
                    'text-sm font-semibold text-slate-700 shadow-sm',
                    'hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/80',
                    'transition-all duration-200'
                  )}
                >
                  <ArrowLeft className="w-4 h-4 shrink-0" aria-hidden />
                  {t('planner.backToFlights')}
                </button>

                <MapViewDynamic
                  key={mapInstanceKey}
                  fromCode={selectedFlight?.origin ?? ''}
                  toCode={selectedFlight?.destination ?? ''}
                  itineraryDays={mapItineraryDays}
                  className="flex-1 w-full min-h-[320px] lg:min-h-0 h-[min(52vh,480px)] lg:h-full rounded-xl border border-slate-200 shadow-md overflow-hidden"
                />
              </div>
            ) : (
              <FlightResults
                offers={offers}
                isSearching={isSearching}
                error={error}
                skyscannerUrl={skyscannerUrl}
                hasSearched={hasSearched}
                duffelTestMode={duffelTestMode}
                cardsHeightRef={cardsHeightRef}
                onSelectOffer={(offer) => openSkyscannerForOffer(offer)}
                onFlightSelectedForAI={handleShowMapView}
              />
            )}
          </div>

          {/* Spodnji hoteli — samo ko je prikazan seznam letov (brez podvajanja) */}
          {!showMap && (
            <div
              id="hotels-section"
              className="w-full min-w-0 lg:row-start-2 lg:col-start-2 pt-1 border-t border-slate-200/80"
            >
              <HotelAggregator layout="full" />
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

function PlannerExportActions() {
  const { t } = useTranslations()
  const search = useSearchStore()
  const itinerary = usePlannerStore((s) => s.itinerary)
  const tripSummary = usePlannerStore((s) => s.tripSummary)
  const specialRequestsText = usePlannerStore((s) => s.specialRequestsText)
  const travelTempo = usePlannerStore((s) => s.travelTempo)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsBySegment = useItineraryHotelsStore((s) => s.bySegment)
  const { departureDate } = useSearchStore()

  const [isPdfExporting, setIsPdfExporting] = useState(false)
  const [pdfError, setPdfError] = useState<string | null>(null)

  const tripStart = useMemo(() => {
    if (selectedFlight?.outboundArrivalAt) {
      return startOfDay(parseISO(selectedFlight.outboundArrivalAt))
    }
    if (hotelsOnlyContext?.arrivalAt) {
      return startOfDay(parseISO(hotelsOnlyContext.arrivalAt))
    }
    if (departureDate) return startOfDay(departureDate)
    return startOfDay(new Date())
  }, [selectedFlight, hotelsOnlyContext, departureDate])

  const canExportPdf = itinerary.length > 0 && !isPdfExporting

  async function handleExportPdf() {
    if (!canExportPdf) return

    setPdfError(null)
    setIsPdfExporting(true)

    const itineraryData = buildItineraryExportPayload({
      search,
      selectedFlight,
      itinerary,
      tripSummary,
      hotelsBySegmentKey: hotelsBySegment,
      tripStart,
      specialRequestsText,
      travelTempo: travelTempo ?? undefined,
    })

    try {
      await sendItineraryToMakePdfWebhook(itineraryData)
    } catch (err) {
      console.error('[pdf export]', err)
      setPdfError(t('errors.pdfExportFailed'))
    } finally {
      setIsPdfExporting(false)
    }
  }

  return (
    <div
      className="shrink-0 border-t border-slate-100 bg-slate-50/60 px-3 py-3 flex flex-col gap-2"
      role="group"
      aria-label={t('planner.exportGroupAria')}
    >
      {pdfError ? (
        <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {pdfError}
        </p>
      ) : null}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => void handleExportPdf()}
          disabled={!canExportPdf}
          aria-busy={isPdfExporting}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
            'text-sm font-semibold transition-all duration-200',
            'border-red-200/80 bg-white text-red-700 hover:bg-red-50 hover:border-red-300',
            'shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-white'
          )}
        >
          {isPdfExporting ? (
            <Loader2 className="w-4 h-4 shrink-0 animate-spin" aria-hidden />
          ) : (
            <FileDown className="w-4 h-4 shrink-0" aria-hidden />
          )}
          {isPdfExporting ? t('planner.exportPdfGenerating') : t('planner.exportPdf')}
        </button>
        <button
          type="button"
          onClick={() => {
            /* TODO: Google Docs export */
          }}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5',
            'text-sm font-semibold transition-all duration-200',
            'border-sky-200/80 bg-white text-sky-800 hover:bg-sky-50 hover:border-sky-400',
            'shadow-sm'
          )}
        >
          <FileText className="w-4 h-4 shrink-0" aria-hidden />
          {t('planner.exportGoogleDocs')}
        </button>
      </div>
    </div>
  )
}
