import { getAiResponseLanguage } from '@/lib/localeAiLanguage'
import type { Locale } from '@/i18n/config'
import { differenceInCalendarDays, format, startOfDay } from 'date-fns'
import { getDateFnsLocale } from '@/i18n/localeDateFns'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'
import type { ItineraryPlannerInput } from '@/lib/itineraryPrompt'
import type { Airport } from '@/types/flight.types'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import type { SearchMode } from '@/store/useSearchStore'
import type { BookingDestination } from '@/types/booking.types'
import type { HotelsOnlyContext } from '@/store/usePlannerStore'

function formatDateLabel(date: Date | null | undefined, locale: Locale = 'sl'): string {
  if (!date || Number.isNaN(date.getTime())) return 'ni določeno'
  return format(date, 'd. MMM yyyy', { locale: getDateFnsLocale(locale) })
}

function resolveDestination(params: {
  searchMode: SearchMode
  destination: Airport | null
  hotelDestination: BookingDestination | null
  selectedFlight: SelectedFlightForAI | null
  hotelsOnlyLabel?: string
}): string {
  if (params.selectedFlight?.destinationLabel?.trim()) {
    return params.selectedFlight.destinationLabel.trim()
  }
  if (params.hotelsOnlyLabel?.trim()) return params.hotelsOnlyLabel.trim()
  if (params.searchMode === 'hotels_only' && params.hotelDestination) {
    return formatBookingDestinationLabel(params.hotelDestination)
  }
  if (params.destination) {
    const a = params.destination
    return a.isAllAirports
      ? (a.displayName ?? `${a.city} (${a.iata})`)
      : `${a.city}, ${a.country}`.replace(/,\s*$/, '') || a.name
  }
  return 'ni določeno'
}

function resolvePassengerType(
  adults: number,
  children: number,
  cabinClass?: string
): string {
  const parts: string[] = []
  if (adults === 1) parts.push('1 odrasla')
  else if (adults === 2) parts.push('2 odrasli')
  else if (adults === 3 || adults === 4) parts.push(`${adults} odrasli`)
  else parts.push(`${adults} odraslih`)

  if (children === 1) parts.push('1 otrok')
  else if (children > 1) parts.push(`${children} otrok`)

  if (cabinClass && cabinClass !== 'economy') {
    const cabinLabels: Record<string, string> = {
      premium_economy: 'premium economy',
      business: 'business',
      first: 'first class',
    }
    parts.push(cabinLabels[cabinClass] ?? cabinClass)
  }

  return parts.join(', ')
}

export function buildSpecialRequestsLabel(customLocations: string[]): string | undefined {
  if (!customLocations.length) return undefined
  return `Ročno dodane lokacije / želje: ${customLocations.join(', ')}`
}

/** Ali je v iskalniku (ali kontekstu) izbrana destinacija za načrt. */
export function hasPlannerDestination(params: {
  searchMode: SearchMode
  destination: Airport | null
  hotelDestination: BookingDestination | null
  hotelsOnlyContext: HotelsOnlyContext | null
  selectedFlight: SelectedFlightForAI | null
}): boolean {
  if (params.selectedFlight?.destinationLabel?.trim()) return true
  if (params.hotelsOnlyContext?.destinationLabel?.trim()) return true
  if (params.searchMode === 'hotels_only' && params.hotelDestination) return true
  if (params.destination) return true
  return false
}

/** Oznaka destinacije za ročni / AI načrt (brez letov). */
export function getPlannerDestinationLabel(params: {
  searchMode: SearchMode
  destination: Airport | null
  hotelDestination: BookingDestination | null
  hotelsOnlyContext: HotelsOnlyContext | null
  selectedFlight: SelectedFlightForAI | null
}): string | null {
  const label = resolveDestination({
    searchMode: params.searchMode,
    destination: params.destination,
    hotelDestination: params.hotelDestination,
    selectedFlight: params.selectedFlight,
    hotelsOnlyLabel: params.hotelsOnlyContext?.destinationLabel,
  })
  if (!label || label === 'ni določeno') return null
  return label
}

export function computeTravelNightsForPlanner(params: {
  departureDate: Date | null
  returnDate: Date | null
  selectedFlight: SelectedFlightForAI | null
  hotelsOnlyContext: HotelsOnlyContext | null
}): number {
  if (params.selectedFlight?.travelNights) return params.selectedFlight.travelNights
  if (params.hotelsOnlyContext?.travelNights) return params.hotelsOnlyContext.travelNights
  if (params.departureDate && params.returnDate) {
    return Math.max(
      1,
      differenceInCalendarDays(
        startOfDay(params.returnDate),
        startOfDay(params.departureDate)
      )
    )
  }
  return 3
}

export function resolvePlannerArrivalIso(params: {
  departureDate: Date | null
  selectedFlight: SelectedFlightForAI | null
  hotelsOnlyContext: HotelsOnlyContext | null
}): string {
  if (params.selectedFlight?.outboundArrivalAt) {
    return params.selectedFlight.outboundArrivalAt
  }
  if (params.hotelsOnlyContext?.arrivalAt) {
    return params.hotelsOnlyContext.arrivalAt
  }
  if (params.departureDate && !Number.isNaN(params.departureDate.getTime())) {
    return startOfDay(params.departureDate).toISOString()
  }
  return startOfDay(new Date()).toISOString()
}

/** Združi besedilo posebnih želj in (po želji) ročno dodane lokacije za sistemski prompt. */
export function buildCombinedSpecialRequests(
  specialRequestsText: string,
  customLocations: string[]
): string {
  const parts: string[] = []
  const text = specialRequestsText.trim()
  if (text) parts.push(text)
  const locationsLabel = buildSpecialRequestsLabel(customLocations)
  if (locationsLabel) parts.push(locationsLabel)
  if (!parts.length) return 'brez'
  return parts.join('. ')
}

/** Dinamični vhod za AI Travel Planer iz iskalnika in izbranega leta. */
export function buildItineraryPlannerInput(params: {
  searchMode: SearchMode
  destination: Airport | null
  hotelDestination: BookingDestination | null
  departureDate: Date | null
  returnDate: Date | null
  adults: number
  children: number
  cabinClass?: string
  selectedFlight: SelectedFlightForAI | null
  hotelsOnlyDestinationLabel?: string
  travelType?: string
  dailyBudget?: string
  specialRequests?: string
  locale?: Locale
}): ItineraryPlannerInput {
  const travelNights =
    params.selectedFlight?.travelNights ??
    (params.departureDate && params.returnDate
      ? Math.max(
          1,
          Math.round(
            (params.returnDate.getTime() - params.departureDate.getTime()) /
              86400000
          )
        )
      : 1)

  return {
    currentDestination: resolveDestination({
      searchMode: params.searchMode,
      destination: params.destination,
      hotelDestination: params.hotelDestination,
      selectedFlight: params.selectedFlight,
      hotelsOnlyLabel: params.hotelsOnlyDestinationLabel,
    }),
    checkInDate: formatDateLabel(
      params.departureDate ??
        (params.selectedFlight?.outboundDepartureAt
          ? new Date(params.selectedFlight.outboundDepartureAt)
          : null),
      params.locale
    ),
    checkOutDate: formatDateLabel(
      params.returnDate ??
        (params.selectedFlight?.returnDepartureAt
          ? new Date(params.selectedFlight.returnDepartureAt)
          : null),
      params.locale
    ),
    passengerCount: Math.max(1, params.adults + params.children),
    passengerType: resolvePassengerType(
      params.adults,
      params.children,
      params.cabinClass
    ),
    travelType: params.travelType ?? 'uravnoteženo (hrana, kultura, znamenitosti)',
    dailyBudget: params.dailyBudget ?? 'optimizirano',
    specialRequests: params.specialRequests ?? 'brez',
    travelNights,
    locale: params.locale,
    responseLanguage: getAiResponseLanguage(params.locale),
  }
}
