'use client'

import { motion } from 'framer-motion'
import { MapPin, RefreshCw, ChevronDown } from 'lucide-react'
import { format } from 'date-fns'
import { sl } from 'date-fns/locale'
import { useEffect, useRef, useState } from 'react'
import { useAccomStore } from '@/store/useAccomStore'
import { useAccommodations } from '@/hooks/useAccommodations'
import { useHotelSearchSync } from '@/hooks/useHotelSearchSync'
import { useSearchStore } from '@/store/useSearchStore'
import { HotelDetailModal } from './HotelDetailModal'
import { HotelResultsToolbar } from './HotelResultsToolbar'
import { PropertyCard } from './PropertyCard'
import { SkeletonCard } from '@/components/ui/Skeleton'
import { filterAndSortAccommodations } from '@/lib/filterAccommodations'
import { cleanCityForBookingApi, formatHotelDisplayLocation } from '@/lib/bookingLocation'
import { cn } from '@/lib/utils'

const INITIAL_HOTEL_COUNT = 6

const GRID_CLASS_WIDE =
  'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3 gap-6 w-full items-stretch'

const GRID_CLASS_COMPACT =
  'grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-stretch'

interface HotelAggregatorProps {
  layout?: 'sidebar' | 'full'
}

export default function HotelAggregator({ layout = 'sidebar' }: HotelAggregatorProps) {
  useHotelSearchSync()
  useAccommodations()

  const {
    results,
    isLoading,
    filters,
    activeLocation,
    activeDates,
    searchMeta,
    searchTrigger,
    selectedHotel,
    setSelectedHotel,
  } = useAccomStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [showAllHotels, setShowAllHotels] = useState(false)

  const isHotelsOnlyMode = useSearchStore((s) => s.searchMode === 'hotels_only')
  const isWideLayout = layout === 'full' && isHotelsOnlyMode
  const accent = isWideLayout ? 'leaf' : 'sky'
  const gridClass = isWideLayout ? GRID_CLASS_WIDE : GRID_CLASS_COMPACT

  const bookingOnly = results.filter(
    (r) => r.source === 'booking' && !r.id.includes('fallback') && !r.id.includes('mock')
  )

  const filteredResults = filterAndSortAccommodations(bookingOnly, filters)

  const searchKey = `${activeLocation}-${activeDates.checkIn?.toDateString()}-${activeDates.checkOut?.toDateString()}`

  useEffect(() => {
    setShowAllHotels(false)
  }, [searchKey])

  const priceCeilingAppliedRef = useRef<number>(0)
  useEffect(() => {
    if (searchTrigger === 0 || bookingOnly.length === 0) return
    if (priceCeilingAppliedRef.current === searchTrigger) return

    const maxPrice = Math.max(...bookingOnly.map((r) => r.pricePerNight), 100)
    const ceiling = Math.min(600, Math.ceil(maxPrice / 10) * 10 + 20)
    const currentMax = useAccomStore.getState().filters.priceMax
    if (ceiling > currentMax) {
      useAccomStore.getState().updateFilter('priceMax', ceiling)
    }
    priceCeilingAppliedRef.current = searchTrigger
  }, [searchTrigger, bookingOnly.length])

  const showInitialSkeleton = isLoading && bookingOnly.length === 0
  const isRefreshing = isLoading && bookingOnly.length > 0

  const visibleHotels = showAllHotels
    ? filteredResults
    : filteredResults.slice(0, INITIAL_HOTEL_COUNT)
  const hasMoreHotels = filteredResults.length > INITIAL_HOTEL_COUNT && !showAllHotels

  const emptyState = (
    <main className="flex flex-col items-center justify-center py-16 text-center px-8 w-full lg:flex-1">
      <div className="w-16 h-16 bg-sky-50 rounded-full flex items-center justify-center mb-4">
        <MapPin className="w-8 h-8 text-sky-300" />
      </div>
      <h3 className="font-display font-bold text-slate-700 text-lg mb-2">Izberi destinacijo</h3>
      <p className="text-slate-400 text-sm leading-relaxed max-w-md">
        {isWideLayout
          ? 'Vnesi kraj in datume zgoraj, nato klikni «Išči namestitve».'
          : 'Klikni «AI načrt» na letu — hoteli se naložijo za destinacijo od dneva pristanka.'}
      </p>
    </main>
  )

  if (!activeLocation) {
    return emptyState
  }

  const header = (
    <div className="flex items-center gap-2">
      <motion.div
        key={searchKey}
        initial={false}
        animate={{ opacity: 1 }}
        className="flex items-center gap-2 flex-1 min-w-0"
      >
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
            isWideLayout ? 'bg-leaf-50' : 'bg-sky-50'
          )}
        >
          <MapPin
            className={cn('w-4 h-4', isWideLayout ? 'text-leaf-500' : 'text-sky-500')}
          />
        </div>
        <div>
          <h2 className="font-display font-bold text-slate-900 text-xl md:text-2xl">
            {searchMeta.searchCity
              ? formatHotelDisplayLocation(
                  searchMeta.searchCity,
                  activeLocation?.split(',').slice(1).join(',')
                )
              : formatHotelDisplayLocation(activeLocation) ||
                cleanCityForBookingApi(activeLocation ?? '')}
          </h2>
          {activeDates.checkIn && activeDates.checkOut && (
            <p className="text-sm text-slate-400">
              {format(activeDates.checkIn, 'd. MMM', { locale: sl })} –{' '}
              {format(activeDates.checkOut, 'd. MMM yyyy', { locale: sl })}
            </p>
          )}
        </div>
      </motion.div>
      {isRefreshing && (
        <div
          className="w-5 h-5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0"
          aria-label="Osvežujem hotele"
        />
      )}
    </div>
  )

  const resultsBlock = (
    <>
      {searchMeta.error && !isLoading && filteredResults.length === 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {searchMeta.error}
        </p>
      )}

      <HotelResultsToolbar accent={accent} resultCount={!isLoading ? filteredResults.length : undefined} />

      {!isLoading && (
        <p className="text-xs text-slate-400 -mt-1">
          {!showAllHotels && filteredResults.length > INITIAL_HOTEL_COUNT
            ? `Prikazanih ${INITIAL_HOTEL_COUNT} od ${filteredResults.length}`
            : null}
        </p>
      )}

      {showInitialSkeleton ? (
        <div className={gridClass}>
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} wide={isWideLayout} />
          ))}
        </div>
      ) : filteredResults.length === 0 ? (
        <div className="text-center py-12 text-slate-400 w-full">
          <RefreshCw className="w-8 h-8 mx-auto mb-3 opacity-30" />
          <p className="text-sm">{searchMeta.error ?? 'Ni rezultatov za izbrane filtre.'}</p>
        </div>
      ) : (
        <>
          <div className={gridClass}>
            {visibleHotels.map((accom, i) => (
              <PropertyCard
                key={accom.id}
                accom={accom}
                index={i}
                wide={isWideLayout}
                onOpen={(a) => {
                  setSelectedHotel(a)
                  setModalOpen(true)
                }}
              />
            ))}
          </div>

          {hasMoreHotels && (
            <div className="flex justify-center pt-2 pb-4">
              <button
                type="button"
                onClick={() => setShowAllHotels(true)}
                className={cn(
                  'inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl border-2 bg-white font-semibold text-sm transition-all shadow-sm',
                  isWideLayout
                    ? 'border-leaf-200 text-leaf-700 hover:bg-leaf-50 hover:border-leaf-300'
                    : 'border-sky-200 text-sky-700 hover:bg-sky-50 hover:border-sky-300'
                )}
              >
                Prikaži več namestitev
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </>
  )

  const modal = (
    <HotelDetailModal
      hotel={selectedHotel}
      open={modalOpen}
      onClose={() => {
        setModalOpen(false)
        setSelectedHotel(null)
      }}
    />
  )

  return (
    <main className={cn('flex flex-col gap-5 min-w-0 w-full', 'lg:flex-1')}>
      {header}
      {resultsBlock}
      {modal}
    </main>
  )
}
