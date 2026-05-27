'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { RefreshCw } from 'lucide-react'
import { useAccomStore } from '@/store/useAccomStore'
import { useAccommodations } from '@/hooks/useAccommodations'
import { useHotelSearchSync } from '@/hooks/useHotelSearchSync'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { filterAndSortAccommodations } from '@/lib/filterAccommodations'
import { groupStaysByCity } from '@/lib/groupStaysByCity'
import { HotelDetailModal } from '@/components/accommodations/HotelDetailModal'
import { RouteStayCard } from '@/components/accommodations/RouteStayCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { useTranslations } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'
import type { Accommodation } from '@/types/accommodation.types'

const MAX_PER_CITY = 8

export function RecommendedRouteStays() {
  useHotelSearchSync()
  useAccommodations()

  const { t } = useTranslations()
  const itinerary = usePlannerStore((s) => s.itinerary)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const {
    results,
    isLoading,
    filters,
    activeLocation,
    activeDates,
    searchMeta,
    searchTrigger,
    resetFilters,
    updateFilter,
  } = useAccomStore()
  const filtersResetRef = useRef(false)
  const priceCeilingAppliedRef = useRef(0)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedHotel, setSelectedHotel] = useState<Accommodation | null>(null)

  useEffect(() => {
    if (filtersResetRef.current) return
    filtersResetRef.current = true
    resetFilters()
  }, [resetFilters])

  const bookingOnly = useMemo(
    () =>
      results.filter(
        (r) => r.source === 'booking' && !r.id.includes('fallback') && !r.id.includes('mock')
      ),
    [results]
  )

  useEffect(() => {
    if (searchTrigger === 0 || bookingOnly.length === 0) return
    if (priceCeilingAppliedRef.current === searchTrigger) return

    const maxPrice = Math.max(...bookingOnly.map((r) => r.pricePerNight), 100)
    const ceiling = Math.min(1200, Math.ceil(maxPrice / 10) * 10 + 50)
    const currentMax = useAccomStore.getState().filters.priceMax
    if (ceiling > currentMax) {
      updateFilter('priceMax', ceiling)
    }
    priceCeilingAppliedRef.current = searchTrigger
  }, [searchTrigger, bookingOnly.length, updateFilter])

  const filteredResults = filterAndSortAccommodations(bookingOnly, filters)

  useEffect(() => {
    if (!activeLocation && !selectedFlight) return
    console.log('[skybooplan/route-stays] state', {
      activeLocation,
      checkIn: activeDates.checkIn?.toISOString(),
      checkOut: activeDates.checkOut?.toISOString(),
      flight: selectedFlight
        ? {
            origin: selectedFlight.origin,
            destination: selectedFlight.destination,
            destinationLabel: selectedFlight.destinationLabel,
            outboundArrivalAt: selectedFlight.outboundArrivalAt,
            travelNights: selectedFlight.travelNights,
          }
        : null,
      rawResults: bookingOnly.length,
      afterFilters: filteredResults.length,
      filters,
      isLoading,
      error: searchMeta.error,
    })
  }, [
    activeLocation,
    activeDates.checkIn,
    activeDates.checkOut,
    selectedFlight,
    bookingOnly.length,
    filteredResults.length,
    filters,
    isLoading,
    searchMeta.error,
  ])

  const itineraryLocations = useMemo(() => {
    const seen = new Set<string>()
    const locs: string[] = []
    for (const day of itinerary) {
      const loc = day.location?.trim()
      if (!loc || seen.has(loc)) continue
      seen.add(loc)
      locs.push(loc)
    }
    return locs
  }, [itinerary])

  const cityGroups = useMemo(
    () => groupStaysByCity(filteredResults, itineraryLocations),
    [filteredResults, itineraryLocations]
  )

  const groupsWithStays = cityGroups.filter((g) => g.stays.length > 0)
  const showSkeleton = isLoading && bookingOnly.length === 0 && !!activeLocation

  if (!activeLocation && itinerary.length === 0) {
    return null
  }

  return (
    <section
      id="hotels-on-route-section"
      className="w-full min-w-0 mt-4 pt-4 border-t border-slate-100"
      aria-labelledby="hotels-on-route-heading"
    >
      <header className="mb-4">
        <h3
          id="hotels-on-route-heading"
          className="font-display text-base md:text-lg font-bold text-slate-900"
        >
          🏨 {t('planner.hotelsOnRoute')}
        </h3>
        <p className="text-xs text-slate-500 mt-1">{t('planner.hotelsOnRouteHint')}</p>
      </header>

      {searchMeta.error && !isLoading && filteredResults.length === 0 ? (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {searchMeta.error}
        </p>
      ) : null}

      {showSkeleton ? (
        <div className="flex flex-col gap-4 md:hidden">
          {Array.from({ length: 2 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : null}

      {showSkeleton ? (
        <div className="hidden md:flex gap-4 overflow-hidden">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="w-[260px] shrink-0">
              <SkeletonCard />
            </div>
          ))}
        </div>
      ) : null}

      {!showSkeleton && groupsWithStays.length === 0 ? (
        <div className="text-center py-8 text-slate-400 rounded-xl border border-dashed border-slate-200 bg-slate-50/50">
          <RefreshCw className="w-7 h-7 mx-auto mb-2 opacity-30" />
          <p className="text-sm">
            {isLoading
              ? t('common.loading')
              : searchMeta.error ??
                (bookingOnly.length > 0 && filteredResults.length === 0
                  ? 'Ni rezultatov za izbrane filtre.'
                  : 'Ni hotelov za to destinacijo in datume.')}
          </p>
        </div>
      ) : null}

      {!showSkeleton && groupsWithStays.length > 0 ? (
        <div className="space-y-6">
          {groupsWithStays.map((group) => (
            <div key={group.cityKey} className="min-w-0">
              <h4 className="text-sm font-bold text-slate-800 mb-3">{group.cityLabel}</h4>

              {/* Mobil: navpično */}
              <div className="flex flex-col gap-3 md:hidden">
                {group.stays.slice(0, MAX_PER_CITY).map((accom) => (
                  <RouteStayCard
                    key={accom.id}
                    accom={accom}
                    className="w-full"
                    onView={(a) => {
                      setSelectedHotel(a)
                      setModalOpen(true)
                    }}
                  />
                ))}
              </div>

              {/* Namizje: vodoravni scroll */}
              <div
                className={cn(
                  'hidden md:flex gap-4 overflow-x-auto pb-2 -mx-1 px-1',
                  'snap-x snap-mandatory scroll-smooth',
                  '[scrollbar-width:thin]'
                )}
              >
                {group.stays.slice(0, MAX_PER_CITY).map((accom) => (
                  <RouteStayCard
                    key={accom.id}
                    accom={accom}
                    className="snap-start"
                    onView={(a) => {
                      setSelectedHotel(a)
                      setModalOpen(true)
                    }}
                  />
                ))}
              </div>
            </div>
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
    </section>
  )
}
