import { format, parseISO, startOfDay } from 'date-fns'

/** Lokalni koledarski dan (brez UTC zamika pri Booking API) */
export function formatCalendarDate(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

export function parseCalendarDate(value: string): Date {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value.trim())
  if (m) {
    return startOfDay(new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3])))
  }
  return startOfDay(parseISO(value))
}
