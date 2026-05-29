import { format } from 'date-fns'
import { buildItineraryCitySegments } from '@/lib/itineraryCitySegments'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'
import type { Accommodation } from '@/types/accommodation.types'
import type {
  ItineraryDay,
  ItineraryTripSummary,
} from '@/types/itinerary.types'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import type { SearchState } from '@/store/useSearchStore'

/** Make.com webhook za generiranje PDF načrta */
export const MAKE_PDF_WEBHOOK_URL =
  process.env.NEXT_PUBLIC_MAKE_PDF_WEBHOOK_URL ??
  'https://hook.eu1.make.com/uguqczf2ef6svceg84zaksco389milgc'

export interface ItineraryExportHotel {
  name: string
  location: string
  pricePerNight: number
  currency: string
  rating?: number
  reviewCount?: number
  affiliateUrl?: string
}

export interface ItineraryExportSegmentHotels {
  cityLabel: string
  location: string
  checkIn: string
  checkOut: string
  hotels: ItineraryExportHotel[]
}

export interface ItineraryExportPayload {
  exportedAt: string
  destination: string
  search: {
    mode: SearchState['searchMode']
    tripType: SearchState['tripType']
    origins: { iata: string; name?: string }[]
    destination: { iata: string; name?: string } | null
    hotelDestination: string | null
    departureDate: string
    returnDate?: string
    adults: number
    children: number
    rooms: number
    cabinClass: string
  }
  flight: {
    offerId: string
    airline: string
    origin: string
    destination: string
    originLabel: string
    destinationLabel: string
    price: number
    currency: string
    isRoundTrip: boolean
    outboundDepartureAt: string
    outboundArrivalAt: string
    returnDepartureAt?: string
    returnArrivalAt?: string
    travelNights: number
    totalDurationLabel: string
    outboundSegments: SelectedFlightForAI['outboundSegments']
  } | null
  tripSummary: ItineraryTripSummary | null
  days: Array<
    Omit<ItineraryDay, 'estimatedDate'> & {
      estimatedDate?: string
    }
  >
  hotelsBySegment: ItineraryExportSegmentHotels[]
  specialRequests?: string
  travelTempo?: string
}

function serializeDay(day: ItineraryDay) {
  const { estimatedDate, ...rest } = day
  return {
    ...rest,
    estimatedDate:
      estimatedDate instanceof Date
        ? estimatedDate.toISOString()
        : estimatedDate
          ? String(estimatedDate)
          : undefined,
  }
}

function serializeHotel(h: Accommodation): ItineraryExportHotel {
  return {
    name: h.name,
    location: h.location,
    pricePerNight: h.pricePerNight,
    currency: h.currency,
    rating: h.rating,
    reviewCount: h.reviewCount,
    affiliateUrl: h.affiliateUrl,
  }
}

export function buildItineraryExportPayload(params: {
  search: SearchState
  selectedFlight: SelectedFlightForAI | null
  itinerary: ItineraryDay[]
  tripSummary: ItineraryTripSummary | null
  hotelsBySegmentKey: Record<
    string,
    { hotels: Accommodation[]; isLoading?: boolean; error?: string }
  >
  tripStart: Date
  specialRequestsText?: string
  travelTempo?: string
}): ItineraryExportPayload {
  const {
    search,
    selectedFlight,
    itinerary,
    tripSummary,
    hotelsBySegmentKey,
    tripStart,
    specialRequestsText,
    travelTempo,
  } = params

  const departureDate = search.departureDate
    ? format(search.departureDate, 'yyyy-MM-dd')
    : ''
  const returnDate =
    search.tripType === 'return' && search.returnDate
      ? format(search.returnDate, 'yyyy-MM-dd')
      : undefined

  const destination =
    selectedFlight?.destinationLabel ??
    (search.destination
      ? `${search.destination.name ?? search.destination.iata}`
      : search.hotelDestination
        ? formatBookingDestinationLabel(search.hotelDestination)
        : itinerary[0]?.location ?? '')

  const segments = buildItineraryCitySegments(itinerary, tripStart)
  const hotelsBySegment: ItineraryExportSegmentHotels[] = segments.map((seg) => {
    const state = hotelsBySegmentKey[seg.segmentKey]
    return {
      cityLabel: seg.cityLabel,
      location: seg.location,
      checkIn: format(seg.checkIn, 'yyyy-MM-dd'),
      checkOut: format(seg.checkOut, 'yyyy-MM-dd'),
      hotels: (state?.hotels ?? []).slice(0, 20).map(serializeHotel),
    }
  })

  return {
    exportedAt: new Date().toISOString(),
    destination,
    search: {
      mode: search.searchMode,
      tripType: search.tripType,
      origins: search.origins.map((a) => ({ iata: a.iata, name: a.name })),
      destination: search.destination
        ? { iata: search.destination.iata, name: search.destination.name }
        : null,
      hotelDestination: search.hotelDestination
        ? formatBookingDestinationLabel(search.hotelDestination)
        : null,
      departureDate,
      returnDate,
      adults: search.adults,
      children: search.children,
      rooms: search.rooms,
      cabinClass: search.cabinClass,
    },
    flight: selectedFlight
      ? {
          offerId: selectedFlight.offerId,
          airline: selectedFlight.airline,
          origin: selectedFlight.origin,
          destination: selectedFlight.destination,
          originLabel: selectedFlight.originLabel,
          destinationLabel: selectedFlight.destinationLabel,
          price: selectedFlight.price,
          currency: selectedFlight.currency,
          isRoundTrip: selectedFlight.isRoundTrip,
          outboundDepartureAt: selectedFlight.outboundDepartureAt,
          outboundArrivalAt: selectedFlight.outboundArrivalAt,
          returnDepartureAt: selectedFlight.returnDepartureAt,
          returnArrivalAt: selectedFlight.returnArrivalAt,
          travelNights: selectedFlight.travelNights,
          totalDurationLabel: selectedFlight.totalDurationLabel,
          outboundSegments: selectedFlight.outboundSegments,
        }
      : null,
    tripSummary,
    days: itinerary.map(serializeDay),
    hotelsBySegment,
    specialRequests: specialRequestsText?.trim() || undefined,
    travelTempo,
  }
}

export async function sendItineraryToMakePdfWebhook(
  itineraryData: ItineraryExportPayload
): Promise<void> {
  const res = await fetch(MAKE_PDF_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...itineraryData, exportType: 'pdf' }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Make webhook failed (${res.status})`)
  }
}

export async function sendItineraryToMakeGoogleDocsWebhook(
  itineraryData: ItineraryExportPayload
): Promise<void> {
  const res = await fetch(MAKE_PDF_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...itineraryData, exportType: 'google_docs' }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => '')
    throw new Error(detail || `Make webhook failed (${res.status})`)
  }
}
