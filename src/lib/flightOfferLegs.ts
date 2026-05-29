import { legEndpoints } from '@/lib/formatFlight'
import { formatIsoDurationHuman } from '@/lib/isoDuration'
import type { FlightOffer, FlightSegment } from '@/types/flight.types'

export interface OfferLegDisplay {
  label: 'Outbound' | 'Return'
  segments: FlightSegment[]
  origin: string
  destination: string
  departTime: string
  arriveTime: string
  /** Dni čez polnoč (1, 2 …) — prikaz kot nadpis */
  arriveDayOffset: number
  duration: string
  stops: number
  airline: string
  airlineLogo?: string
  /** Synthesized when API omits return slice but trip is round-trip */
  isPlaceholder?: boolean
}

function legFromSegments(
  label: 'Outbound' | 'Return',
  segments: FlightSegment[],
  duration: string,
  stops: number,
  airline: string,
  airlineLogo?: string
): OfferLegDisplay | null {
  const endpoints = legEndpoints(segments)
  if (!endpoints) return null
  return {
    label,
    segments,
    origin: endpoints.origin,
    destination: endpoints.destination,
    departTime: endpoints.departTime,
    arriveTime: endpoints.arriveTime,
    arriveDayOffset: endpoints.arriveDayOffset,
    duration,
    stops,
    airline,
    airlineLogo,
  }
}

function placeholderReturnLeg(offer: FlightOffer): OfferLegDisplay {
  const out = legEndpoints(offer.segments)
  const origin = out?.destination ?? offer.destination
  const dest = out?.origin ?? offer.origin
  return {
    label: 'Return',
    segments: [],
    origin,
    destination: dest,
    departTime: '—',
    arriveTime: '—',
    arriveDayOffset: 0,
    duration: offer.returnDuration ?? '—',
    stops: offer.returnStops ?? 0,
    airline: offer.airline,
    airlineLogo: offer.airlineLogo,
    isPlaceholder: true,
  }
}

/** Outbound + return rows for Skyscanner-style cards (synthesizes return when missing). */
export function getOfferDisplayLegs(offer: FlightOffer): OfferLegDisplay[] {
  const outbound = legFromSegments(
    'Outbound',
    offer.segments,
    offer.duration,
    offer.stops,
    offer.airline,
    offer.airlineLogo
  )
  if (!outbound) return []

  const isRoundTrip =
    !!offer.returnDate ||
    (offer.returnSegments != null && offer.returnSegments.length > 0)

  if (!isRoundTrip) return [outbound]

  if (offer.returnSegments?.length) {
    const inbound = legFromSegments(
      'Return',
      offer.returnSegments,
      offer.returnDuration ?? '—',
      offer.returnStops ?? 0,
      offer.airline,
      offer.airlineLogo
    )
    return inbound ? [outbound, inbound] : [outbound, placeholderReturnLeg(offer)]
  }

  return [outbound, placeholderReturnLeg(offer)]
}

/** First connection airport for "1 stop ZRH" style label */
export function getLegStopoverCode(segments: FlightSegment[]): string | null {
  if (segments.length <= 1) return null
  return segments[0]?.arrival?.iataCode ?? null
}

export function formatLegDuration(duration: string): string {
  if (duration.startsWith('P')) return formatIsoDurationHuman(duration)
  return duration || '—'
}

export interface StopsLabels {
  direct: string
  oneStop: string
  oneStopAt: (code: string) => string
  stopsMany: (count: number) => string
}

export function formatStopsLine(
  stops: number,
  stopoverCode: string | null,
  labels?: StopsLabels
): string {
  const L = labels ?? {
    direct: 'Direct',
    oneStop: '1 stop',
    oneStopAt: (code: string) => `1 stop ${code}`,
    stopsMany: (count: number) => `${count} stops`,
  }
  if (stops <= 0) return L.direct
  if (stops === 1 && stopoverCode) return L.oneStopAt(stopoverCode)
  if (stops === 1) return L.oneStop
  return L.stopsMany(stops)
}
