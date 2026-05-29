import { NextResponse } from 'next/server'
import { parseISO, startOfDay } from 'date-fns'
import { formatCalendarDate, parseCalendarDate } from '@/lib/calendarDate'
import { getCached, setCached } from '@/lib/redis'
import { extractBookingCity, sanitizeHotelLocation } from '@/lib/bookingLocation'
import { searchBookingHotels } from '@/lib/bookingApi'
import type { Accommodation } from '@/types/accommodation.types'

export interface HotelsSearchBody {
  location: string
  /** Očiščeno ime mesta za DataCrawler (nastavi /api/hotels) */
  bookingCity?: string
  checkIn: string
  checkOut: string
  adults?: number
  children?: number
  rooms?: number
  /** @deprecated uporabi adults/children/rooms */
  guests?: number
  /** ISO čas pristanka (Duffel) — check-in se poravna na ta koledarski dan */
  arrivalAt?: string
  /** Hitrejši seznam — brez dodatnih gallery klicov na Booking API */
  lite?: boolean
}

export async function runHotelsSearch(body: HotelsSearchBody) {
  const rawLocation = body.location?.trim() ?? ''
  const location = sanitizeHotelLocation(rawLocation)
  const bookingCity =
    body.bookingCity?.trim() || extractBookingCity(rawLocation)
  const { checkIn: checkInStr, checkOut: checkOutStr, arrivalAt } = body
  const adults = Math.max(1, body.adults ?? body.guests ?? 2)
  const children = Math.max(0, body.children ?? 0)
  const rooms = Math.max(1, body.rooms ?? 1)

  if (!location || !checkInStr || !checkOutStr) {
    return NextResponse.json({ error: 'Manjkajo obvezna polja.', results: [] }, { status: 400 })
  }

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json(
      { error: 'RAPIDAPI_KEY ni nastavljen v .env.local', results: [] },
      { status: 503 }
    )
  }

  const checkOut = parseCalendarDate(checkOutStr)
  const checkIn = arrivalAt
    ? startOfDay(parseISO(arrivalAt))
    : parseCalendarDate(checkInStr)

  if (checkOut <= checkIn) {
    return NextResponse.json(
      { error: 'Odjava mora biti po prihodu.', results: [] },
      { status: 400 }
    )
  }

  const checkInKey = formatCalendarDate(checkIn)
  const checkOutKey = formatCalendarDate(checkOut)

  const cacheKey = `booking:v11:${bookingCity}:${checkInKey}:${checkOutKey}:${adults}:${children}:${rooms}${body.lite ? ':lite' : ''}`
  const cached = await getCached<Accommodation[]>(cacheKey)
  if (cached?.length) {
    return NextResponse.json({
      results: cached.filter((r) => !r.id.includes('fallback')),
      searchCity: bookingCity,
      checkIn: checkInKey,
      checkOut: checkOutKey,
    })
  }

  const { results, error } = await searchBookingHotels({
    displayLocation: location,
    bookingCity,
    checkIn,
    checkOut,
    adults,
    children,
    rooms,
    skipGallery: body.lite === true,
  })

  if (results.length > 0) {
    await setCached(cacheKey, results, 600)
  }

  return NextResponse.json({
    results,
    searchCity: bookingCity,
    checkIn: checkInKey,
    checkOut: checkOutKey,
    error: results.length === 0 ? error ?? 'Ni hotelov za izbrane datume.' : undefined,
  })
}
