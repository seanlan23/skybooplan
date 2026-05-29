'use client'

import { useEffect, useMemo, useRef } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { formatCalendarDate } from '@/lib/calendarDate'
import { fetchHotelsForStay } from '@/lib/fetchHotelsForStay'
import {
  buildHotelFetchCacheKey,
  clearHotelFetchCache,
  getHotelFetchCache,
  setHotelFetchCache,
} from '@/lib/hotelFetchCache'
import { buildItineraryCitySegments } from '@/lib/itineraryCitySegments'
import { useItineraryHotelsStore } from '@/store/useItineraryHotelsStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

/** Naloži hotele za vsak unikaten mestni blok v AI itinerarju (vzporedno + cache). */
export function useItineraryCityHotels() {
  const itinerary = usePlannerStore((s) => s.itinerary)
  const { adults, children, rooms, departureDate } = useSearchStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)
  const setSegmentsLoading = useItineraryHotelsStore((s) => s.setSegmentsLoading)
  const setSegmentHotels = useItineraryHotelsStore((s) => s.setSegmentHotels)
  const clearAll = useItineraryHotelsStore((s) => s.clearAll)

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

  const segments = useMemo(
    () => buildItineraryCitySegments(itinerary, tripStart),
    [itinerary, tripStart]
  )

  const segmentsKey = useMemo(
    () => segments.map((s) => s.segmentKey).join(';'),
    [segments]
  )

  const fetchGenRef = useRef(0)

  useEffect(() => {
    if (segments.length === 0) {
      clearAll()
      return
    }

    const gen = ++fetchGenRef.current
    const controller = new AbortController()
    const arrivalAt = selectedFlight?.outboundArrivalAt

    const pendingKeys: string[] = []
    const fetchTasks: Promise<void>[] = []

    for (const segment of segments) {
      const cacheKey = buildHotelFetchCacheKey({
        location: segment.location,
        checkIn: formatCalendarDate(segment.checkIn),
        checkOut: formatCalendarDate(segment.checkOut),
        adults,
        children,
        rooms,
      })

      const cached = getHotelFetchCache(cacheKey)
      if (cached) {
        setSegmentHotels(segment.segmentKey, cached.hotels, cached.error)
        continue
      }

      pendingKeys.push(segment.segmentKey)

      fetchTasks.push(
        fetchHotelsForStay(
          {
            location: segment.location,
            checkIn: segment.checkIn,
            checkOut: segment.checkOut,
            adults,
            children,
            rooms,
            arrivalAt,
          },
          controller.signal
        ).then(({ hotels, error }) => {
          if (fetchGenRef.current !== gen) return
          setHotelFetchCache(cacheKey, { hotels, error })
          setSegmentHotels(segment.segmentKey, hotels, error)
        })
      )
    }

    if (pendingKeys.length > 0) {
      setSegmentsLoading(pendingKeys)
    }

    void Promise.all(fetchTasks)

    return () => {
      controller.abort()
    }
  }, [
    segmentsKey,
    segments,
    adults,
    children,
    rooms,
    selectedFlight?.outboundArrivalAt,
    setSegmentsLoading,
    setSegmentHotels,
    clearAll,
  ])
}

/** Počisti client cache ob resetu planerja (npr. nov AI načrt). */
export function resetItineraryHotelCache() {
  clearHotelFetchCache()
}
