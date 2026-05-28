import {
  inferLocationAreaTag,
  matchesLocationAreaFilter,
  type LocationAreaFilter,
} from '@/lib/hotelLocationArea'
import type { Accommodation } from '@/types/accommodation.types'

/** Booking.com gostinska ocena — vedno uporabljeno za priporočene nastanitve na poti. */
export const ROUTE_STAY_MIN_RATING = 7.5

export type RouteStayPriceSort = 'price_asc' | 'price_desc' | null
export type RouteStayRatingSort = 'rating_asc' | 'rating_desc' | null

export interface RouteStayFilterState {
  priceSort: RouteStayPriceSort
  ratingSort: RouteStayRatingSort
  locationFilter: LocationAreaFilter
}

export const DEFAULT_ROUTE_STAY_FILTERS: RouteStayFilterState = {
  priceSort: null,
  ratingSort: null,
  locationFilter: 'all',
}

/** Najboljša vrednost: visoka ocena, veliko ocen, razumna cena. */
export function recommendedStayScore(hotel: Accommodation): number {
  const ratingNorm = hotel.rating / 10
  const reviewBoost = Math.min(1, Math.log10(Math.max(hotel.reviewCount, 0) + 10) / 2.5)
  const pricePenalty = Math.min(1, hotel.pricePerNight / 600)
  return ratingNorm * 0.55 + reviewBoost * 0.35 - pricePenalty * 0.12
}

export function prepareRouteStayHotels(raw: Accommodation[]): Accommodation[] {
  return raw
    .filter((h) => h.rating >= ROUTE_STAY_MIN_RATING)
    .map((h) => ({
      ...h,
      locationAreaTag: h.locationAreaTag ?? inferLocationAreaTag(h),
    }))
    .sort((a, b) => recommendedStayScore(b) - recommendedStayScore(a))
}

export function applyRouteStayFilters(
  hotels: Accommodation[],
  filters: RouteStayFilterState
): Accommodation[] {
  let list = hotels.filter((h) => matchesLocationAreaFilter(h, filters.locationFilter))

  if (filters.priceSort === 'price_asc') {
    list = [...list].sort((a, b) => a.pricePerNight - b.pricePerNight)
  } else if (filters.priceSort === 'price_desc') {
    list = [...list].sort((a, b) => b.pricePerNight - a.pricePerNight)
  } else if (filters.ratingSort === 'rating_asc') {
    list = [...list].sort((a, b) => a.rating - b.rating)
  } else if (filters.ratingSort === 'rating_desc') {
    list = [...list].sort((a, b) => b.rating - a.rating)
  } else {
    list = [...list].sort((a, b) => recommendedStayScore(b) - recommendedStayScore(a))
  }

  return list
}
