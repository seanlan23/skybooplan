'use client'

import { useState } from 'react'
import { differenceInCalendarDays, startOfDay } from 'date-fns'
import { useAIItinerary } from '@/hooks/useAIItinerary'
import { useAccomStore } from '@/store/useAccomStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'

export function useHotelsOnlySearch() {
  const { hotelDestination, departureDate, returnDate } = useSearchStore()
  const { generateHotelsOnly } = useAIItinerary()
  const [isSearching, setIsSearching] = useState(false)

  async function search() {
    if (!hotelDestination || !departureDate || !returnDate) {
      return { ok: false as const, error: 'Izberi mesto in datuma (od–do).' }
    }

    const checkIn = startOfDay(departureDate)
    const checkOut = startOfDay(returnDate)
    if (checkOut <= checkIn) {
      return { ok: false as const, error: 'Datum odjave mora biti po datumu prihoda.' }
    }

    const travelNights = Math.max(1, differenceInCalendarDays(checkOut, checkIn))
    const destinationLabel = formatBookingDestinationLabel(hotelDestination)
    const arrivalAt = checkIn.toISOString()

    setIsSearching(true)

    try {
      useSelectedFlightStore.getState().clearSelectedFlight()
      usePlannerStore.getState().setItinerary([])
      useAccomStore.getState().clearUserPickedHotel()

      const ctx = {
        destinationLabel,
        arrivalAt,
        travelNights,
        checkIn,
        checkOut,
      }
      usePlannerStore.getState().setHotelsOnlyContext(ctx)
      usePlannerStore.getState().setActiveLocation(destinationLabel)
      useAccomStore.getState().setActiveLocation(
        destinationLabel,
        { checkIn, checkOut },
        { userPicked: false, clearResults: true }
      )
      useAccomStore.getState().triggerHotelSearch()

      await generateHotelsOnly(ctx)

      document.getElementById('hotels-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })

      return { ok: true as const }
    } catch (e) {
      return {
        ok: false as const,
        error: e instanceof Error ? e.message : 'Iskanje ni uspelo.',
      }
    } finally {
      setIsSearching(false)
    }
  }

  return { search, isSearching }
}
