'use client'

import { useMemo, useState } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { RouteStayCard } from '@/components/accommodations/RouteStayCard'
import { RouteStayCardSkeleton } from '@/components/accommodations/RouteStayCardSkeleton'
import { HotelDetailModal } from '@/components/accommodations/HotelDetailModal'
import { findSegmentForDay } from '@/lib/itineraryCitySegments'
import {
  applyRouteStayFilters,
  DEFAULT_ROUTE_STAY_FILTERS,
  prepareRouteStayHotels,
  type RouteStayFilterState,
} from '@/lib/routeStayHotels'
import { useItineraryHotelsStore } from '@/store/useItineraryHotelsStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import type { Accommodation } from '@/types/accommodation.types'
import type { ItineraryDay } from '@/types/itinerary.types'
import { DayCardHotelFilters } from './DayCardHotelFilters'

const SKELETON_COUNT = 5

interface DayCardHotelsProps {
  day: ItineraryDay
}

export function DayCardHotels({ day }: DayCardHotelsProps) {
  const itinerary = usePlannerStore((s) => s.itinerary)
  const { departureDate } = useSearchStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)
  const bySegment = useItineraryHotelsStore((s) => s.bySegment)

  const [modalOpen, setModalOpen] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<Accommodation | null>(null)
  const [filters, setFilters] = useState<RouteStayFilterState>(DEFAULT_ROUTE_STAY_FILTERS)

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

  const segment = useMemo(
    () => findSegmentForDay(day, itinerary, tripStart),
    [day, itinerary, tripStart]
  )

  const segmentState = segment ? bySegment[segment.segmentKey] : undefined
  const rawHotels = segmentState?.hotels ?? []
  const prepared = useMemo(() => prepareRouteStayHotels(rawHotels), [rawHotels])
  const hotels = useMemo(
    () => applyRouteStayFilters(prepared, filters),
    [prepared, filters]
  )

  const error = segmentState?.error

  const isLoading =
    segment != null &&
    prepared.length === 0 &&
    !error &&
    (!segmentState || segmentState.isLoading)

  if (!segment) return null

  const scrollRowClass = cn(
    'route-stays-scroll flex gap-3 overflow-x-auto pb-3 -mx-1 px-1',
    'snap-x snap-mandatory scroll-smooth'
  )

  const showSkeleton = isLoading && prepared.length === 0

  return (
    <div className="mt-4 pt-4 border-t border-slate-100">
      <h4 className="text-sm font-bold text-slate-800 mb-2">
        🏨 Hoteli v {segment.cityLabel}
      </h4>

      {showSkeleton ? (
        <div className={scrollRowClass} aria-busy="true" aria-label="Nalagam hotele">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <RouteStayCardSkeleton key={i} className="snap-start" />
          ))}
        </div>
      ) : null}

      {!showSkeleton && prepared.length > 0 ? (
        <DayCardHotelFilters filters={filters} onChange={setFilters} />
      ) : null}

      {!showSkeleton && error && prepared.length === 0 ? (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
          {error}
        </p>
      ) : null}

      {!showSkeleton && !isLoading && prepared.length === 0 && !error ? (
        <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-3 text-center">
          Ni hotelov za te datume v {segment.cityLabel}.
        </p>
      ) : null}

      {!showSkeleton && prepared.length > 0 && hotels.length === 0 ? (
        <p className="text-xs text-slate-500 rounded-lg border border-dashed border-slate-200 bg-slate-50/80 px-3 py-2 text-center mb-2">
          Noben hotel ne ustreza izbrani lokaciji — poskusi drug filter.
        </p>
      ) : null}

      {!showSkeleton && hotels.length > 0 ? (
        <div className={scrollRowClass}>
          {hotels.map((accom) => (
            <RouteStayCard
              key={accom.id}
              accom={accom}
              className="w-[min(85vw,260px)] snap-start shrink-0"
              onView={(a) => {
                setSelectedHotel(a)
                setModalOpen(true)
              }}
            />
          ))}
        </div>
      ) : null}

      <HotelDetailModal
        hotel={selectedHotel}
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedHotel(null)
        }}
      />
    </div>
  )
}
