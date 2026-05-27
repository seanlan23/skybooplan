import { addDays, differenceInCalendarDays, startOfDay } from 'date-fns'
import { extractBookingCity } from '@/lib/bookingLocation'
import { buildBookingUrl } from '@/lib/affiliateLinks'
import type { Accommodation } from '@/types/accommodation.types'

const HOTEL_IMAGES = [
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80',
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80',
  'https://images.unsplash.com/photo-1618773928121-c32242e63f39?w=800&q=80',
  'https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80',
  'https://images.unsplash.com/photo-1578683010236-d716f9a3fdf5?w=800&q=80',
  'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80',
  'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&q=80',
  'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80',
]

const NAME_TEMPLATES = [
  '{city} Grand Hotel',
  '{city} Riverside Inn',
  '{city} Boutique Stay',
  '{city} City Center Hotel',
  '{city} Garden Resort',
  '{city} Skyline Suites',
  '{city} Comfort Lodge',
  '{city} Heritage House',
]

/** Rezervni prikaz hotelov, če Booking API ne vrne podatkov */
export function buildFallbackAccommodations(params: {
  displayLocation: string
  checkIn: Date
  checkOut: Date
  adults: number
  children?: number
  rooms?: number
}): Accommodation[] {
  const city = extractBookingCity(params.displayLocation)
  const checkIn = startOfDay(params.checkIn)
  const checkOut = startOfDay(params.checkOut)
  const nights = Math.max(1, differenceInCalendarDays(checkOut, checkIn))

  const basePrices = [42, 58, 72, 89, 95, 110, 125, 148]

  return NAME_TEMPLATES.map((tpl, i) => {
    const pricePerNight = basePrices[i] ?? 80
    const totalPrice = pricePerNight * nights
    const name = tpl.replace('{city}', city)

    const imageUrl = HOTEL_IMAGES[i % HOTEL_IMAGES.length]

    return {
      id: `booking-fallback-${city.toLowerCase().replace(/\s+/g, '-')}-${i}`,
      source: 'booking',
      name,
      location: params.displayLocation,
      neighborhood: i % 2 === 0 ? 'Center' : 'Old Town',
      description: `${name} — priporočena namestitev v mestu ${city}. Rezerviraj preko Booking.com.`,
      gallery: [
        imageUrl,
        HOTEL_IMAGES[(i + 1) % HOTEL_IMAGES.length],
        HOTEL_IMAGES[(i + 2) % HOTEL_IMAGES.length],
      ],
      pricePerNight,
      totalPrice,
      currency: 'EUR',
      rating: 7.8 + (i % 3) * 0.4,
      reviewCount: 320 + i * 87,
      stars: i % 3 === 0 ? 5 : i % 3 === 1 ? 4 : 3,
      imageUrl,
      amenities: ['WiFi', i % 2 === 0 ? 'Zajtrk' : 'Bazen'],
      hasBreakfast: i % 2 === 0,
      isBeachfront: city.toLowerCase().includes('phuket') || city.toLowerCase().includes('krabi'),
      affiliateUrl: buildBookingUrl({
        location: city,
        checkIn,
        checkOut: checkOut > checkIn ? checkOut : addDays(checkIn, 1),
        adults: params.adults,
        children: params.children ?? 0,
        rooms: params.rooms ?? 1,
      }),
      checkIn,
      checkOut: checkOut > checkIn ? checkOut : addDays(checkIn, 1),
    }
  })
}
