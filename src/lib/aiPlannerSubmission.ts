import { format } from 'date-fns'
import {
  aiTravelTempoToPromptLabel,
  type AiTravelTempo,
} from '@/lib/aiPlannerTempo'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'
import type { SearchState } from '@/store/useSearchStore'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

export type AiPlannerSubmissionPayload = {
  source: 'ai_planner'
  tempo: AiTravelTempo
  tempoLabel: string
  notes: string
  searchMode: SearchState['searchMode']
  tripType?: SearchState['tripType']
  origins?: { iata: string; name?: string }[]
  destination?: { iata: string; name?: string } | null
  hotelDestination?: string | null
  departureDate: string
  returnDate?: string
  adults: number
  children: number
  rooms?: number
  cabinClass?: string
  selectedFlight?: {
    originLabel: string
    destinationLabel: string
    travelNights: number
  } | null
  submittedAt: string
}

export function buildAiPlannerSubmissionPayload(
  store: SearchState,
  tempo: AiTravelTempo,
  notes: string,
  selectedFlight: SelectedFlightForAI | null
): AiPlannerSubmissionPayload {
  const departureDate = store.departureDate
    ? format(store.departureDate, 'yyyy-MM-dd')
    : ''
  const returnDate =
    store.tripType === 'return' && store.returnDate
      ? format(store.returnDate, 'yyyy-MM-dd')
      : undefined

  return {
    source: 'ai_planner',
    tempo,
    tempoLabel: aiTravelTempoToPromptLabel(tempo),
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
    selectedFlight: selectedFlight
      ? {
          originLabel: selectedFlight.originLabel,
          destinationLabel: selectedFlight.destinationLabel,
          travelNights: selectedFlight.travelNights,
        }
      : null,
    submittedAt: new Date().toISOString(),
  }
}
