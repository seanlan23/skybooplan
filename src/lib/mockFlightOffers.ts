import type { FlightOffer } from '@/types/flight.types'

/** Structural round-trip samples for layout preview when no live results yet. */
export const MOCK_ROUND_TRIP_OFFERS: FlightOffer[] = [
  {
    id: 'mock-rt-1',
    origin: 'LJU',
    destination: 'BKK',
    departureDate: '2026-06-10',
    returnDate: '2026-06-20',
    price: 489,
    currency: 'EUR',
    airline: 'Turkish Airlines',
    duration: '12h 45m',
    returnDuration: '13h 10m',
    stops: 1,
    returnStops: 1,
    cabinClass: 'economy',
    segments: [
      {
        departure: { iataCode: 'LJU', at: '2026-06-10T06:30:00' },
        arrival: { iataCode: 'BKK', at: '2026-06-10T22:15:00' },
        carrierCode: 'TK',
        flightNumber: '1062',
        duration: '12h 45m',
      },
    ],
    returnSegments: [
      {
        departure: { iataCode: 'BKK', at: '2026-06-20T08:00:00' },
        arrival: { iataCode: 'LJU', at: '2026-06-20T18:10:00' },
        carrierCode: 'TK',
        flightNumber: '1063',
        duration: '13h 10m',
      },
    ],
  },
  {
    id: 'mock-rt-2',
    origin: 'LJU',
    destination: 'BKK',
    departureDate: '2026-06-10',
    returnDate: '2026-06-20',
    price: 612,
    currency: 'EUR',
    airline: 'Lufthansa',
    duration: '14h 20m',
    returnDuration: '15h 05m',
    stops: 0,
    returnStops: 0,
    cabinClass: 'economy',
    segments: [
      {
        departure: { iataCode: 'LJU', at: '2026-06-10T09:15:00' },
        arrival: { iataCode: 'BKK', at: '2026-06-11T02:35:00' },
        carrierCode: 'LH',
        flightNumber: '1488',
        duration: '14h 20m',
      },
    ],
    returnSegments: [
      {
        departure: { iataCode: 'BKK', at: '2026-06-20T11:40:00' },
        arrival: { iataCode: 'LJU', at: '2026-06-21T01:45:00' },
        carrierCode: 'LH',
        flightNumber: '1489',
        duration: '15h 05m',
      },
    ],
  },
]
