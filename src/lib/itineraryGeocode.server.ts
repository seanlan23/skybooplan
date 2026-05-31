import type { ItineraryDay } from '@/types/itinerary.types'

const MAPBOX_TOKEN =
  process.env.MAPBOX_SERVER_TOKEN ?? process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? ''

type LngLat = { lng: number; lat: number }

const memoryCache = new Map<string, LngLat | null>()

function normalizeQuery(location: string): { q: string; country?: string } {
  const parts = location.split(',').map((p) => p.trim()).filter(Boolean)
  if (parts.length === 0) return { q: '' }

  // Heuristika: zadnji segment je pogosto država
  const last = parts[parts.length - 1]
  const countryMap: Record<string, string> = {
    italija: 'IT',
    italy: 'IT',
    francija: 'FR',
    france: 'FR',
    španija: 'ES',
    spain: 'ES',
    nemčija: 'DE',
    germany: 'DE',
    avstrija: 'AT',
    austria: 'AT',
    slovenija: 'SI',
    slovenia: 'SI',
    hrvaška: 'HR',
    croatia: 'HR',
    grčija: 'GR',
    greece: 'GR',
    tajska: 'TH',
    thailand: 'TH',
    vietnam: 'VN',
    japonska: 'JP',
    japan: 'JP',
    indonezija: 'ID',
    indonesia: 'ID',
  }
  const country = countryMap[last.toLowerCase()]
  return { q: parts.join(', '), country }
}

async function geocodeOne(location: string): Promise<LngLat | null> {
  if (!MAPBOX_TOKEN) return null
  const key = location.trim().toLowerCase()
  if (!key) return null
  if (memoryCache.has(key)) return memoryCache.get(key) ?? null

  const { q, country } = normalizeQuery(location)
  if (!q) return null

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`
  )
  url.searchParams.set('access_token', MAPBOX_TOKEN)
  url.searchParams.set('limit', '1')
  url.searchParams.set('language', 'en')
  url.searchParams.set('types', 'place,locality,region')
  if (country) url.searchParams.set('country', country.toLowerCase())

  try {
    const res = await fetch(url.toString())
    if (!res.ok) {
      memoryCache.set(key, null)
      return null
    }
    const data = (await res.json()) as {
      features?: { center?: [number, number] }[]
    }
    const center = data.features?.[0]?.center
    if (!center || center.length < 2) {
      memoryCache.set(key, null)
      return null
    }
    const result = { lng: center[0], lat: center[1] }
    memoryCache.set(key, result)
    return result
  } catch {
    memoryCache.set(key, null)
    return null
  }
}

/**
 * Geocodira vsako unikatno lokacijo v dnevih in vrne kopijo
 * z napolnjenimi locationLat / locationLon. Vzporedno, z cache-om.
 */
export async function attachCoordsToItinerary(
  days: ItineraryDay[]
): Promise<ItineraryDay[]> {
  if (!MAPBOX_TOKEN || days.length === 0) return days

  const uniqueLocations = Array.from(
    new Set(days.map((d) => d.location?.trim()).filter(Boolean) as string[])
  )

  const entries = await Promise.all(
    uniqueLocations.map(async (loc) => [loc, await geocodeOne(loc)] as const)
  )
  const lookup = new Map(entries)

  return days.map((d) => {
    if (d.locationLat != null && d.locationLon != null) return d
    const coords = lookup.get(d.location?.trim() ?? '')
    if (!coords) return d
    return { ...d, locationLat: coords.lat, locationLon: coords.lng }
  })
}
