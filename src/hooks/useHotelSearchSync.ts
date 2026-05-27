'use client'

import { useEffect, useRef } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { sanitizeHotelLocation } from '@/lib/bookingLocation'
import { computeStayWindowForFirstLocation } from '@/lib/itineraryStay'
import { useAccomStore } from '@/store/useAccomStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

/** Po AI načrtu poravna hotel na 1. dan (check-in = dan pristanka) in sproži iskanje */
export function useHotelSearchSync() {
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const itinerary = usePlannerStore((s) => s.itinerary)
  const userPickedHotel = useAccomStore((s) => s.userPickedHotel)
  const setAccomLocation = useAccomStore((s) => s.setActiveLocation)
  const setPlannerLocation = usePlannerStore((s) => s.setActiveLocation)

  const itineraryReady =
    itinerary.length > 0 ? `${itinerary.length}:${itinerary[0]?.day}:${itinerary[0]?.location}` : ''

  const syncedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (!selectedFlight || userPickedHotel || itinerary.length === 0) return

    const syncKey = `${selectedFlight.offerId}:${itineraryReady}`
    if (syncedKeyRef.current === syncKey) return

    const anchor = startOfDay(parseISO(selectedFlight.outboundArrivalAt))
    const stay = computeStayWindowForFirstLocation(itinerary, anchor)
    if (!stay) return

    syncedKeyRef.current = syncKey

    const loc = sanitizeHotelLocation(stay.location)
    const { activeLocation, activeDates } = useAccomStore.getState()

    const locationChanged = activeLocation !== loc
    const datesChanged =
      activeDates.checkIn?.toDateString() !== stay.checkIn.toDateString() ||
      activeDates.checkOut?.toDateString() !== stay.checkOut.toDateString()

    setPlannerLocation(loc)
    setAccomLocation(
      loc,
      { checkIn: stay.checkIn, checkOut: stay.checkOut },
      { userPicked: false, clearResults: locationChanged || datesChanged }
    )
    useAccomStore.getState().triggerHotelSearch()
  }, [
    selectedFlight?.offerId,
    selectedFlight?.outboundArrivalAt,
    itineraryReady,
    userPickedHotel,
    setAccomLocation,
    setPlannerLocation,
  ])
}
