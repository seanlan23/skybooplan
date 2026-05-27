import {
  cleanCityForBookingApi,
  formatHotelDisplayLocation,
} from '@/lib/bookingLocation'
import type { Accommodation } from '@/types/accommodation.types'

export interface StayCityGroup {
  cityKey: string
  cityLabel: string
  stays: Accommodation[]
}

function cityKeyFromLocation(location: string): string {
  const cleaned = cleanCityForBookingApi(location)
  if (cleaned) return cleaned.toLowerCase()
  return location.split(',')[0]?.trim().toLowerCase() || location.toLowerCase()
}

function cityLabelFromLocation(location: string): string {
  return (
    formatHotelDisplayLocation(location) ||
    cleanCityForBookingApi(location) ||
    location.split(',')[0]?.trim() ||
    location
  )
}

function stayMatchesCity(stay: Accommodation, cityKey: string): boolean {
  return cityKeyFromLocation(stay.location) === cityKey
}

/** Združi namestitve po mestu; vrstni red sledi lokacijam iz AI načrta. */
export function groupStaysByCity(
  stays: Accommodation[],
  itineraryLocations: string[]
): StayCityGroup[] {
  const orderedKeys: string[] = []
  const labels = new Map<string, string>()

  for (const loc of itineraryLocations) {
    const key = cityKeyFromLocation(loc)
    if (!key || orderedKeys.includes(key)) continue
    orderedKeys.push(key)
    labels.set(key, cityLabelFromLocation(loc))
  }

  for (const stay of stays) {
    const key = cityKeyFromLocation(stay.location)
    if (!orderedKeys.includes(key)) {
      orderedKeys.push(key)
      labels.set(key, cityLabelFromLocation(stay.location))
    }
  }

  return orderedKeys.map((cityKey) => ({
    cityKey,
    cityLabel: labels.get(cityKey) ?? cityKey,
    stays: stays.filter((s) => stayMatchesCity(s, cityKey)),
  }))
}
