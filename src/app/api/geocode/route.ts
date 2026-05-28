import { NextRequest, NextResponse } from 'next/server'

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q')?.trim()
  const country = req.nextUrl.searchParams.get('country')?.trim().toUpperCase()

  if (!q) {
    return NextResponse.json({ error: 'Missing q' }, { status: 400 })
  }
  if (!MAPBOX_TOKEN) {
    return NextResponse.json({ error: 'Mapbox token not configured' }, { status: 503 })
  }

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  )
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('limit', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('types', 'place,locality')

  if (country && country.length === 2) {
    url.searchParams.set('country', country)
  }

  try {
    const res = await fetch(url.toString(), { next: { revalidate: 86400 } })
    if (!res.ok) {
      return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 })
    }

    const data = (await res.json()) as {
      features?: { center?: [number, number] }[]
    }

    const center = data.features?.[0]?.center
    if (!center || center.length < 2) {
      return NextResponse.json({ error: 'No results' }, { status: 404 })
    }

    return NextResponse.json({ lng: center[0], lat: center[1] })
  } catch {
    return NextResponse.json({ error: 'Geocoding failed' }, { status: 502 })
  }
}
