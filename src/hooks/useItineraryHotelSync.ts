'use client'

import { useEffect } from 'react'
import { parseISO, startOfDay } from 'date-fns'
import { computeStayWindowForFirstLocation } from '@/lib/itineraryStay'
import { useAccomStore } from '@/store/useAccomStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

/** Sinhronizira Booking z 1. točko plana; ne prepiše ročno izbrane druge lokacije */
export function useItineraryHotelSync() {
  const itinerary = usePlannerStore((s) => s.itinerary)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const activeLocation = useAccomStore((s) => s.activeLocation)
  const checkIn = useAccomStore((s) => s.activeDates.checkIn)
  const checkOut = useAccomStore((s) => s.activeDates.checkOut)
  const setAccomLocation = useAccomStore((s) => s.setActiveLocation)
  const setPlannerLocation = usePlannerStore((s) => s.setActiveLocation)

  useEffect(() => {
    if (!itinerary.length || !selectedFlight?.outboundArrivalAt) return

    const anchor = startOfDay(parseISO(selectedFlight.outboundArrivalAt))
    const stay = computeStayWindowForFirstLocation(itinerary, anchor)
    if (!stay) return

    if (!activeLocation || !checkIn || !checkOut) {
      setPlannerLocation(stay.location)
      setAccomLocation(stay.location, {
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
      })
      return
    }

    if (
      activeLocation === stay.location &&
      checkIn.toDateString() !== stay.checkIn.toDateString()
    ) {
      setAccomLocation(stay.location, {
        checkIn: stay.checkIn,
        checkOut: stay.checkOut,
      })
    }
  }, [
    itinerary,
    selectedFlight?.outboundArrivalAt,
    activeLocation,
    checkIn?.toDateString(),
    checkOut?.toDateString(),
    setAccomLocation,
    setPlannerLocation,
  ])
}
