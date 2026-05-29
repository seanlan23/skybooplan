import { format } from 'date-fns'
import { BOOKING_CJ_AFFILIATE_ID, DEFAULT_BOOKING_AID } from '@/config/booking'
import { safeNewUrl } from '@/lib/safeUrl'

export { BOOKING_CJ_AFFILIATE_ID, DEFAULT_BOOKING_AID }

export interface BookingAffiliateParams {
  location: string
  checkIn: Date
  checkOut: Date
  adults: number
  children?: number
  rooms?: number
  /** Booking hotel_id — odpre iskanje z označenim hotelom */
  hotelId?: string
  /** Direktna stran hotela iz API-ja, če je na voljo */
  hotelPageUrl?: string
  affiliateId?: string
}

function resolveAid(affiliateId?: string): string {
  return (
    affiliateId ??
    process.env.NEXT_PUBLIC_BOOKING_AID ??
    process.env.BOOKING_AID ??
    DEFAULT_BOOKING_AID
  )
}

/** Privzete starosti otrok za Booking (le število, brez starosti v UI) */
export function defaultChildrenAges(count: number): string {
  if (count <= 0) return ''
  return Array.from({ length: count }, () => '10').join(',')
}

function appendBookingQueryParams(
  url: URL,
  params: BookingAffiliateParams,
  aid: string
): string {
  url.searchParams.set('checkin', format(params.checkIn, 'yyyy-MM-dd'))
  url.searchParams.set('checkout', format(params.checkOut, 'yyyy-MM-dd'))
  url.searchParams.set('group_adults', String(Math.max(1, params.adults)))
  url.searchParams.set('group_children', String(Math.max(0, params.children ?? 0)))
  url.searchParams.set('no_rooms', String(Math.max(1, params.rooms ?? 1)))
  url.searchParams.set('aid', aid)
  url.searchParams.delete('label')
  return url.toString()
}

/** Affiliate povezava na Booking (iskanje ali konkreten hotel) */
export function buildBookingUrl(params: BookingAffiliateParams): string {
  const aid = resolveAid(params.affiliateId)
  const children = Math.max(0, params.children ?? 0)
  const rooms = Math.max(1, params.rooms ?? 1)
  const adults = Math.max(1, params.adults)

  if (params.hotelPageUrl?.trim()) {
    const raw = params.hotelPageUrl.trim()
    const url = safeNewUrl(raw.startsWith('http') ? raw : `https://www.booking.com${raw}`)
    if (url) {
      return appendBookingQueryParams(url, { ...params, adults, children, rooms }, aid)
    }
  }

  const q = new URLSearchParams({
    ss: params.location.trim() || 'Hotel',
    checkin: format(params.checkIn, 'yyyy-MM-dd'),
    checkout: format(params.checkOut, 'yyyy-MM-dd'),
    group_adults: String(adults),
    group_children: String(children),
    no_rooms: String(rooms),
    aid,
  })

  if (params.hotelId?.trim()) {
    q.set('highlighted_hotels', params.hotelId.trim())
    q.set('dest_type', 'hotel')
    q.set('dest_id', params.hotelId.trim())
  }

  return `https://www.booking.com/searchresults.html?${q}`
}

export function buildAirbnbUrl(params: {
  location: string
  checkIn: Date
  checkOut: Date
  guests: number
}): string {
  const base = 'https://www.airbnb.com/s'
  const slug = encodeURIComponent(params.location)
  const q = new URLSearchParams({
    checkin: format(params.checkIn, 'yyyy-MM-dd'),
    checkout: format(params.checkOut, 'yyyy-MM-dd'),
    adults: String(params.guests),
  })
  return `${base}/${slug}/homes?${q}`
}

export function buildHotelsUrl(params: {
  location: string
  checkIn: Date
  checkOut: Date
  adults: number
}): string {
  const base = 'https://www.hotels.com/search.do'
  const q = new URLSearchParams({
    q: params.location,
    'f-start-date': format(params.checkIn, 'MM/dd/yyyy'),
    'f-end-date': format(params.checkOut, 'MM/dd/yyyy'),
    adults: String(params.adults),
  })
  return `${base}?${q}`
}
