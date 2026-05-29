import type { Accommodation } from '@/types/accommodation.types'

export interface HotelFetchCacheEntry {
  hotels: Accommodation[]
  error?: string
}

const cache: Record<string, HotelFetchCacheEntry> = {}

export function buildHotelFetchCacheKey(params: {
  location: string
  checkIn: string
  checkOut: string
  adults: number
  children: number
  rooms: number
}): string {
  return [
    params.location.trim().toLowerCase(),
    params.checkIn,
    params.checkOut,
    params.adults,
    params.children,
    params.rooms,
  ].join('|')
}

export function getHotelFetchCache(key: string): HotelFetchCacheEntry | null {
  return cache[key] ?? null
}

export function setHotelFetchCache(key: string, entry: HotelFetchCacheEntry): void {
  cache[key] = entry
}

export function clearHotelFetchCache(): void {
  for (const key of Object.keys(cache)) {
    delete cache[key]
  }
}
