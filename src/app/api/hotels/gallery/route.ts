import { NextRequest, NextResponse } from 'next/server'
import { parseCalendarDate } from '@/lib/calendarDate'
import { fetchBookingHotelGallery } from '@/lib/bookingApi'
import { dedupePhotoUrls } from '@/lib/hotelGallery'

/** Galerija za modal — getHotelDetails (rooms.photos) */
export async function GET(req: NextRequest) {
  const hotelId = req.nextUrl.searchParams.get('hotelId')?.trim()
  const checkInStr = req.nextUrl.searchParams.get('checkIn')?.trim()
  const checkOutStr = req.nextUrl.searchParams.get('checkOut')?.trim()
  const adults = Math.max(1, parseInt(req.nextUrl.searchParams.get('adults') ?? '2', 10) || 2)
  const children = Math.max(0, parseInt(req.nextUrl.searchParams.get('children') ?? '0', 10) || 0)
  const rooms = Math.max(1, parseInt(req.nextUrl.searchParams.get('rooms') ?? '1', 10) || 1)

  if (!hotelId || !checkInStr || !checkOutStr) {
    return NextResponse.json({ error: 'Manjkajo parametri.', gallery: [] }, { status: 400 })
  }

  if (!process.env.RAPIDAPI_KEY) {
    return NextResponse.json({ error: 'RAPIDAPI_KEY ni nastavljen.', gallery: [] }, { status: 503 })
  }

  try {
    const checkIn = parseCalendarDate(checkInStr)
    const checkOut = parseCalendarDate(checkOutStr)

    const gallery = await fetchBookingHotelGallery(hotelId, checkIn, checkOut, {
      adults,
      children,
      rooms,
    })

    return NextResponse.json({
      gallery: dedupePhotoUrls(gallery, 15),
      hotelId,
    })
  } catch (err) {
    console.error('[hotels/gallery]', err)
    return NextResponse.json({ error: 'Galerija ni na voljo.', gallery: [] }, { status: 500 })
  }
}
