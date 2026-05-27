'use client'

import {
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { ChevronDown, ExternalLink } from 'lucide-react'
import { FLIGHT_CARDS_INITIAL_VISIBLE } from '@/lib/layoutConstants'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { useSearchStore } from '@/store/useSearchStore'
import { offerToSelectedFlightForAI } from '@/lib/flightSelection'
import { MOCK_ROUND_TRIP_OFFERS } from '@/lib/mockFlightOffers'
import { FlightOfferRow } from './FlightOfferRow'
import { FlightSortTabs } from './FlightSortTabs'
import { sortFlightOffers, sortTabPriceHints, type FlightSortMode } from '@/lib/sortFlights'
import { getTravelpayoutsPendingNote } from '@/config/travelpayouts'
import type { FlightOffer } from '@/types/flight.types'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

interface FlightResultsProps {
  offers: FlightOffer[]
  isSearching: boolean
  error: string | null
  skyscannerUrl?: string | null
  hasSearched?: boolean
  duffelTestMode?: boolean
  onSelectOffer?: (offer: FlightOffer) => void
  /** Ko uporabnik izbere let za AI (ne ob odstranitvi izbire). */
  onFlightSelectedForAI?: () => void
  embedded?: boolean
  /** Meri višino do konca kartic (za višino AI planerja) */
  cardsHeightRef?: Ref<HTMLDivElement>
}

function FlightListScroller({ children, embedded }: { children: ReactNode; embedded?: boolean }) {
  return (
    <div
      className={cn(
        'space-y-3',
        embedded && 'flex-1 min-h-0 overflow-y-auto overscroll-y-contain max-h-[calc(100vh-280px)]'
      )}
    >
      {children}
    </div>
  )
}

export function FlightResults({
  offers,
  isSearching,
  error,
  skyscannerUrl,
  hasSearched = false,
  duffelTestMode = false,
  onSelectOffer,
  onFlightSelectedForAI,
  embedded = false,
  cardsHeightRef,
}: FlightResultsProps) {
  const { t } = useTranslations()
  const searchingLabel = t('search.searchingFlights')
  const { selectFlightForAI, clearSelectedFlight, isSelected } = useSelectedFlightStore()
  const destination = useSearchStore((s) => s.destination)
  const origins = useSearchStore((s) => s.origins)
  const [sortMode, setSortMode] = useState<FlightSortMode>('best')
  const [showAllCards, setShowAllCards] = useState(false)

  /** Primeri le pred prvim iskanjem — po iskanju pokaži prave ali prazen seznam. */
  const showMockPreview = embedded && !hasSearched && !isSearching && offers.length === 0
  const displayOffers = showMockPreview ? MOCK_ROUND_TRIP_OFFERS : offers

  function handleSelectForAI(offer: FlightOffer, e: MouseEvent) {
    e.stopPropagation()
    const payload = offerToSelectedFlightForAI(offer, {
      destinationAirport: destination,
      originAirport: origins[0] ?? null,
    })
    if (!payload) return
    if (isSelected(offer.id)) {
      clearSelectedFlight()
    } else {
      selectFlightForAI(payload)
      onFlightSelectedForAI?.()
    }
  }

  const offersKey = displayOffers.map((o) => o.id).join(',')

  useEffect(() => {
    setSortMode('best')
    setShowAllCards(false)
  }, [offersKey])

  const sortedOffers = useMemo(
    () => sortFlightOffers(displayOffers, sortMode),
    [displayOffers, sortMode]
  )

  const visibleOffers = useMemo(() => {
    if (showMockPreview || showAllCards) return sortedOffers
    return sortedOffers.slice(0, FLIGHT_CARDS_INITIAL_VISIBLE)
  }, [sortedOffers, showMockPreview, showAllCards])

  const hiddenCardCount = Math.max(0, sortedOffers.length - FLIGHT_CARDS_INITIAL_VISIBLE)
  const canShowMoreCards =
    !showMockPreview && !isSearching && hiddenCardCount > 0 && !showAllCards
  const canShowFewerCards =
    !showMockPreview && !isSearching && hiddenCardCount > 0 && showAllCards

  const priceHints = useMemo(() => {
    if (!displayOffers.length || showMockPreview) return undefined
    return sortTabPriceHints(displayOffers)
  }, [displayOffers, showMockPreview])

  const showSortTabs = !isSearching && sortedOffers.length > 0
  const travelpayoutsNote = getTravelpayoutsPendingNote()

  if (!embedded && !isSearching && !offers.length && !error && !skyscannerUrl && !hasSearched)
    return null

  /** Med iskanjem: rezerviraj višino ~5 kartic (loader je na sredini zaslona). */
  if (!embedded && isSearching) {
    return (
      <div className="min-w-0 flex flex-col">
        <p className="text-sm text-slate-600 mb-2 shrink-0">{searchingLabel}</p>
        <div ref={cardsHeightRef} className="space-y-3 shrink-0" aria-hidden>
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className="h-[132px] rounded-lg border border-slate-200 bg-white animate-pulse"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={cn('min-w-0 flex flex-col', embedded && 'h-full')}>
      {!isSearching && (
        <p className="text-sm text-slate-600 mb-2 shrink-0">
          {showMockPreview
            ? 'Primeri letov — izpolni iskalnik in klikni Išči'
            : offers.length > 0
              ? `${offers.length} letov · razvrščeno: ${sortMode === 'best' ? 'Najboljše' : sortMode === 'cheapest' ? 'Najcenejše' : 'Najhitrejše'}`
              : hasSearched
                ? 'Ni najdenih letov za izbrane datume'
                : 'Rezultati letov'}
        </p>
      )}

      {error && (
        <div className="p-3 mb-2 bg-red-50 border border-red-100 rounded-lg text-sm text-red-700 shrink-0">
          {error}
        </div>
      )}

      {!isSearching && duffelTestMode && offers.length > 0 && (
        <div className="p-3 mb-2 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-900 shrink-0">
          <strong>Testni podatki (Duffel sandbox)</strong> — to niso resni leti v prometu (npr.
          «Duffel Airways», British Airways direktno iz LJU). Za žive cene uporabi{' '}
          <strong>Izberi</strong> → Skyscanner ali preklopi na Duffel <em>live</em> ključ.
        </div>
      )}

      {/* Meri se samo do konca 5 kartic (brez «Prikaži več») */}
      <div ref={cardsHeightRef} className="min-w-0 flex flex-col shrink-0">
        {!isSearching && skyscannerUrl && (
          <div className="mb-3 shrink-0 space-y-1.5">
            <a
              href={skyscannerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-4 py-2.5 text-sm font-semibold text-sky-700 hover:bg-sky-100 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              Odpri iskanje na Skyscanner
            </a>
            {travelpayoutsNote && (
              <p className="text-[11px] text-slate-500 text-center leading-snug px-1">
                {travelpayoutsNote}
              </p>
            )}
          </div>
        )}

        {!isSearching && sortedOffers.length > 0 && (
          <>
            {showSortTabs && (
              <FlightSortTabs
                active={sortMode}
                onChange={setSortMode}
                priceHints={showMockPreview ? undefined : priceHints}
              />
            )}

            <FlightListScroller embedded={embedded}>
              {visibleOffers.map((offer) => (
                <FlightOfferRow
                  key={offer.id}
                  offer={offer}
                  selectedForAI={isSelected(offer.id)}
                  onSelectOffer={() => onSelectOffer?.(offer)}
                  onSelectForAI={(e) => handleSelectForAI(offer, e)}
                />
              ))}
            </FlightListScroller>
          </>
        )}
      </div>

      {!isSearching && sortedOffers.length > 0 && (
        <>
          {canShowMoreCards && (
            <button
              type="button"
              onClick={() => setShowAllCards(true)}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-sky-700 hover:bg-sky-50 transition-colors shrink-0"
            >
              <ChevronDown className="w-4 h-4" aria-hidden />
              Prikaži več
              {hiddenCardCount > 0
                ? ` · še ${hiddenCardCount} ${hiddenCardCount === 1 ? 'let' : hiddenCardCount === 2 ? 'leta' : 'letov'}`
                : ''}
            </button>
          )}

          {canShowFewerCards && (
            <button
              type="button"
              onClick={() => setShowAllCards(false)}
              className="mt-3 w-full flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
            >
              Prikaži manj
            </button>
          )}
        </>
      )}
    </div>
  )
}
