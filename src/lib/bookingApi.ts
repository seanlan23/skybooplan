import { formatCalendarDate } from '@/lib/calendarDate'
import {
  collectDetailsPhotoUrls,
  collectSearchResultPhotoUrls,
  dedupePhotoUrls,
  toHdBookingImageUrl,
  urlFromPhotoItem,
} from '@/lib/hotelGallery'
import type { PropertyType } from '@/types/accommodation.types'
import {
  cleanCityForBookingApi,
  extractBookingCity,
  formatHotelDisplayLocation,
  sanitizeHotelLocation,
} from '@/lib/bookingLocation'
import { buildBookingUrl, defaultChildrenAges } from '@/lib/affiliateLinks'
import { normalizeBookingGuestRating } from '@/lib/hotelRating'
import { parseDistanceKmFromText, inferLocationAreaTag } from '@/lib/hotelLocationArea'
import { ROUTE_STAY_MIN_RATING, recommendedStayScore } from '@/lib/routeStayHotels'
import type { Accommodation, AccomSource } from '@/types/accommodation.types'

const ROUTE_SEARCH_MAX_HOTELS = 36
const GALLERY_FETCH_LIMIT = 14

/** RapidAPI DataCrawler — Booking.com (nastavi v .env.local) */
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const BOOKING_HOST = process.env.RAPIDAPI_BOOKING_HOST ?? 'booking-com15.p.rapidapi.com'
/** booking-com15 zavrne `en` — mora biti npr. en-us, en-gb, sl, … */
const BOOKING_LANGUAGE = 'en-us'

const PLACEHOLDER_HOTEL_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

type DestCandidate = {
  dest_id?: string | number
  dest_type?: string
  search_type?: string
  label?: string
  city_name?: string
  name?: string
  region?: string
  country?: string
}

function formatBookingApiError(payload: Record<string, unknown>): string {
  const msg = payload.message
  if (Array.isArray(msg)) {
    const parts = msg.flatMap((m) => {
      if (typeof m === 'string') return [m]
      if (m && typeof m === 'object') return Object.values(m as Record<string, string>)
      return []
    })
    if (parts.length) return parts.join(' ')
  }
  if (typeof msg === 'string' && msg) return msg
  return 'Booking API ni vrnil rezultatov.'
}

function bookingHeaders() {
  return {
    'X-RapidAPI-Key': RAPIDAPI_KEY ?? '',
    'X-RapidAPI-Host': BOOKING_HOST,
  }
}

function pickBestDestination(candidates: DestCandidate[], query: string): DestCandidate | null {
  if (!candidates.length) return null
  const city = extractBookingCity(query).toLowerCase()

  const scored = candidates.map((c) => {
    const label = (c.label ?? c.city_name ?? c.name ?? '').toLowerCase()
    let score = 0
    if (label === city) score += 30
    else if (label.startsWith(city) || label.includes(`, ${city}`) || label.includes(`${city},`)) {
      score += 20
    } else if (label.includes(city)) score += 8

    const type = (c.dest_type ?? '').toLowerCase()
    if (type === 'city') score += 10

    if (city && !label.includes(city) && label.length > 0) score -= 15

    return { c, score }
  })

  scored.sort((a, b) => b.score - a.score)
  return scored[0]?.score > 0 ? scored[0].c : candidates.find((c) => (c.dest_type ?? '').toLowerCase() === 'city') ?? candidates[0]
}

export async function resolveBookingDestination(displayLocation: string): Promise<{
  destId: string
  searchType: string
  searchCity: string
  countryName: string
} | null> {
  if (!RAPIDAPI_KEY) return null

  const searchCity = cleanCityForBookingApi(displayLocation)
  const res = await fetch(
    `https://${BOOKING_HOST}/api/v1/hotels/searchDestination?query=${encodeURIComponent(searchCity)}`,
    { headers: bookingHeaders(), cache: 'no-store' }
  )

  const json = await res.json().catch(() => ({}))
  if (!res.ok) {
    console.error('[booking] searchDestination failed', res.status, json?.message ?? json)
    return null
  }

  const candidates = (json?.data ?? []) as DestCandidate[]
  const best = pickBestDestination(candidates, searchCity)
  if (!best?.dest_id) return null

  const searchType = (best.search_type ?? best.dest_type ?? 'city').toLowerCase()

  return {
    destId: String(best.dest_id),
    searchType,
    searchCity,
    countryName: String(best.country ?? '').trim(),
  }
}

function extractHotelsFromSearchResponse(json: Record<string, unknown>): Record<string, unknown>[] {
  const data = json.data
  if (data && typeof data === 'object') {
    const hotels = (data as Record<string, unknown>).hotels
    if (Array.isArray(hotels)) return hotels as Record<string, unknown>[]
  }
  if (Array.isArray(json.hotels)) return json.hotels as Record<string, unknown>[]
  if (Array.isArray(data)) return data as Record<string, unknown>[]
  return []
}

function extractGrossPriceEur(
  property: Record<string, unknown>,
  hotel: Record<string, unknown>
): number {
  const pools = [
    property.priceBreakdown,
    hotel.priceBreakdown,
    property.compositePriceBreakdown,
    hotel.compositePriceBreakdown,
  ]

  for (const raw of pools) {
    if (!raw || typeof raw !== 'object') continue
    const pb = raw as Record<string, unknown>
    const gross = pb.grossPrice as { value?: number; currency?: string } | undefined
    if (typeof gross?.value === 'number' && gross.value > 0) {
      return Math.round(gross.value)
    }
    const allInclusive = pb.allInclusivePrice as { value?: number } | undefined
    if (typeof allInclusive?.value === 'number' && allInclusive.value > 0) {
      return Math.round(allInclusive.value)
    }
  }

  const strikethrough = property.strikethroughPrice as { value?: number } | undefined
  if (typeof strikethrough?.value === 'number' && strikethrough.value > 0) {
    return Math.round(strikethrough.value)
  }

  return 0
}

function firstValidUrl(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('http')) return c
    if (Array.isArray(c)) {
      for (const item of c) {
        if (typeof item === 'string' && item.startsWith('http')) return item
        const nested = item as { url?: { large?: string; standard?: string }; url_max?: string }
        const u = nested?.url?.large ?? nested?.url?.standard ?? nested?.url_max
        if (u?.startsWith('http')) return u
      }
    }
  }
  return null
}

function pickHotelPhoto(property: Record<string, unknown>, hotel: Record<string, unknown>): string | null {
  const pools = [
    (property.photoUrls as unknown[] | undefined)?.[0],
    property.photoMain,
    property.mainPhotoUrl,
    property.main_photo_url,
    property.max_photo_url,
    hotel.main_photo,
    hotel.max_photo_url,
    (property.photos as unknown[] | undefined)?.[0],
    (hotel.photos as unknown[] | undefined)?.[0],
  ]
  for (const item of pools) {
    const u = urlFromPhotoItem(item) ?? (typeof item === 'string' ? toHdBookingImageUrl(item) : null)
    if (u) return u
  }
  return firstValidUrl(property.photoUrls) ? toHdBookingImageUrl(firstValidUrl(property.photoUrls)!) : null
}

function inferPropertyType(name: string, label: string): PropertyType {
  const text = `${name} ${label}`.toLowerCase()
  if (/\b(villa|vila)\b/.test(text)) return 'villa'
  if (/\b(apartment|apartma|studio|aparthotel|guesthouse|hostel)\b/.test(text)) {
    return 'apartment'
  }
  return 'hotel'
}

function pickHotelName(property: Record<string, unknown>, hotel: Record<string, unknown>): string {
  const name =
    property.name ??
    property.hotelName ??
    hotel.hotel_name ??
    hotel.name
  return String(name ?? '').trim() || 'Hotel'
}

/** getHotelDetails — sobe imajo `photos[]` z url_original, url_640x200, … */
export async function fetchBookingHotelGallery(
  hotelId: string,
  checkIn: Date,
  checkOut: Date,
  guestParams?: { adults?: number; children?: number; rooms?: number }
): Promise<string[]> {
  if (!RAPIDAPI_KEY || !hotelId) return []

  const adults = Math.max(1, guestParams?.adults ?? 2)
  const children = Math.max(0, guestParams?.children ?? 0)
  const rooms = Math.max(1, guestParams?.rooms ?? 1)

  try {
    const params = new URLSearchParams({
      hotel_id: hotelId,
      arrival_date: formatCalendarDate(checkIn),
      departure_date: formatCalendarDate(checkOut),
      adults: String(adults),
      room_qty: String(rooms),
      units: 'metric',
      languagecode: BOOKING_LANGUAGE,
      currency_code: 'EUR',
    })
    const childrenAge = defaultChildrenAges(children)
    if (childrenAge) params.set('children_age', childrenAge)

    const res = await fetch(
      `https://${BOOKING_HOST}/api/v1/hotels/getHotelDetails?${params}`,
      { headers: bookingHeaders(), cache: 'no-store' }
    )
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    if (!res.ok || json.status === false) return []

    const data = (json.data ?? json) as Record<string, unknown>
    return collectDetailsPhotoUrls(data)
  } catch {
    return []
  }
}

function mapReviewScore(raw: unknown): number {
  return normalizeBookingGuestRating(raw)
}

function extractDistanceFromCenterKm(
  label: string,
  hotel: Record<string, unknown>,
  property: Record<string, unknown>
): number | undefined {
  const fromLabel = parseDistanceKmFromText(label)
  if (fromLabel != null) return fromLabel

  const raw =
    hotel.distance_to_downtown ??
    hotel.distance ??
    property.distance_to_downtown ??
    property.distance

  if (typeof raw === 'number' && raw > 0) return raw
  if (typeof raw === 'string') {
    const parsed = parseDistanceKmFromText(raw)
    if (parsed != null) return parsed
  }
  return undefined
}

async function fetchSearchHotelsPage(
  dest: { destId: string; searchType: string },
  params: {
    checkIn: Date
    checkOut: Date
    adults: number
    children: number
    rooms: number
  },
  pageNumber: number
): Promise<Record<string, unknown>[]> {
  const searchParams = new URLSearchParams({
    dest_id: dest.destId,
    search_type: dest.searchType,
    arrival_date: formatCalendarDate(params.checkIn),
    departure_date: formatCalendarDate(params.checkOut),
    adults: String(params.adults),
    room_qty: String(params.rooms),
    page_number: String(pageNumber),
    units: 'metric',
    temperature_unit: 'c',
    languagecode: BOOKING_LANGUAGE,
    currency_code: 'EUR',
  })
  const childrenAge = defaultChildrenAges(params.children)
  if (childrenAge) searchParams.set('children_age', childrenAge)

  const hotelsRes = await fetch(
    `https://${BOOKING_HOST}/api/v1/hotels/searchHotels?${searchParams}`,
    { headers: bookingHeaders(), cache: 'no-store' }
  )

  const hotelsData = (await hotelsRes.json().catch(() => ({}))) as Record<string, unknown>
  if (!hotelsRes.ok || hotelsData.status === false) {
    return []
  }
  return extractHotelsFromSearchResponse(hotelsData)
}

export async function searchBookingHotels(params: {
  displayLocation: string
  /** Očiščeno mesto — obvezno za DataCrawler query (iz /api/hotels) */
  bookingCity?: string
  checkIn: Date
  checkOut: Date
  adults: number
  children?: number
  rooms?: number
  /** Ne kliči getHotelDetails za vsak hotel (hitrejši seznam na karticah) */
  skipGallery?: boolean
}): Promise<{ results: Accommodation[]; error?: string }> {
  if (!RAPIDAPI_KEY) {
    return { results: [], error: 'RAPIDAPI_KEY ni nastavljen.' }
  }

  const bookingCity =
    params.bookingCity?.trim() || cleanCityForBookingApi(params.displayLocation)
  const cleanLocation = sanitizeHotelLocation(params.displayLocation)

  if (process.env.NODE_ENV === 'development') {
    console.log('[booking] searchDestination query:', bookingCity)
  }

  const dest = await resolveBookingDestination(bookingCity)
  if (!dest) {
    return {
      results: [],
      error: `Destinacije «${bookingCity}» ni bilo mogoče najti na Booking.`,
    }
  }

  const nights = Math.max(
    1,
    Math.round((params.checkOut.getTime() - params.checkIn.getTime()) / 86400000)
  )

  const adults = Math.max(1, params.adults)
  const children = Math.max(0, params.children ?? 0)
  const rooms = Math.max(1, params.rooms ?? 1)

  const pageParams = {
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    adults,
    children,
    rooms,
  }

  const [page1, page2] = await Promise.all([
    fetchSearchHotelsPage(dest, pageParams, 1),
    fetchSearchHotelsPage(dest, pageParams, 2),
  ])

  const hotels = [...page1, ...page2]
  if (!hotels.length) {
    return { results: [], error: 'Za izbrane datume ni hotelov na Booking.' }
  }

  const seenIds = new Set<string>()
  const seenNames = new Set<string>()

  const mapped = await Promise.all(
    hotels.slice(0, ROUTE_SEARCH_MAX_HOTELS).map(async (h, index) => {
      const pp = (h.property ?? {}) as Record<string, unknown>
      const hotelId = String(h.hotel_id ?? h.hotelId ?? pp.id ?? '')
      if (!hotelId || seenIds.has(hotelId)) return null
      seenIds.add(hotelId)

      const hotelName = pickHotelName(pp, h)
      const nameKey = hotelName.toLowerCase()
      if (seenNames.has(nameKey)) return null
      seenNames.add(nameKey)

      const totalPrice = extractGrossPriceEur(pp, h)
      if (totalPrice <= 0) return null
      const pricePerNight = nights > 0 ? Math.round(totalPrice / nights) : totalPrice

      let imageUrl = pickHotelPhoto(pp, h)
      if (!imageUrl) imageUrl = PLACEHOLDER_HOTEL_IMAGE

      const label = (h.accessibilityLabel as string) ?? ''
      const wishlist = String(pp.wishlistName ?? '')

      let gallery = collectSearchResultPhotoUrls(pp, h)

      const hotelPageUrl = String(
        h.url ?? h.hotel_url ?? pp.url ?? pp.booking_url ?? ''
      ).trim()

      if (!params.skipGallery && hotelId && index < GALLERY_FETCH_LIMIT) {
        const detailsPhotos = await fetchBookingHotelGallery(
          hotelId,
          params.checkIn,
          params.checkOut,
          { adults, children, rooms }
        )
        if (detailsPhotos.length > 0) gallery = detailsPhotos
      }

      gallery = dedupePhotoUrls(
        gallery.length > 0 ? gallery : imageUrl ? [imageUrl] : [],
        12
      )
      if (gallery[0]) imageUrl = gallery[0]

      const distanceFromCenterKm = extractDistanceFromCenterKm(label, h, pp)

      const accommodation: Accommodation = {
        id: `booking-${hotelId}`,
        source: 'booking' as AccomSource,
        name: hotelName,
        location: formatHotelDisplayLocation(
          dest.searchCity,
          dest.countryName || String(pp.countryCode ?? '')
        ),
        neighborhood: wishlist || undefined,
        distanceFromCenterKm,
        description:
          label.trim() ||
          `${hotelName} v ${dest.searchCity}. Preveri razpoložljivost in ceno na Booking.com za izbrane datume.`,
        gallery,
        pricePerNight: pricePerNight || 1,
        totalPrice: totalPrice || pricePerNight * nights,
        currency: 'EUR',
        rating: mapReviewScore(pp.reviewScore ?? pp.review_score),
        reviewCount: Number(pp.reviewCount ?? pp.review_nr ?? 0),
        stars: Number(pp.propertyClass ?? pp.accuratePropertyClass ?? 0) || undefined,
        imageUrl,
        amenities: extractBookingAmenities(label, pp),
        hasBreakfast: label.toLowerCase().includes('breakfast'),
        isBeachfront:
          wishlist.toLowerCase().includes('beach') ||
          label.toLowerCase().includes('beach'),
        propertyType: inferPropertyType(hotelName, label),
        freeCancellation: /free cancellation|brezplačn[aą]?\s+odpoved/i.test(label),
        hasPool: /pool|bazen|swimming/i.test(label),
        hasWifi: /wifi|wi-fi|internet/i.test(label),
        affiliateUrl: buildBookingUrl({
          location: dest.searchCity,
          checkIn: params.checkIn,
          checkOut: params.checkOut,
          adults,
          children,
          rooms,
          hotelId,
          hotelPageUrl: hotelPageUrl || undefined,
        }),
        checkIn: params.checkIn,
        checkOut: params.checkOut,
      }

      accommodation.locationAreaTag = inferLocationAreaTag(accommodation)
      return accommodation
    })
  )

  const results: Accommodation[] = mapped.filter((x) => x != null) as Accommodation[]

  const uniqueById = new Map<string, Accommodation>()
  for (const r of results) {
    if (!uniqueById.has(r.id)) uniqueById.set(r.id, r)
  }

  const rated = Array.from(uniqueById.values())
    .filter((r) => r.rating >= ROUTE_STAY_MIN_RATING)
    .sort((a, b) => recommendedStayScore(b) - recommendedStayScore(a))

  if (!rated.length) {
    return {
      results: [],
      error: `Ni hotelov z oceno gostov ≥ ${ROUTE_STAY_MIN_RATING} za izbrane datume.`,
    }
  }

  return { results: rated }
}

function extractBookingAmenities(label: string, property: Record<string, unknown>): string[] {
  const amenities: string[] = []
  const lower = label.toLowerCase()
  if (lower.includes('breakfast')) amenities.push('Zajtrk')
  if (lower.includes('pool') || lower.includes('bazen')) amenities.push('Bazen')
  if (lower.includes('wifi') || lower.includes('wi-fi')) amenities.push('WiFi')
  if (property.isPreferredPlus) amenities.push('Premium')
  if (amenities.length === 0) amenities.push('WiFi')
  return amenities
}
