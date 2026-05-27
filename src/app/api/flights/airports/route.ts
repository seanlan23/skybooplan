import { NextRequest, NextResponse } from 'next/server'
import { searchFallbackAirports } from '@/data/airports'
import { searchAirportsDuffel } from '@/lib/duffelApi'
import { searchAirportsFlightsSky } from '@/lib/flightsSkyApi'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const q = searchParams.get('q') ?? ''
  if (q.length < 2) return NextResponse.json([])

  if (process.env.DUFFEL_ACCESS_TOKEN) {
    try {
      const airports = await searchAirportsDuffel(q)
      if (airports.length > 0) return NextResponse.json(airports)
    } catch {
      /* fallback */
    }
  }

  if (process.env.RAPIDAPI_KEY) {
    try {
      const airports = await searchAirportsFlightsSky(q)
      if (airports.length > 0) return NextResponse.json(airports)
    } catch {
      /* fallback */
    }
  }

  return NextResponse.json(searchFallbackAirports(q))
}
