import { addDays, startOfDay } from 'date-fns'
import { normalizeLocationKey } from '@/lib/bookingLocation'
import type { ItineraryDay } from '@/types/itinerary.types'

/** Zaporedni dnevi z isto lokacijo → check-in/out za Booking (od koledarskega dne pristanka) */
export function computeStayWindow(
  itinerary: ItineraryDay[],
  location: string,
  clickedDay: number,
  tripStart: Date
): { checkIn: Date; checkOut: Date } {
  const key = normalizeLocationKey(location)
  const daysAtLocation = itinerary
    .filter((d) => normalizeLocationKey(d.location) === key)
    .map((d) => d.day)
    .sort((a, b) => a - b)

  const minDay = daysAtLocation.length > 0 ? Math.min(...daysAtLocation) : clickedDay
  const maxDay = daysAtLocation.length > 0 ? Math.max(...daysAtLocation) : clickedDay

  const anchor = startOfDay(tripStart)
  const checkIn = addDays(anchor, minDay - 1)
  /** Odjava = dan po zadnjem dnevu bivanja na lokaciji */
  const checkOut = addDays(anchor, maxDay)

  return { checkIn, checkOut }
}

/** Prva lokacija v poravnanem itinerarju (dan 1) */
export function getFirstItineraryLocation(itinerary: ItineraryDay[]): string | null {
  const sorted = [...itinerary].sort((a, b) => a.day - b.day)
  return sorted[0]?.location ?? null
}

export function computeStayWindowForFirstLocation(
  itinerary: ItineraryDay[],
  tripStart: Date
): { location: string; checkIn: Date; checkOut: Date } | null {
  const location = getFirstItineraryLocation(itinerary)
  if (!location) return null

  const key = normalizeLocationKey(location)
  const daysAtLocation = itinerary
    .filter((d) => normalizeLocationKey(d.location) === key)
    .map((d) => d.day)
    .sort((a, b) => a - b)

  const maxDay = daysAtLocation.length > 0 ? Math.max(...daysAtLocation) : 1
  const anchor = startOfDay(tripStart)

  return {
    location,
    /** Prvi hotel vedno od dneva pristanka letala */
    checkIn: anchor,
    checkOut: addDays(anchor, maxDay),
  }
}
