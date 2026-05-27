import { differenceInMinutes, parseISO } from 'date-fns'
import type { FlightSegment } from '@/types/flight.types'
import type { FlightTimelinePoint } from '@/types/selectedFlight.types'

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes <= 0) return '—'
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h > 0 && m > 0) return `${h}h ${m}m`
  if (h > 0) return `${h}h`
  return `${m}m`
}

function layoverMinutes(arriveAt: string, departAt: string): number {
  try {
    return Math.max(0, differenceInMinutes(parseISO(departAt), parseISO(arriveAt)))
  } catch {
    return 0
  }
}

/** Odhod → prestopi → pristanek na končni destinaciji */
export function buildOutboundTimeline(segments: FlightSegment[]): FlightTimelinePoint[] {
  if (!segments.length) return []

  const points: FlightTimelinePoint[] = [
    {
      kind: 'departure',
      iata: segments[0].departure.iataCode,
      label: 'Odhod',
      at: segments[0].departure.at,
    },
  ]

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    const isLast = i === segments.length - 1

    if (!isLast) {
      const next = segments[i + 1]
      points.push({
        kind: 'stopover',
        iata: seg.arrival.iataCode,
        label: 'Prestop',
        at: seg.arrival.at,
        connectionDepartureAt: next.departure.at,
        layoverMinutes: layoverMinutes(seg.arrival.at, next.departure.at),
      })
    } else {
      points.push({
        kind: 'arrival',
        iata: seg.arrival.iataCode,
        label: 'Pristanek',
        at: seg.arrival.at,
      })
    }
  }

  return points
}

export function totalJourneyMinutes(segments: FlightSegment[]): number {
  if (!segments.length) return 0
  const start = segments[0].departure.at
  const end = segments[segments.length - 1].arrival.at
  try {
    return Math.max(0, differenceInMinutes(parseISO(end), parseISO(start)))
  } catch {
    return 0
  }
}
