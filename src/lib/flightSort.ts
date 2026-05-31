import { isoDurationToMinutes } from '@/lib/isoDuration'
import type { FlightOffer } from '@/types/flight.types'

export type SortMode = 'cheapest' | 'fastest' | 'stops' | 'best'
export type FlightBadge = 'cheapest' | 'fastest'

/** Skupno trajanje leta v minutah (odhod + povratek, vključno s postanki). */
export function flightDurationMinutes(offer: FlightOffer): number {
  if (offer.totalDurationMinutes != null) return offer.totalDurationMinutes
  let total = isoDurationToMinutes(offer.duration)
  if (offer.returnDuration) total += isoDurationToMinutes(offer.returnDuration)
  return total
}

/** Skupno število postankov (odhod + povratek). */
export function flightTotalStops(offer: FlightOffer): number {
  return offer.stops + (offer.returnStops ?? 0)
}

function normalize(value: number, min: number, max: number): number {
  const span = max - min
  if (span <= 0) return 0
  return (value - min) / span
}

function bestScore(
  offer: FlightOffer,
  minPrice: number,
  maxPrice: number,
  minDur: number,
  maxDur: number,
  minStops: number,
  maxStops: number
): number {
  const priceNorm = normalize(offer.price, minPrice, maxPrice)
  const durNorm = normalize(flightDurationMinutes(offer), minDur, maxDur)
  const stopsNorm = normalize(flightTotalStops(offer), minStops, maxStops)
  return priceNorm * 0.6 + durNorm * 0.3 + stopsNorm * 0.1
}

export function sortFlights(flights: FlightOffer[], mode: SortMode): FlightOffer[] {
  if (flights.length <= 1) return [...flights]

  const copy = [...flights]

  if (mode === 'cheapest') {
    return copy.sort((a, b) => a.price - b.price)
  }

  if (mode === 'fastest') {
    return copy.sort((a, b) => flightDurationMinutes(a) - flightDurationMinutes(b))
  }

  if (mode === 'stops') {
    return copy.sort((a, b) => flightTotalStops(a) - flightTotalStops(b))
  }

  const prices = copy.map((o) => o.price)
  const durations = copy.map((o) => flightDurationMinutes(o))
  const stopsList = copy.map((o) => flightTotalStops(o))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minDur = Math.min(...durations)
  const maxDur = Math.max(...durations)
  const minStops = Math.min(...stopsList)
  const maxStops = Math.max(...stopsList)

  return copy.sort(
    (a, b) =>
      bestScore(a, minPrice, maxPrice, minDur, maxDur, minStops, maxStops) -
      bestScore(b, minPrice, maxPrice, minDur, maxDur, minStops, maxStops)
  )
}

/** Globalne značke — neodvisno od trenutnega sortiranja. */
export function getBadges(flights: FlightOffer[]): Map<string, FlightBadge[]> {
  const map = new Map<string, FlightBadge[]>()
  if (flights.length === 0) return map

  const addBadge = (id: string, badge: FlightBadge) => {
    const existing = map.get(id) ?? []
    if (!existing.includes(badge)) existing.push(badge)
    map.set(id, existing)
  }

  const cheapest = [...flights].sort((a, b) => a.price - b.price)[0]
  const fastest = [...flights].sort(
    (a, b) => flightDurationMinutes(a) - flightDurationMinutes(b)
  )[0]

  if (cheapest) addBadge(cheapest.id, 'cheapest')
  if (fastest) addBadge(fastest.id, 'fastest')

  return map
}
