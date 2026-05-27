import { buildSkyscannerFlightsUrl } from '@/lib/skyscannerUrl'
import { wrapTravelpayoutsAffiliateUrl } from '@/lib/travelpayoutsLinks'
import type { FlightOffer } from '@/types/flight.types'

export function buildSkyscannerSearchUrlForOffer(
  offer: FlightOffer,
  opts?: { adults?: number; cabinClass?: string }
): string {
  return buildSkyscannerFlightsUrl({
    origin: offer.origin,
    destination: offer.destination,
    departDate: offer.departureDate,
    returnDate: offer.returnDate,
    adults: opts?.adults,
    cabinClass: opts?.cabinClass ?? offer.cabinClass,
  })
}

/** Affiliate URL za isto relacijo/datum na Skyscanner (Travelpayouts). */
export function buildAffiliateUrlForFlightOffer(
  offer: FlightOffer,
  opts?: { adults?: number; cabinClass?: string }
): string {
  const base =
    offer.deepLink && offer.deepLink.startsWith('http')
      ? offer.deepLink
      : buildSkyscannerSearchUrlForOffer(offer, opts)

  try {
    const url = new URL(base)
    if (offer.skyscannerItineraryId && !url.searchParams.has('selectedoutbound')) {
      url.searchParams.set('selectedoutbound', offer.skyscannerItineraryId)
    }
    return wrapTravelpayoutsAffiliateUrl(url.toString())
  } catch {
    return wrapTravelpayoutsAffiliateUrl(base)
  }
}
