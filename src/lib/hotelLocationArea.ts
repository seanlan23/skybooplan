import type { Accommodation } from '@/types/accommodation.types'

export type LocationAreaTag = 'center' | 'beach' | 'airport' | 'other'

export type LocationAreaFilter = 'all' | 'center' | 'beach' | 'airport'

/** Razdalja iz Booking accessibilityLabel (npr. "2.1 km from downtown"). */
export function parseDistanceKmFromText(text: string): number | null {
  const m = text.match(/([\d]+[.,]?\d*)\s*km/i)
  if (!m) return null
  const n = parseFloat(m[1].replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function inferLocationAreaTag(hotel: Accommodation): LocationAreaTag {
  if (hotel.locationAreaTag) return hotel.locationAreaTag

  const blob = [
    hotel.neighborhood,
    hotel.description,
    hotel.name,
    hotel.location,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()

  if (/airport|letališče|aeroport|flughafen/i.test(blob)) {
    return 'airport'
  }

  if (
    hotel.isBeachfront ||
    /beach|plaža|plaza|coast|obala|seaside|pobrzeże|strand|marina/i.test(blob)
  ) {
    return 'beach'
  }

  const dist = hotel.distanceFromCenterKm
  if (dist != null && dist < 2) return 'center'

  if (
    /city cent(er|re)|downtown|old town|centar|center|centre|ljubljana city|heart of/i.test(
      blob
    )
  ) {
    return 'center'
  }

  return 'other'
}

export function matchesLocationAreaFilter(
  hotel: Accommodation,
  filter: LocationAreaFilter
): boolean {
  if (filter === 'all') return true
  const tag = inferLocationAreaTag(hotel)
  if (filter === 'center') {
    return tag === 'center' || (hotel.distanceFromCenterKm != null && hotel.distanceFromCenterKm < 2)
  }
  return tag === filter
}
