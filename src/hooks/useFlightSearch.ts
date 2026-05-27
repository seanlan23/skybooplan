'use client'

import { buildAffiliateSkyscannerFlightsUrl } from '@/lib/travelpayoutsLinks'
import { useFlightResultsStore } from '@/store/useFlightResultsStore'
import { useSearchStore } from '@/store/useSearchStore'

export function useFlightSearch() {
  const offers = useFlightResultsStore((s) => s.offers)
  const isSearching = useFlightResultsStore((s) => s.isSearching)
  const error = useFlightResultsStore((s) => s.error)
  const skyscannerUrl = useFlightResultsStore((s) => s.skyscannerUrl)
  const hasSearched = useFlightResultsStore((s) => s.hasSearched)
  const setOffers = useFlightResultsStore((s) => s.setOffers)
  const setIsSearching = useFlightResultsStore((s) => s.setIsSearching)
  const setError = useFlightResultsStore((s) => s.setError)
  const setSkyscannerUrl = useFlightResultsStore((s) => s.setSkyscannerUrl)
  const setHasSearched = useFlightResultsStore((s) => s.setHasSearched)
  const setDuffelTestMode = useFlightResultsStore((s) => s.setDuffelTestMode)
  const duffelTestMode = useFlightResultsStore((s) => s.duffelTestMode)
  const store = useSearchStore()

  const search = async () => {
    if (!store.origins.length || !store.destination || !store.departureDate) {
      setError('Prosimo izpolni vsa obvezna polja.')
      return
    }

    if (store.tripType === 'return' && !store.returnDate) {
      setError('Za povratni let izberi tudi datum povratka.')
      return
    }

    const returnDateIso =
      store.tripType === 'return' && store.returnDate
        ? store.returnDate.toISOString().slice(0, 10)
        : undefined

    const departDate = store.departureDate.toISOString().slice(0, 10)

    const affiliateUrl = buildAffiliateSkyscannerFlightsUrl({
      origin: store.origins[0].iata,
      destination: store.destination.iata,
      departDate,
      returnDate: returnDateIso,
      adults: store.adults,
      cabinClass: store.cabinClass,
    })

    setError(null)
    setOffers([])
    setIsSearching(true)
    setHasSearched(true)
    setDuffelTestMode(false)

    try {
      const res = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(58_000),
        body: JSON.stringify({
          origins: store.origins.map((a) => ({
            iata: a.iata,
            skyscannerPlaceId: a.skyscannerPlaceId,
          })),
          destination: {
            iata: store.destination.iata,
            skyscannerPlaceId: store.destination.skyscannerPlaceId,
          },
          departureDate: departDate,
          tripType: store.tripType,
          returnDate: returnDateIso,
          flexDays: store.flexDays,
          adults: store.adults,
          children: store.children,
          cabinClass: store.cabinClass,
        }),
      })

      let data: Record<string, unknown> = {}
      try {
        data = await res.json()
      } catch {
        setSkyscannerUrl(affiliateUrl)
        setError('Neveljaven odgovor strežnika. Poskusi znova.')
        return
      }

      const url = (data.skyscannerUrl as string) || affiliateUrl
      setSkyscannerUrl(url)

      if (!res.ok || data.error) {
        setError(
          String(
            data.error ??
              (res.status === 504
                ? 'Iskanje je trajalo predolgo. Poskusi znova.'
                : 'Iskanje letov ni uspelo.')
          )
        )
      }

      if (typeof data.duffelTestMode === 'boolean') {
        setDuffelTestMode(data.duffelTestMode)
      }

      if (Array.isArray(data.offers)) {
        setOffers(data.offers)
        if (data.offers.length === 0 && !data.error) {
          setError('Za ta datum ni najdenih letov. Poskusi druge datume ali odpri Skyscanner.')
        }
      }
    } catch (err) {
      setSkyscannerUrl(affiliateUrl)
      const msg = err instanceof Error ? err.message.toLowerCase() : ''
      if (msg.includes('timeout') || msg.includes('aborted')) {
        setError('Iskanje traja predolgo (Duffel). Počakaj in poskusi znova.')
      } else if (msg.includes('fetch')) {
        setError(
          'Brskalnik ni dosegel strežnika. Preveri, da teče npm run dev, in osveži stran.'
        )
      } else {
        setError('Iskanje letov ni uspelo. Preveri povezavo in poskusi znova.')
      }
    } finally {
      setIsSearching(false)
    }
  }

  return { offers, isSearching, error, skyscannerUrl, hasSearched, duffelTestMode, search }
}
