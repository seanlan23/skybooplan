import type { Accommodation, AccomFilters } from '@/types/accommodation.types'

export function filterAndSortAccommodations(
  results: Accommodation[],
  filters: AccomFilters,
  options?: { source?: Accommodation['source'] | 'all' }
): Accommodation[] {
  const source = options?.source ?? 'all'

  return results
    .filter((r) => {
      if (source !== 'all' && r.source !== source) return false
      if (r.pricePerNight < filters.priceMin || r.pricePerNight > filters.priceMax) return false

      if (filters.propertyTypes.length > 0) {
        const t = r.propertyType ?? 'hotel'
        if (!filters.propertyTypes.includes(t)) return false
      }

      if (filters.minGuestRating != null && r.rating < filters.minGuestRating) return false

      if (filters.stars.length > 0 && r.stars && !filters.stars.includes(r.stars)) {
        return false
      }

      if (filters.hasBreakfast === true && !r.hasBreakfast) return false
      if (filters.isBeachfront === true && !r.isBeachfront) return false
      if (filters.freeCancellation === true && !r.freeCancellation) return false
      if (filters.hasPool === true && !r.hasPool && !r.amenities.some((a) => /bazen|pool/i.test(a))) {
        return false
      }
      if (
        filters.hasWifi === true &&
        !r.hasWifi &&
        !r.amenities.some((a) => /wifi|wi-fi/i.test(a))
      ) {
        return false
      }

      if (
        filters.neighborhood &&
        !r.location.toLowerCase().includes(filters.neighborhood.toLowerCase()) &&
        !(r.neighborhood ?? '').toLowerCase().includes(filters.neighborhood.toLowerCase())
      ) {
        return false
      }

      return true
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'price_asc':
          return a.pricePerNight - b.pricePerNight
        case 'price_desc':
          return b.pricePerNight - a.pricePerNight
        case 'rating':
          return b.rating - a.rating
        default:
          return b.rating - a.rating
      }
    })
}
