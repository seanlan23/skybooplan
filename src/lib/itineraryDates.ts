import { addDays, format, parseISO, startOfDay } from 'date-fns'
import { extractBookingCity, normalizeLocationKey } from '@/lib/bookingLocation'
import type { ItineraryDay } from '@/types/itinerary.types'

export interface LocationSegment {
  location: string
  days: ItineraryDay[]
}

function locationMatches(itineraryLoc: string, preferred: string): boolean {
  const a = normalizeLocationKey(itineraryLoc)
  const b = normalizeLocationKey(extractBookingCity(preferred))
  if (!a || !b) return false
  return a === b || a.includes(b) || b.includes(a)
}

/** Zaporedni bloki z isto lokacijo (po številki dneva) */
export function groupConsecutiveLocationSegments(
  days: ItineraryDay[]
): LocationSegment[] {
  const sorted = [...days].sort((a, b) => a.day - b.day)
  const segments: LocationSegment[] = []

  for (const d of sorted) {
    const key = normalizeLocationKey(d.location)
    const last = segments[segments.length - 1]
    if (last && normalizeLocationKey(last.location) === key) {
      last.days.push(d)
    } else {
      segments.push({ location: d.location, days: [d] })
    }
  }

  return segments
}

function pickPrimarySegmentIndex(
  segments: LocationSegment[],
  preferredLabel?: string
): number {
  if (preferredLabel?.trim()) {
    const idx = segments.findIndex((s) => locationMatches(s.location, preferredLabel))
    if (idx >= 0) return idx
  }

  /** Kratek prvi blok (hub/prihod) → glavna destinacija je najdaljši med preostalimi */
  if (segments.length > 1 && segments[0].days.length <= 3) {
    const rest = segments.slice(1)
    const bestInRest = rest.reduce(
      (best, _, i) => (rest[i].days.length > rest[best].days.length ? i : best),
      0
    )
    return bestInRest + 1
  }

  return segments.reduce(
    (best, _, i) =>
      segments[i].days.length > segments[best].days.length ? i : best,
    0
  )
}

/**
 * Poravna itinerar na koledarski dan pristanka.
 * Vrstni red: Dan 1, 2, 3 … (brez premešanja segmentov) + usklajeni naslovi.
 */
export function reanchorItineraryToArrival(
  days: ItineraryDay[],
  arrivalIso: string,
  _preferredDestination?: string
): ItineraryDay[] {
  if (!days.length) return []

  const anchor = startOfDay(parseISO(arrivalIso))
  const sorted = [...days].sort((a, b) => a.day - b.day)

  return sorted.map((d, i) => {
    const dayNum = i + 1
    const stripped = d.title.replace(/^Dan\s+\d+\s*:\s*/i, '').trim()
    return {
      ...d,
      day: dayNum,
      title: stripped ? `Dan ${dayNum}: ${stripped}` : `Dan ${dayNum}`,
      estimatedDate: addDays(anchor, dayNum - 1),
    }
  })
}

export function getTripAnchorDate(arrivalIso: string): Date {
  return startOfDay(parseISO(arrivalIso))
}

export function calendarDateForDay(
  arrivalIso: string,
  dayNumber: number
): Date {
  return addDays(getTripAnchorDate(arrivalIso), dayNumber - 1)
}

export function formatDayDate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}
