'use client'

import { useEffect, useMemo, useRef } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { buildItineraryCitySegments } from '@/lib/itineraryCitySegments'
import { fetchHotelsForStay } from '@/lib/fetchHotelsForStay'
import { useItineraryHotelsStore } from '@/store/useItineraryHotelsStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

/** Naloži hotele za vsak unikaten mestni blok v AI itinerarju. */
export function useItineraryCityHotels() {
  const itinerary = usePlannerStore((s) => s.itinerary)
  const { adults, children, rooms, departureDate } = useSearchStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)
  const setSegmentLoading = useItineraryHotelsStore((s) => s.setSegmentLoading)
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
    () =>
      segments
        .map((s) => s.segmentKey)
        .join(';'),
    [segments]
  )

  const fetchGenRef = useRef(0)

  useEffect(() => {
    if (segments.length === 0) {
      clearAll()
      return
    }

    const gen = ++fetchGenRef.current
    const controllers: AbortController[] = []

    for (const segment of segments) {
      setSegmentLoading(segment.segmentKey)
      const ac = new AbortController()
      controllers.push(ac)

      void fetchHotelsForStay(
        {
          location: segment.location,
          checkIn: segment.checkIn,
          checkOut: segment.checkOut,
          adults,
          children,
          rooms,
          arrivalAt: selectedFlight?.outboundArrivalAt,
        },
        ac.signal
      ).then(({ hotels, error }) => {
        if (fetchGenRef.current !== gen) return
        setSegmentHotels(segment.segmentKey, hotels, error)
      })
    }

    return () => {
      controllers.forEach((c) => c.abort())
    }
  }, [
    segmentsKey,
    segments,
    adults,
    children,
    rooms,
    selectedFlight?.outboundArrivalAt,
    setSegmentLoading,
    setSegmentHotels,
    clearAll,
  ])
}
