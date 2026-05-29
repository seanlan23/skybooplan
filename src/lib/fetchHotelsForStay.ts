import { formatCalendarDate } from '@/lib/calendarDate'
import { isAbortError } from '@/lib/fetchUtils'
import { cleanCityForBookingApi } from '@/lib/bookingLocation'
import { prepareRouteStayHotels } from '@/lib/routeStayHotels'
import type { Accommodation } from '@/types/accommodation.types'

export async function fetchHotelsForStay(
  params: {
    location: string
    checkIn: Date
    checkOut: Date
    adults: number
    children: number
    rooms: number
    arrivalAt?: string
  },
  signal?: AbortSignal
): Promise<{ hotels: Accommodation[]; error?: string }> {
  let res: Response
  try {
    res = await fetch('/api/hotels', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location: params.location,
        bookingCity: cleanCityForBookingApi(params.location),
        checkIn: formatCalendarDate(params.checkIn),
        checkOut: formatCalendarDate(params.checkOut),
        adults: params.adults,
        children: params.children,
        rooms: params.rooms,
        arrivalAt: params.arrivalAt,
        /** List cards only need search thumbnails — skip 14× gallery API calls per city */
        lite: true,
      }),
      signal,
    })
  } catch (error) {
    if (isAbortError(error)) return { hotels: [] }
    throw error
  }

  const data = (await res.json()) as {
    results?: Accommodation[]
    error?: string
  }

  const hotels = prepareRouteStayHotels(
    ((data.results ?? []) as Accommodation[])
      .filter(
        (r) =>
          r.source === 'booking' &&
          !r.id.includes('mock') &&
          !r.id.includes('fallback')
      )
      .map((r) => ({
        ...r,
        checkIn: new Date(r.checkIn),
        checkOut: new Date(r.checkOut),
      }))
  )

  return { hotels, error: data.error }
}
