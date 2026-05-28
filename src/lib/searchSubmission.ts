import {
  PLANNER_TRAVEL_STYLE_OPTIONS,
  type PlannerTravelStyle,
} from '@/lib/plannerPreferences'
import type { SearchMode } from '@/store/useSearchStore'

export const VALID_TRAVEL_TEMPO = new Set<PlannerTravelStyle>(
  PLANNER_TRAVEL_STYLE_OPTIONS.map((o) => o.value)
)

export const MIN_CUSTOM_NOTES_LENGTH = 6

export type SearchSubmissionPayload = {
  tempo: PlannerTravelStyle
  tempoLabel: string
  notes: string
  searchMode: SearchMode
  tripType?: 'one_way' | 'return'
  origins?: { iata: string; name?: string }[]
  destination?: { iata: string; name?: string } | null
  hotelDestination?: string | null
  departureDate: string
  returnDate?: string
  adults: number
  children: number
  rooms?: number
  cabinClass?: string
  flexDays?: number
  submittedAt: string
}

export function isSearchPreferencesValid(
  tempo: PlannerTravelStyle | null,
  notes: string
): boolean {
  return tempo !== null && notes.trim().length >= MIN_CUSTOM_NOTES_LENGTH
}
