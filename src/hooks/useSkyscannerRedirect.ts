'use client'

import { buildAffiliateUrlForFlightOffer } from '@/lib/skyscannerOfferLink'
import { buildAffiliateSkyscannerFlightsUrl } from '@/lib/travelpayoutsLinks'
import { useFlightResultsStore } from '@/store/useFlightResultsStore'
import { useSearchStore } from '@/store/useSearchStore'
import type { FlightOffer } from '@/types/flight.types'

export function useSkyscannerRedirect() {
  const skyscannerUrl = useFlightResultsStore((s) => s.skyscannerUrl)

  function buildUrlFromStore(): string | null {
    const { origins, destination, departureDate, returnDate, tripType, adults, cabinClass } =
      useSearchStore.getState()

    if (!origins.length || !destination || !departureDate) return null

    const returnDateIso =
      tripType === 'return' && returnDate ? returnDate.toISOString().slice(0, 10) : undefined

    return buildAffiliateSkyscannerFlightsUrl({
      origin: origins[0].iata,
      destination: destination.iata,
      departDate: departureDate.toISOString().slice(0, 10),
      returnDate: returnDateIso,
      adults,
      cabinClass,
    })
  }

  function urlForOffer(offer: FlightOffer): string {
    const { adults, cabinClass } = useSearchStore.getState()
    return buildAffiliateUrlForFlightOffer(offer, { adults, cabinClass })
  }

  function openSkyscannerForOffer(offer: FlightOffer) {
    const url = urlForOffer(offer)
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  function openSkyscanner(explicitUrl?: string | null) {
    const url = explicitUrl ?? skyscannerUrl ?? buildUrlFromStore()
    if (!url) return false
    window.open(url, '_blank', 'noopener,noreferrer')
    return true
  }

  return { skyscannerUrl, buildUrlFromStore, urlForOffer, openSkyscannerForOffer, openSkyscanner }
}
