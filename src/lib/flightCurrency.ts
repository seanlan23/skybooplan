/** Target currency for flight cards (Duffel has no request-level currency param). */
export const FLIGHT_DISPLAY_CURRENCY = (
  process.env.FLIGHTS_DISPLAY_CURRENCY ?? 'EUR'
).toUpperCase()

const USD_TO_EUR_RATE = parseFloat(process.env.FLIGHTS_USD_TO_EUR_RATE ?? '0.92')

export interface NormalizedFlightPrice {
  /** Rounded price shown per passenger on cards */
  displayAmount: number
  displayCurrency: string
  /** Original total from Duffel for all passengers */
  totalAmount: number
  sourceCurrency: string
}

/**
 * Duffel `total_amount` is for ALL passengers in the offer.
 * Cards label prices as "per adult" — divide accordingly.
 * If source currency differs from display currency, convert (e.g. USD → EUR).
 */
export function normalizeFlightOfferPrice(
  totalAmount: number,
  sourceCurrency: string | undefined,
  passengerCount: number
): NormalizedFlightPrice {
  const source = (sourceCurrency?.trim() || FLIGHT_DISPLAY_CURRENCY).toUpperCase()
  const passengers = Math.max(1, passengerCount)
  const target = FLIGHT_DISPLAY_CURRENCY

  let totalInTarget = totalAmount

  if (source === 'USD' && target === 'EUR' && Number.isFinite(USD_TO_EUR_RATE)) {
    totalInTarget = totalAmount * USD_TO_EUR_RATE
  } else if (source === 'EUR' && target === 'USD' && Number.isFinite(USD_TO_EUR_RATE) && USD_TO_EUR_RATE > 0) {
    totalInTarget = totalAmount / USD_TO_EUR_RATE
  } else if (source !== target) {
    return {
      displayAmount: Math.round(totalAmount / passengers),
      displayCurrency: source,
      totalAmount,
      sourceCurrency: source,
    }
  }

  return {
    displayAmount: Math.round(totalInTarget / passengers),
    displayCurrency: target,
    totalAmount,
    sourceCurrency: source,
  }
}

export function formatFlightPrice(price: number, currency: string): string {
  const c = currency.toUpperCase()
  if (c === 'EUR') return `${price} €`
  if (c === 'USD') return `$${price}`
  return `${price} ${c}`
}
