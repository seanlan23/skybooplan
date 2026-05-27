import { addDays, parseISO, startOfDay } from 'date-fns'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

/** Booking iskanje iz izbranega Duffel leta — check-in = dan pristanka */
export function hotelSearchFromSelectedFlight(flight: SelectedFlightForAI) {
  const checkIn = startOfDay(parseISO(flight.outboundArrivalAt))
  const stayNights = Math.max(1, flight.travelNights)
  const checkOut = addDays(checkIn, stayNights)

  return {
    location: flight.destinationLabel,
    checkIn,
    checkOut,
    arrivalAt: flight.outboundArrivalAt,
    destinationIata: flight.destination,
  }
}
