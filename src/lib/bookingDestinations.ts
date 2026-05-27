import { localizeCountryName } from '@/lib/bookingLocation'
import type { BookingDestination } from '@/types/booking.types'

const EXCLUDED_DEST_TYPES = new Set(['airport', 'hotel', 'landmark'])

type RawDest = {
  dest_id?: string | number
  search_type?: string
  dest_type?: string
  label?: string
  name?: string
  city_name?: string
  country?: string
  region?: string
}

function buildLabel(raw: RawDest): string {
  if (raw.label?.trim()) return raw.label.trim()
  const parts = [raw.name ?? raw.city_name, raw.region, raw.country].filter(Boolean)
  return parts.join(', ')
}

/** DataCrawler searchDestination → mesta za dropdown (brez letališč) */
export function mapBookingDestinations(data: unknown[]): BookingDestination[] {
  if (!Array.isArray(data)) return []

  const seen = new Set<string>()
  const out: BookingDestination[] = []

  for (const item of data) {
    if (!item || typeof item !== 'object') continue
    const raw = item as RawDest
    const destType = String(raw.dest_type ?? raw.search_type ?? 'city').toLowerCase()
    if (EXCLUDED_DEST_TYPES.has(destType)) continue

    const destId = raw.dest_id != null ? String(raw.dest_id) : ''
    if (!destId) continue

    const name = String(raw.name ?? raw.city_name ?? '').trim()
    if (!name) continue

    const dedupeKey = `${destId}:${destType}`
    if (seen.has(dedupeKey)) continue
    seen.add(dedupeKey)

    const country = String(raw.country ?? '').trim()
    const label = buildLabel(raw)

    out.push({
      destId,
      searchType: String(raw.search_type ?? raw.dest_type ?? 'city').toLowerCase(),
      label,
      name,
      cityName: String(raw.city_name ?? name).trim(),
      country,
      destType,
    })
  }

  return out.slice(0, 10)
}

/** Za AI / hotel iskanje — "Tuzla, Bosna in Hercegovina" */
export function formatBookingDestinationLabel(dest: BookingDestination): string {
  const country = localizeCountryName(dest.country)
  if (dest.label.includes(',') && country) {
    const parts = dest.label.split(',').map((p) => p.trim())
    const city = parts[0] ?? dest.name
    return `${city}, ${country}`
  }
  return country ? `${dest.name}, ${country}` : dest.label
}
