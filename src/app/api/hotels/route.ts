import { NextRequest, NextResponse } from 'next/server'
import { runHotelsSearch } from '@/lib/hotelsSearch'

/** Očisti lokacijo pred DataCrawler Booking API — samo mesto, ne letališče */
function cleanDestinationForBooking(destinationName: string): string {
  let cleanCity = destinationName.trim()
  if (!cleanCity) return cleanCity

  const firstPart = cleanCity.split(',')[0]?.trim() ?? cleanCity
  cleanCity = firstPart

  cleanCity = cleanCity.replace(/\s*\(.*?\)\s*/g, '')
  cleanCity = cleanCity.replace(/(International\s+)?Airport/gi, '').trim()
  cleanCity = cleanCity.replace(/Letališče/gi, '').trim()

  return cleanCity.replace(/\s{2,}/g, ' ').trim()
}

/** RapidAPI Booking — sinhronizirano z Duffel letom (lokacija + dan pristanka) */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const rawLocation = typeof body.location === 'string' ? body.location.trim() : ''

    const cleanCity = cleanDestinationForBooking(rawLocation)
    const countryPart = rawLocation.includes(',')
      ? rawLocation.split(',').slice(1).join(',').trim()
      : ''

    const displayLocation = countryPart ? `${cleanCity}, ${countryPart}` : cleanCity

    if (process.env.NODE_ENV === 'development' && rawLocation !== cleanCity) {
      console.log('[hotels] Booking query city:', cleanCity, '(from:', rawLocation, ')')
    }

    return runHotelsSearch({
      ...body,
      location: displayLocation,
      bookingCity: cleanCity,
    })
  } catch (err) {
    console.error('[hotels]', err)
    return NextResponse.json(
      { error: 'Iskanje hotelov ni uspelo.', results: [] },
      { status: 500 }
    )
  }
}
