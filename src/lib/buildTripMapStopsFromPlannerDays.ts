import type { TripMapItinerary, TripMapStop } from '@/components/map/TripMap'
import type { ItineraryDay } from '@/types/itinerary.types'

/** Zgradi TripMap stops iz AI planner ItineraryDay[] (homepage). */
export function buildTripMapStopsFromPlannerDays(days: ItineraryDay[]): TripMapItinerary {
  const stops: TripMapStop[] = []

  for (const day of days) {
    const lat = day.locationLat
    const lng = day.locationLon
    if (typeof lat !== 'number' || typeof lng !== 'number') continue

    stops.push({
      id: `city-${day.day}`,
      name: day.title || day.location,
      lat,
      lng,
      day: day.day,
      type: 'city',
    })

    for (const s of day.suggestions ?? []) {
      stops.push({
        id: `sug-${day.day}-${s.name}`,
        name: s.name,
        lat,
        lng: lng + 0.002 * (stops.length % 3),
        day: day.day,
        type: 'activity',
        category: 'attraction',
      })
    }
  }

  return { stops }
}

export function plannerDayForLocation(days: ItineraryDay[], location: string | null): number | null {
  if (!location) return null
  const day = days.find((d) => d.location === location)
  return day?.day ?? null
}
