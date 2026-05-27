import { NextRequest, NextResponse } from 'next/server'
import { cleanCityForBookingApi } from '@/lib/bookingLocation'
import { mapBookingDestinations } from '@/lib/bookingDestinations'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const BOOKING_HOST = process.env.RAPIDAPI_BOOKING_HOST ?? 'booking-com15.p.rapidapi.com'

/** DataCrawler searchDestination — mesta za način «Samo namestitve» */
export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim() ?? ''
  if (q.length < 2) {
    return NextResponse.json({ destinations: [] })
  }

  if (!RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: 'RAPIDAPI_KEY ni nastavljen.', destinations: [] },
      { status: 503 }
    )
  }

  const query = cleanCityForBookingApi(q)

  try {
    const res = await fetch(
      `https://${BOOKING_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(query)}`,
      {
        headers: {
          'X-RapidAPI-Key': RAPIDAPI_KEY,
          'X-RapidAPI-Host': BOOKING_HOST,
        },
        cache: 'no-store',
      }
    )

    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok || json.status === false) {
      return NextResponse.json({ destinations: [], error: 'Iskanje mest ni uspelo.' })
    }

    const destinations = mapBookingDestinations(json.data as unknown[])

    return NextResponse.json({ destinations, query })
  } catch (err) {
    console.error('[hotels/destinations]', err)
    return NextResponse.json(
      { error: 'Iskanje mest ni uspelo.', destinations: [] },
      { status: 500 }
    )
  }
}
