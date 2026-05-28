'use client'

import { useEffect, useRef } from 'react'
import { formatCalendarDate } from '@/lib/calendarDate'
import { isAbortError } from '@/lib/fetchUtils'
import { cleanCityForBookingApi } from '@/lib/bookingLocation'
import { useAccomStore } from '@/store/useAccomStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import type { Accommodation } from '@/types/accommodation.types'

/**
 * Naloži hotele ob triggerHotelSearch() — ne ob vsaki spremembi lokacije iz AI.
 */
export function useAccommodations() {
  const searchTrigger = useAccomStore((s) => s.searchTrigger)
  const setResults = useAccomStore((s) => s.setResults)
  const setIsLoading = useAccomStore((s) => s.setIsLoading)
  const requestIdRef = useRef(0)

  useEffect(() => {
    if (searchTrigger === 0) return

    const { activeLocation, activeDates } = useAccomStore.getState()
    const { adults, children, rooms } = useSearchStore.getState()
    const arrivalAt = useSelectedFlightStore.getState().selectedFlight?.outboundArrivalAt
    if (!activeLocation || !activeDates.checkIn || !activeDates.checkOut) {
      setIsLoading(false)
      return
    }

    const requestId = ++requestIdRef.current
    const controller = new AbortController()

    fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: activeLocation,
        bookingCity: cleanCityForBookingApi(activeLocation),
        checkIn: formatCalendarDate(activeDates.checkIn),
        checkOut: formatCalendarDate(activeDates.checkOut),
        adults,
        children,
        rooms,
        arrivalAt,
      }),
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (requestId !== requestIdRef.current) return

        console.log('[skybooplan/hotels] API response', {
          location: activeLocation,
          checkIn: activeDates.checkIn ? formatCalendarDate(activeDates.checkIn) : null,
          checkOut: activeDates.checkOut ? formatCalendarDate(activeDates.checkOut) : null,
          arrivalAt,
          rawCount: (data.results ?? []).length,
          error: data.error,
          searchCity: data.searchCity,
        })

        const list = ((data.results ?? []) as Accommodation[])
          .filter(
            (r) =>
              r.source === 'booking' &&
              !r.id.includes('mock') &&
              !r.id.includes('fallback')
          )
          .map((r) => ({
            ...r,
            checkIn: new Date(r.checkIn),
            checkOut: new Date(r.checkOut),
          }))
        console.log('[skybooplan/hotels] after filter', {
          bookingCount: list.length,
          sample: list.slice(0, 2).map((r) => ({
            id: r.id,
            name: r.name,
            location: r.location,
            pricePerNight: r.pricePerNight,
          })),
        })

        setResults(list, {
          error: data.error as string | undefined,
          searchCity: data.searchCity as string | undefined,
        })
      })
      .catch((err) => {
        if (requestId !== requestIdRef.current) return
        if (isAbortError(err)) return
        setResults([], { error: 'Povezava s strežnikom ni uspela.' })
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false)
        }
      })

    return () => {
      controller.abort()
    }
  }, [searchTrigger, setResults, setIsLoading])
}
