import { NextRequest, NextResponse } from 'next/server'
import { duffelErrorMessage, isDuffelTestToken, searchFlightsDuffel } from '@/lib/duffelApi'
import { applyCo2SavingsToOffers } from '@/lib/flightEmissions'
import { buildAffiliateSkyscannerFlightsUrl } from '@/lib/travelpayoutsLinks'

export const maxDuration = 60

type AirportInput = { iata: string }

function iataFrom(value: string | AirportInput | undefined): string | undefined {
  if (!value) return undefined
  return (typeof value === 'string' ? value : value.iata).toUpperCase()
}

/**
 * Iskanje letov preko Duffel (zanesljivo) + affiliate Skyscanner URL za gumb Izberi.
 */
export async function POST(req: NextRequest) {
  const body = await req.json()
  const {
    origins = [],
    destination,
    departureDate,
    tripType = 'one_way',
    returnDate,
    adults = 1,
    children = 0,
    cabinClass = 'economy',
  } = body

  const originIata = iataFrom(
    Array.isArray(origins) ? (typeof origins[0] === 'string' ? origins[0] : origins[0]) : undefined
  )
  const destinationIata = iataFrom(
    typeof destination === 'string' ? destination : destination
  )

  if (!originIata || !destinationIata || !departureDate) {
    return NextResponse.json({ error: 'Manjkajo obvezna polja.' }, { status: 400 })
  }

  if (tripType === 'return' && !returnDate) {
    return NextResponse.json(
      { error: 'Za povratni let je obvezen datum povratka.' },
      { status: 400 }
    )
  }

  const returnDateIso = tripType === 'return' ? returnDate : undefined

  const skyscannerUrl = buildAffiliateSkyscannerFlightsUrl({
    origin: originIata,
    destination: destinationIata,
    departDate: departureDate,
    returnDate: returnDateIso,
    adults,
    cabinClass,
  })

  if (!process.env.DUFFEL_ACCESS_TOKEN) {
    return NextResponse.json({
      offers: [],
      total: 0,
      skyscannerUrl,
      error: 'DUFFEL_ACCESS_TOKEN ni nastavljen. Dodaj Duffel ključ v .env.local.',
    })
  }

  try {
    const rawOffers = await searchFlightsDuffel({
      origin: originIata,
      destination: destinationIata,
      departDate: departureDate,
      returnDate: returnDateIso,
      adults,
      children,
      cabinClass,
    })
    const offers = applyCo2SavingsToOffers(rawOffers)

    return NextResponse.json({
      offers,
      total: offers.length,
      skyscannerUrl,
      source: 'duffel',
      duffelTestMode: isDuffelTestToken(),
    })
  } catch (err) {
    return NextResponse.json(
      {
        offers: [],
        total: 0,
        skyscannerUrl,
        error: duffelErrorMessage(err),
      },
      { status: 502 }
    )
  }
}
