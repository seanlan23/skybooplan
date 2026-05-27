import type { FlightOffer } from '@/types/flight.types'

const MIN_SAVINGS_PERCENT = 5

function medianKg(offers: FlightOffer[]): number | null {
  const values = offers
    .map((o) => o.totalEmissionsKg)
    .filter((v): v is number => v != null && v > 0)
    .sort((a, b) => a - b)

  if (!values.length) return null
  const mid = Math.floor(values.length / 2)
  return values.length % 2 === 0 ? (values[mid - 1] + values[mid]) / 2 : values[mid]
}

/**
 * Primerjava z mediano trenutnih rezultatov (ne z globalnim "typical route" kot Skyscanner).
 * Prikaz samo če je let vsaj 5 % pod mediano.
 */
export function applyCo2SavingsToOffers(offers: FlightOffer[]): FlightOffer[] {
  const median = medianKg(offers)
  if (median == null || median <= 0) return offers

  return offers.map((offer) => {
    const kg = offer.totalEmissionsKg
    if (kg == null || kg <= 0) return offer

    const savings = Math.round((1 - kg / median) * 100)
    if (savings < MIN_SAVINGS_PERCENT) return offer

    return { ...offer, co2SavingsPercent: savings }
  })
}
