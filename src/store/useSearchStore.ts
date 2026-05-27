import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import type { BookingDestination } from '@/types/booking.types'
import type { Airport } from '@/types/flight.types'

export type TripType = 'one_way' | 'return'
export type SearchMode = 'flights' | 'hotels_only' | 'ai_planner'

export interface SearchState {
  searchMode: SearchMode
  tripType: TripType
  origins: Airport[]
  destination: Airport | null
  /** Samo namestitve — Booking mesto (ne letališče) */
  hotelDestination: BookingDestination | null
  radiusKm: number
  departureDate: Date | null
  returnDate: Date | null
  flexDays: number
  adults: number
  children: number
  /** Število sob (Booking room_qty / no_rooms) */
  rooms: number
  cabinClass: 'economy' | 'premium_economy' | 'business' | 'first'
  nights: number | null
  totalPassengers: number
  // Actions
  addOrigin: (airport: Airport) => void
  removeOrigin: (iata: string) => void
  setSearchMode: (mode: SearchMode) => void
  setTripType: (type: TripType) => void
  setDestination: (airport: Airport | null) => void
  setHotelDestination: (dest: BookingDestination | null) => void
  setRadius: (km: number) => void
  setDepartureDate: (date: Date | null) => void
  setReturnDate: (date: Date | null) => void
  setFlexDays: (days: number) => void
  setPassengers: (adults: number, children: number) => void
  setRooms: (rooms: number) => void
  setCabinClass: (cls: SearchState['cabinClass']) => void
  setNights: (n: number | null) => void
  reset: () => void
}

const defaultState = {
  searchMode: 'flights' as SearchMode,
  tripType: 'return' as TripType,
  origins: [] as Airport[],
  destination: null as Airport | null,
  hotelDestination: null as BookingDestination | null,
  radiusKm: 0,
  departureDate: null as Date | null,
  returnDate: null as Date | null,
  flexDays: 0,
  adults: 1,
  children: 0,
  rooms: 1,
  cabinClass: 'economy' as const,
  nights: null as number | null,
  totalPassengers: 1,
}

export const useSearchStore = create<SearchState>()(
  devtools(
    (set) => ({
      ...defaultState,
      setSearchMode: (mode) =>
        set((s) => ({
          searchMode: mode,
          tripType: mode === 'hotels_only' ? 'return' : s.tripType,
          destination: mode === 'hotels_only' ? null : s.destination,
          hotelDestination: mode === 'flights' ? null : s.hotelDestination,
        })),
      setTripType: (type) =>
        set((s) => ({
          tripType: type,
          returnDate: type === 'one_way' ? null : s.returnDate,
        })),
      addOrigin: (airport) =>
        set((s) => ({
          origins: s.origins.find((a) => a.iata === airport.iata)
            ? s.origins
            : [...s.origins.slice(0, 4), airport],
        })),
      removeOrigin: (iata) =>
        set((s) => ({ origins: s.origins.filter((a) => a.iata !== iata) })),
      setDestination: (airport) => set({ destination: airport }),
      setHotelDestination: (dest) => set({ hotelDestination: dest }),
      setRadius: (km) => set({ radiusKm: km }),
      setDepartureDate: (date) => set({ departureDate: date }),
      setReturnDate: (date) => set({ returnDate: date }),
      setFlexDays: (days) => set({ flexDays: days }),
      setPassengers: (adults, children) =>
        set({ adults, children, totalPassengers: adults + children }),
      setRooms: (rooms) => set({ rooms: Math.min(8, Math.max(1, rooms)) }),
      setCabinClass: (cls) => set({ cabinClass: cls }),
      setNights: (n) => set({ nights: n }),
      reset: () => set(defaultState),
    }),
    { name: 'search-store' }
  )
)
