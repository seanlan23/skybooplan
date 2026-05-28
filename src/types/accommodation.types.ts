export type AccomSource = 'booking' | 'airbnb' | 'hotels'
export type PropertyType = 'hotel' | 'apartment' | 'villa'
export type HotelLocationAreaTag = 'center' | 'beach' | 'airport' | 'other'

export interface Accommodation {
  id: string
  source: AccomSource
  name: string
  location: string
  neighborhood?: string
  /** km do centra (Booking label ali API) */
  distanceFromCenterKm?: number
  /** Za filter lokacije na kartici dneva */
  locationAreaTag?: HotelLocationAreaTag
  description?: string
  pricePerNight: number
  totalPrice: number
  currency: string
  rating: number
  reviewCount: number
  stars?: number
  imageUrl: string
  gallery?: string[]
  amenities: string[]
  hasBreakfast: boolean
  isBeachfront: boolean
  propertyType?: PropertyType
  freeCancellation?: boolean
  hasPool?: boolean
  hasWifi?: boolean
  affiliateUrl: string
  checkIn: Date
  checkOut: Date
}

export interface AccomFilters {
  priceMin: number
  priceMax: number
  stars: number[]
  sources: AccomSource[]
  propertyTypes: PropertyType[]
  minGuestRating: number | null
  hasBreakfast: boolean | null
  isBeachfront: boolean | null
  freeCancellation: boolean | null
  hasPool: boolean | null
  hasWifi: boolean | null
  neighborhood: string | null
  sortBy: 'price_asc' | 'price_desc' | 'rating' | 'recommended'
}
