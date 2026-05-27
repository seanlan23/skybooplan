import { geocodePlace } from '@/lib/mapGeocode'
import type { CinematicMapMarker } from '@/store/useCinematicMapStore'
import type { ItineraryDay } from '@/types/itinerary.types'

const geocodeCache = new Map<string, [number, number]>()

export function mergeItineraryDays(
  streaming: ItineraryDay[],
  planner: ItineraryDay[]
): ItineraryDay[] {
  const byDay = new Map<number, ItineraryDay>()
  for (const d of streaming) {
    if (d.day >= 1) byDay.set(d.day, d)
  }
  for (const d of planner) {
    if (d.day >= 1) byDay.set(d.day, d)
  }
  return Array.from(byDay.values()).sort((a, b) => a.day - b.day)
}

export function itineraryDaysKey(days: ItineraryDay[]): string {
  return days.map((d) => `${d.day}:${d.location}`).join('|')
}

function cacheKey(query: string): string {
  return query.trim().toLowerCase()
}

/** Lokacija iz modrega pill-a na DayCard (npr. "Manila, Filipini"). */
export function geocodeQueryForDay(day: ItineraryDay): string {
  return day.location.trim()
}

export async function resolveDayCoordinates(
  day: ItineraryDay,
  signal?: AbortSignal
): Promise<[number, number] | null> {
  if (day.locationLat != null && day.locationLon != null) {
    return [day.locationLon, day.locationLat]
  }

  const query = geocodeQueryForDay(day)
  if (!query) return null

  const key = cacheKey(query)
  const cached = geocodeCache.get(key)
  if (cached) return cached

  let coords = await geocodePlace(query, signal)
  if (!coords && query.includes(',')) {
    const cityOnly = query.split(',')[0]?.trim()
    if (cityOnly && cityOnly !== query) {
      coords = await geocodePlace(cityOnly, signal)
    }
  }

  if (coords) {
    geocodeCache.set(key, coords)
    if (query.includes(',')) {
      geocodeCache.set(cacheKey(query.split(',')[0]!.trim()), coords)
    }
  }

  return coords
}

export async function syncMarkersForDays(
  days: ItineraryDay[],
  existing: Map<number, CinematicMapMarker>,
  signal: AbortSignal | undefined,
  onProgress: (markers: CinematicMapMarker[]) => void
): Promise<CinematicMapMarker[]> {
  const sorted = [...days].sort((a, b) => a.day - b.day)
  const next = new Map(existing)

  for (const day of sorted) {
    if (signal?.aborted) break

    const prev = next.get(day.day)
    if (prev && prev.location === day.location) {
      continue
    }

    const coords = await resolveDayCoordinates(day, signal)
    if (!coords || signal?.aborted) continue

    next.set(day.day, {
      day: day.day,
      location: day.location,
      title: day.title,
      description: day.description,
      coordinates: coords,
    })

    onProgress(
      Array.from(next.values()).sort((a, b) => a.day - b.day)
    )
  }

  return Array.from(next.values()).sort((a, b) => a.day - b.day)
}

export function clearGeocodeCache(): void {
  geocodeCache.clear()
}
