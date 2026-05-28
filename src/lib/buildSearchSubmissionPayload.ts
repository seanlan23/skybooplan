import { format } from 'date-fns'
import type { PlannerTravelStyle } from '@/lib/plannerPreferences'
import { travelStyleToPromptLabel } from '@/lib/plannerPreferences'
import type { SearchSubmissionPayload } from '@/lib/searchSubmission'
import type { SearchState } from '@/store/useSearchStore'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'

export function buildSearchSubmissionPayload(
  store: SearchState,
  tempo: PlannerTravelStyle,
  notes: string
): SearchSubmissionPayload {
  const departureDate = store.departureDate
    ? format(store.departureDate, 'yyyy-MM-dd')
    : ''
  const returnDate =
    store.tripType === 'return' && store.returnDate
      ? format(store.returnDate, 'yyyy-MM-dd')
      : undefined

  return {
    tempo,
    tempoLabel: travelStyleToPromptLabel(tempo),
    notes: notes.trim(),
    searchMode: store.searchMode,
    tripType: store.tripType,
    origins: store.origins.map((a) => ({ iata: a.iata, name: a.name })),
    destination: store.destination
      ? { iata: store.destination.iata, name: store.destination.name }
      : null,
    hotelDestination: store.hotelDestination
      ? formatBookingDestinationLabel(store.hotelDestination)
      : null,
    departureDate,
    returnDate,
    adults: store.adults,
    children: store.children,
    rooms: store.rooms,
    cabinClass: store.cabinClass,
    flexDays: store.flexDays,
    submittedAt: new Date().toISOString(),
  }
}
