import { startOfDay } from 'date-fns'
import {
  cleanCityForBookingApi,
  formatHotelDisplayLocation,
  normalizeLocationKey,
} from '@/lib/bookingLocation'
import { computeStayWindow } from '@/lib/itineraryStay'
import type { ItineraryDay } from '@/types/itinerary.types'

export interface ItineraryCitySegment {
  segmentKey: string
  location: string
  cityLabel: string
  cityKey: string
  firstDay: number
  checkIn: Date
  checkOut: Date
}

export function cityLabelFromLocation(location: string): string {
  return (
    formatHotelDisplayLocation(location) ||
    cleanCityForBookingApi(location) ||
    location.split(',')[0]?.trim() ||
    location
  )
}

function segmentKey(
  cityKey: string,
  checkIn: Date,
  checkOut: Date
): string {
  return `${cityKey}|${checkIn.toISOString().slice(0, 10)}|${checkOut.toISOString().slice(0, 10)}`
}

/** Zaporedni bloki iste lokacije — hoteli samo na prvem dnevu bloka. */
export function buildItineraryCitySegments(
  itinerary: ItineraryDay[],
  tripStart: Date
): ItineraryCitySegment[] {
  const sorted = [...itinerary].sort((a, b) => a.day - b.day)
  if (sorted.length === 0) return []

  const segments: ItineraryCitySegment[] = []
  const anchor = startOfDay(tripStart)

  let i = 0
  while (i < sorted.length) {
    const location = sorted[i].location
    const cityKey = normalizeLocationKey(location)
    let j = i
    while (
      j + 1 < sorted.length &&
      normalizeLocationKey(sorted[j + 1].location) === cityKey
    ) {
      j++
    }

    const firstDay = sorted[i].day
    const { checkIn, checkOut } = computeStayWindow(
      sorted,
      location,
      firstDay,
      anchor
    )

    segments.push({
      segmentKey: segmentKey(cityKey, checkIn, checkOut),
      location,
      cityLabel: cityLabelFromLocation(location),
      cityKey,
      firstDay,
      checkIn,
      checkOut,
    })

    i = j + 1
  }

  return segments
}

export function isFirstDayForCity(
  day: ItineraryDay,
  itinerary: ItineraryDay[]
): boolean {
  const key = normalizeLocationKey(day.location)
  const sorted = [...itinerary].sort((a, b) => a.day - b.day)
  const first = sorted.find((d) => normalizeLocationKey(d.location) === key)
  return first?.day === day.day
}

export function findSegmentForDay(
  day: ItineraryDay,
  itinerary: ItineraryDay[],
  tripStart: Date
): ItineraryCitySegment | null {
  if (!isFirstDayForCity(day, itinerary)) return null
  return (
    buildItineraryCitySegments(itinerary, tripStart).find(
      (s) => s.firstDay === day.day
    ) ?? null
  )
}
