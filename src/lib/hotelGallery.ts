/** Ekstrakcija, HD URL-ji in deduplikacija Booking / DataCrawler fotografij */

const BSTATIC_PHOTO_ID = /\/(?:square\d+|max\d+|max1280|max1440|640x200)\/(\d+)\./i
const BSTATIC_ANY_ID = /\/(\d+)\.(?:jpg|jpeg|webp)/i

const RESOLUTION_RANK: Record<string, number> = {
  square60: 1,
  square180: 2,
  square500: 3,
  max300: 4,
  max500: 5,
  max750: 6,
  '640x200': 7,
  square1024: 8,
  square2000: 9,
  max1280: 10,
  max1440: 11,
  original: 12,
}

function resolutionScore(url: string): number {
  for (const [key, score] of Object.entries(RESOLUTION_RANK)) {
    if (url.includes(`/${key}/`)) return score
  }
  if (url.includes('url_original')) return 12
  return 3
}

/** Zamenjaj thumbnail poti z max1280 / max1440 za ostre slike */
export function toHdBookingImageUrl(url: string): string {
  if (!url?.startsWith('http') || !url.includes('bstatic.com')) return url

  const upgraded = url
    .replace(/\/square\d+\//i, '/max1280/')
    .replace(/\/max300\//i, '/max1280/')
    .replace(/\/max500\//i, '/max1280/')
    .replace(/\/max750\//i, '/max1280/')
    .replace(/\/640x200\//i, '/max1280/')

  if (!/\/max\d+\//i.test(upgraded) && !/\/square\d+\//i.test(upgraded)) {
    const id = extractBstaticPhotoId(url)
    if (id) {
      const q = url.includes('?') ? url.slice(url.indexOf('?')) : ''
      return `https://cf.bstatic.com/xdata/images/hotel/max1280/${id}.jpg${q}`
    }
  }

  return upgraded
}

export function extractBstaticPhotoId(url: string): string | null {
  const m = url.match(BSTATIC_PHOTO_ID) ?? url.match(BSTATIC_ANY_ID)
  return m?.[1] ?? null
}

/** En URL na unikatno fotografijo — najvišja ločljivost (HD) */
export function dedupePhotoUrls(urls: string[], max = 12): string[] {
  const byId = new Map<string, { url: string; score: number }>()

  for (const raw of urls) {
    if (typeof raw !== 'string' || !raw.startsWith('http')) continue
    const url = toHdBookingImageUrl(raw.trim())
    const id = extractBstaticPhotoId(url) ?? url
    const score = resolutionScore(url)
    const prev = byId.get(id)
    if (!prev || score > prev.score) byId.set(id, { url, score })
  }

  return Array.from(byId.values())
    .sort((a, b) => b.score - a.score)
    .map((x) => x.url)
    .slice(0, max)
}

export function urlFromPhotoItem(item: unknown): string | null {
  if (typeof item === 'string' && item.startsWith('http')) {
    return toHdBookingImageUrl(item)
  }
  if (!item || typeof item !== 'object') return null

  const o = item as Record<string, unknown>
  const nested = o.url as { large?: string; standard?: string; thumbnail?: string } | undefined

  const candidates = [
    o.url_max1280,
    o.url_max1440,
    o.url_original,
    o.url_max,
    o.image_url,
    o.imageUrl,
    o.max_photo_url,
    o.url_large,
    nested?.large,
    o.url_max750,
    nested?.standard,
    o.url_640x200,
    o.url_max300,
    o.url,
    nested?.thumbnail,
    o.url_square60,
  ]

  for (const c of candidates) {
    if (typeof c === 'string' && c.startsWith('http')) {
      return toHdBookingImageUrl(c)
    }
  }
  return null
}

export function extractUrlsFromPhotoPool(pool: unknown): string[] {
  if (!Array.isArray(pool)) return []
  const urls: string[] = []
  for (const item of pool) {
    const u = urlFromPhotoItem(item)
    if (u) urls.push(u)
  }
  return urls
}

function flattenGalleryPool(pool: unknown): unknown[] {
  if (!pool) return []
  if (Array.isArray(pool)) return pool
  if (typeof pool === 'object') {
    const o = pool as Record<string, unknown>
    if (Array.isArray(o.photos)) return o.photos
    if (Array.isArray(o.images)) return o.images
    if (Array.isArray(o.gallery)) return o.gallery
  }
  return []
}

/** searchHotels — property.photoUrls, photos, property_gallery, images */
export function collectSearchResultPhotoUrls(
  property: Record<string, unknown>,
  hotel: Record<string, unknown>
): string[] {
  const pools: unknown[] = [
    property.photoUrls,
    property.photos,
    property.property_gallery,
    property.images,
    property.gallery,
    hotel.photos,
    hotel.images,
    hotel.property_gallery,
  ]

  const urls: string[] = []
  for (const pool of pools) {
    urls.push(...extractUrlsFromPhotoPool(flattenGalleryPool(pool)))
    if (Array.isArray(pool)) {
      for (const item of pool) {
        if (typeof item === 'string') urls.push(toHdBookingImageUrl(item))
      }
    }
  }
  return dedupePhotoUrls(urls)
}

/** getHotelDetails — rooms.*.photos + rawData */
export function collectDetailsPhotoUrls(data: Record<string, unknown>): string[] {
  const urls: string[] = []

  const raw = data.rawData as Record<string, unknown> | undefined
  if (raw) {
    urls.push(...extractUrlsFromPhotoPool(raw.photoUrls))
    urls.push(...extractUrlsFromPhotoPool(raw.photos))
    urls.push(...extractUrlsFromPhotoPool(raw.property_gallery))
  }

  urls.push(...extractUrlsFromPhotoPool(data.photos))
  urls.push(...extractUrlsFromPhotoPool(data.property_gallery))
  urls.push(...extractUrlsFromPhotoPool(data.images))

  const property = data.property as Record<string, unknown> | undefined
  if (property) {
    urls.push(...collectSearchResultPhotoUrls(property, {}))
  }

  const rooms = data.rooms as Record<string, { photos?: unknown[] }> | undefined
  if (rooms && typeof rooms === 'object') {
    for (const room of Object.values(rooms)) {
      if (room?.photos) urls.push(...extractUrlsFromPhotoPool(room.photos))
    }
  }

  return dedupePhotoUrls(urls, 15)
}

export function parseBookingHotelId(accommodationId: string): string | null {
  const m = accommodationId.match(/^booking-(.+)$/)
  return m?.[1] ?? null
}
