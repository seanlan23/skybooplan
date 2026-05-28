import { differenceInCalendarDays, parseISO, startOfDay } from 'date-fns'
import { legEndpoints } from '@/lib/formatFlight'
import {
  buildOutboundTimeline,
  formatDurationMinutes,
  totalJourneyMinutes,
} from '@/lib/buildFlightTimeline'
import { hotelLocationFromAirport } from '@/lib/bookingLocation'
import type { Airport, FlightOffer } from '@/types/flight.types'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

export interface FlightSelectionContext {
  destinationAirport?: Airport | null
  originAirport?: Airport | null
}

function airportLabel(airport: Airport | null | undefined, iata: string): string {
  if (airport?.iata === iata) {
    if (airport.isAllAirports) {
      return airport.displayName ?? airport.name
    }
    if (airport.city) return `${airport.city} (${iata})`
  }
  return iata
}

/** Destinacija za hotele / AI — samo mesto in država, brez letališča */
function hotelDestinationLabel(airport: Airport | null | undefined, iata: string): string {
  if (airport?.iata === iata && (airport.city || airport.country)) {
    return hotelLocationFromAirport(airport.city || '', airport.country || '')
  }
  return iata
}

/** Nočitve = razlika med datumom odhoda in datumom povratnega leta */
export function calculateTravelNights(
  offer: FlightOffer,
  outboundDepartureAt: string,
  returnDepartureAt?: string
): number {
  const depDay = startOfDay(parseISO(outboundDepartureAt))

  if (returnDepartureAt) {
    const retDay = startOfDay(parseISO(returnDepartureAt))
    return Math.max(1, differenceInCalendarDays(retDay, depDay))
  }

  if (offer.returnDate && offer.departureDate) {
    const retDay = startOfDay(parseISO(offer.returnDate))
    const outDay = startOfDay(parseISO(offer.departureDate))
    return Math.max(1, differenceInCalendarDays(retDay, outDay))
  }

  return 7
}

export function offerToSelectedFlightForAI(
  offer: FlightOffer,
  context: FlightSelectionContext = {}
): SelectedFlightForAI | null {
  const outbound = legEndpoints(offer.segments)
  if (!outbound?.departAt || !outbound.arriveAt) return null

  const inbound =
    offer.returnSegments && offer.returnSegments.length > 0
      ? legEndpoints(offer.returnSegments)
      : null

  const timeline = buildOutboundTimeline(offer.segments)
  const totalMinutes = totalJourneyMinutes(offer.segments)
  const travelNights = calculateTravelNights(
    offer,
    outbound.departAt,
    inbound?.departAt
  )

  return {
    offerId: offer.id,
    airline: offer.airline,
    origin: outbound.origin,
    destination: outbound.destination,
    originLabel: airportLabel(context.originAirport, outbound.origin),
    destinationLabel: hotelDestinationLabel(context.destinationAirport, outbound.destination),
    originGeoQuery: hotelDestinationLabel(context.originAirport, outbound.origin),
    destinationGeoQuery: hotelDestinationLabel(
      context.destinationAirport,
      outbound.destination
    ),
    price: offer.price,
    currency: offer.currency,
    isRoundTrip: !!inbound,
    outboundDepartureAt: outbound.departAt,
    outboundArrivalAt: outbound.arriveAt,
    returnDepartureAt: inbound?.departAt,
    returnArrivalAt: inbound?.arriveAt,
    travelNights,
    timeline,
    totalDurationMinutes: totalMinutes,
    totalDurationLabel: formatDurationMinutes(totalMinutes),
    outboundSegments: offer.segments,
  }
}
