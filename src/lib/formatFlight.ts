import { format, parseISO } from 'date-fns'
import { sl } from 'date-fns/locale'
import type { FlightSegment } from '@/types/flight.types'

export function formatFlightTime(iso: string) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'HH:mm', { locale: sl })
  } catch {
    return iso.length >= 16 ? iso.slice(11, 16) : iso
  }
}

export function formatFlightDate(iso: string) {
  if (!iso) return '—'
  try {
    return format(parseISO(iso), 'd. MMM yyyy', { locale: sl })
  } catch {
    return iso.slice(0, 10)
  }
}

function calendarDayOffset(departIso: string, arriveIso: string): number {
  if (!departIso || !arriveIso) return 0
  try {
    const dep = parseISO(departIso)
    const arr = parseISO(arriveIso)
    const depDay = Date.UTC(dep.getFullYear(), dep.getMonth(), dep.getDate())
    const arrDay = Date.UTC(arr.getFullYear(), arr.getMonth(), arr.getDate())
    return Math.max(0, Math.round((arrDay - depDay) / 86_400_000))
  } catch {
    return 0
  }
}

export function legEndpoints(segments: FlightSegment[]) {
  if (!segments.length) return null
  const first = segments[0]
  const last = segments[segments.length - 1]
  const departAt = first.departure.at
  const arriveAt = last.arrival.at
  return {
    origin: first.departure.iataCode,
    destination: last.arrival.iataCode,
    departAt,
    arriveAt,
    departTime: formatFlightTime(departAt),
    arriveTime: formatFlightTime(arriveAt),
    arriveDayOffset: calendarDayOffset(departAt, arriveAt),
    departDate: formatFlightDate(departAt),
    arriveDate: formatFlightDate(arriveAt),
  }
}
