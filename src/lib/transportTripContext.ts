import { format } from 'date-fns'
import { sl } from 'date-fns/locale'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'
import type { TransportTripContext } from '@/lib/transportAgentPrompt'
import type { BookingDestination } from '@/types/booking.types'
import type { Airport } from '@/types/flight.types'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import type { SearchMode } from '@/store/useSearchStore'

function formatAirportLabel(airport: Airport): string {
  if (airport.isAllAirports) {
    return airport.displayName ?? `${airport.city} (${airport.iata})`
  }
  const city = airport.city?.trim()
  const name = airport.name?.trim()
  if (city && name && !name.toLowerCase().includes(city.toLowerCase())) {
    return `${city} (${airport.iata}) — ${name}`
  }
  if (city) return `${city} (${airport.iata})`
  return `${airport.iata}${name ? ` — ${name}` : ''}`
}

function formatDateLabel(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return 'Not specified'
  return format(date, 'd. MMM yyyy', { locale: sl })
}

function resolveOriginLabel(params: {
  searchMode: SearchMode
  origins: Airport[]
  selectedFlight: SelectedFlightForAI | null
}): string {
  const { searchMode, origins, selectedFlight } = params

  if (selectedFlight?.originLabel?.trim()) {
    const code = selectedFlight.origin ? ` (${selectedFlight.origin})` : ''
    return `${selectedFlight.originLabel}${code}`
  }

  if (origins.length > 0) {
    return formatAirportLabel(origins[0])
  }

  if (searchMode === 'hotels_only') {
    return 'Not specified (accommodations-only search — no departure airport selected)'
  }

  return 'Not specified (select departure in the main search bar)'
}

function resolveDestinationLabel(params: {
  searchMode: SearchMode
  destination: Airport | null
  hotelDestination: BookingDestination | null
  selectedFlight: SelectedFlightForAI | null
  activeLocation: string | null
}): string {
  const { searchMode, destination, hotelDestination, selectedFlight, activeLocation } = params

  if (selectedFlight?.destinationLabel?.trim()) {
    const code = selectedFlight.destination ? ` (${selectedFlight.destination})` : ''
    return `${selectedFlight.destinationLabel}${code}`
  }

  if (searchMode === 'hotels_only' && hotelDestination) {
    return formatBookingDestinationLabel(hotelDestination)
  }

  if (destination) {
    return formatAirportLabel(destination)
  }

  if (activeLocation?.trim()) {
    return activeLocation.trim()
  }

  return 'Not specified (select destination in the main search bar)'
}

/** Zbere kontekst iz glavnega iskalnika (odhod, destinacija, datumi, potniki). */
export function buildTransportTripContextFromSearch(params: {
  searchMode: SearchMode
  origins: Airport[]
  destination: Airport | null
  hotelDestination: BookingDestination | null
  departureDate: Date | null
  returnDate: Date | null
  adults: number
  children: number
  selectedFlight: SelectedFlightForAI | null
  activeLocation: string | null
  itineraryLocations?: string[]
  transportBudget?: string
}): TransportTripContext {
  const checkIn =
    params.departureDate ??
    (params.selectedFlight?.outboundDepartureAt
      ? new Date(params.selectedFlight.outboundDepartureAt)
      : null)

  const checkOut =
    params.returnDate ??
    (params.selectedFlight?.returnDepartureAt
      ? new Date(params.selectedFlight.returnDepartureAt)
      : params.selectedFlight?.outboundArrivalAt && params.selectedFlight.travelNights
        ? (() => {
            const d = new Date(params.selectedFlight.outboundArrivalAt)
            d.setDate(d.getDate() + params.selectedFlight.travelNights)
            return d
          })()
        : null)

  return {
    currentOrigin: resolveOriginLabel({
      searchMode: params.searchMode,
      origins: params.origins,
      selectedFlight: params.selectedFlight,
    }),
    currentDestination: resolveDestinationLabel({
      searchMode: params.searchMode,
      destination: params.destination,
      hotelDestination: params.hotelDestination,
      selectedFlight: params.selectedFlight,
      activeLocation: params.activeLocation,
    }),
    checkInDate: formatDateLabel(checkIn),
    checkOutDate: formatDateLabel(checkOut),
    passengerCount: Math.max(1, params.adults + params.children),
    transportBudget: params.transportBudget,
    searchMode: params.searchMode,
    activeLocation: params.activeLocation ?? undefined,
    itineraryLocations: params.itineraryLocations,
  }
}
