import { formatMinutesHuman, isoDurationToMinutes } from '@/lib/isoDuration'
import type { FlightOffer } from '@/types/flight.types'

export type FlightSortMode = 'best' | 'cheapest' | 'fastest'

export { isoDurationToMinutes }

export function offerTotalDurationMinutes(offer: FlightOffer): number {
  if (offer.totalDurationMinutes != null) return offer.totalDurationMinutes
  let total = isoDurationToMinutes(offer.duration)
  if (offer.returnDuration) total += isoDurationToMinutes(offer.returnDuration)
  return total
}

/** Zbalansirana cena in čas (normalizacija znotraj trenutnega nabora) */
function bestScore(
  offer: FlightOffer,
  minPrice: number,
  maxPrice: number,
  minDur: number,
  maxDur: number
): number {
  const priceSpan = maxPrice - minPrice || 1
  const durSpan = maxDur - minDur || 1
  const priceNorm = (offer.price - minPrice) / priceSpan
  const durNorm = (offerTotalDurationMinutes(offer) - minDur) / durSpan
  return priceNorm * 0.55 + durNorm * 0.45
}

export function sortFlightOffers(
  offers: FlightOffer[],
  mode: FlightSortMode
): FlightOffer[] {
  if (offers.length <= 1) return offers

  const copy = [...offers]

  if (mode === 'cheapest') {
    return copy.sort((a, b) => a.price - b.price)
  }

  if (mode === 'fastest') {
    return copy.sort(
      (a, b) => offerTotalDurationMinutes(a) - offerTotalDurationMinutes(b)
    )
  }

  const prices = copy.map((o) => o.price)
  const durations = copy.map((o) => offerTotalDurationMinutes(o))
  const minPrice = Math.min(...prices)
  const maxPrice = Math.max(...prices)
  const minDur = Math.min(...durations)
  const maxDur = Math.max(...durations)

  return copy.sort(
    (a, b) =>
      bestScore(a, minPrice, maxPrice, minDur, maxDur) -
      bestScore(b, minPrice, maxPrice, minDur, maxDur)
  )
}

function priceLabel(offer: FlightOffer): string {
  return `${offer.price} €`
}

/** Cene za zavihke Best / Cheapest / Fastest (različni leti po razvrstitvi). */
export function sortTabPriceHints(
  offers: FlightOffer[]
): Partial<Record<FlightSortMode, string>> {
  if (!offers.length) return {}

  const cheapestOffer = [...offers].sort((a, b) => a.price - b.price)[0]
  const fastestOffer = sortFlightOffers(offers, 'fastest')[0]
  const bestOffer = sortFlightOffers(offers, 'best')[0]

  const hints: Partial<Record<FlightSortMode, string>> = {
    cheapest: priceLabel(cheapestOffer),
    best: bestOffer ? priceLabel(bestOffer) : undefined,
    fastest: fastestOffer ? priceLabel(fastestOffer) : undefined,
  }

  if (
    fastestOffer &&
    fastestOffer.id !== cheapestOffer.id &&
    fastestOffer.price === cheapestOffer.price
  ) {
    const dur = formatMinutesHuman(offerTotalDurationMinutes(fastestOffer))
    if (dur !== '—') hints.fastest = `${fastestOffer.price} € · ${dur}`
  }

  return hints
}
