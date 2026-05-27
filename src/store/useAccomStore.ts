import { create } from 'zustand'
import type { Accommodation, AccomFilters, AccomSource } from '@/types/accommodation.types'

interface AccomSearchMeta {
  fallback?: boolean
  error?: string
  searchCity?: string
}

interface AccomState {
  results: Accommodation[]
  searchMeta: AccomSearchMeta
  isLoading: boolean
  /** Povečuje se ob eksplicitnem iskanju hotelov — sproži fetch */
  searchTrigger: number
  filters: AccomFilters
  activeLocation: string | null
  activeDates: { checkIn: Date | null; checkOut: Date | null }
  userPickedHotel: boolean
  selectedHotel: Accommodation | null
  // Actions
  setResults: (r: Accommodation[], meta?: AccomSearchMeta) => void
  setIsLoading: (v: boolean) => void
  triggerHotelSearch: () => void
  updateFilter: <K extends keyof AccomFilters>(key: K, val: AccomFilters[K]) => void
  applyFilters: (filters: AccomFilters) => void
  resetFilters: () => void
  setActiveLocation: (
    loc: string | null,
    dates?: { checkIn: Date; checkOut: Date },
    options?: { userPicked?: boolean; clearResults?: boolean }
  ) => void
  setUserPickedHotel: (v: boolean) => void
  clearUserPickedHotel: () => void
  setSelectedHotel: (h: Accommodation | null) => void
}

const defaultFilters: AccomFilters = {
  priceMin: 0,
  priceMax: 500,
  stars: [],
  sources: ['booking', 'airbnb', 'hotels'] as AccomSource[],
  propertyTypes: [],
  minGuestRating: null,
  hasBreakfast: null,
  isBeachfront: null,
  freeCancellation: null,
  hasPool: null,
  hasWifi: null,
  neighborhood: null,
  sortBy: 'recommended',
}

export const useAccomStore = create<AccomState>((set) => ({
  results: [],
  searchMeta: {},
  isLoading: false,
  searchTrigger: 0,
  filters: defaultFilters,
  activeLocation: null,
  activeDates: { checkIn: null, checkOut: null },
  userPickedHotel: false,
  selectedHotel: null,

  setResults: (r, meta) =>
    set({
      results: r,
      searchMeta: meta ?? {},
      isLoading: false,
    }),
  setIsLoading: (v) => set({ isLoading: v }),
  triggerHotelSearch: () =>
    set((s) => ({
      searchTrigger: s.searchTrigger + 1,
      isLoading: true,
    })),
  updateFilter: (key, val) =>
    set((s) => ({ filters: { ...s.filters, [key]: val } })),
  applyFilters: (filters) =>
    set({
      filters: {
        ...filters,
        stars: [...filters.stars],
        sources: [...filters.sources],
        propertyTypes: [...filters.propertyTypes],
      },
    }),
  resetFilters: () =>
    set({
      filters: {
        ...defaultFilters,
        stars: [],
        propertyTypes: [],
        sources: [...defaultFilters.sources],
      },
    }),
  setActiveLocation: (loc, dates, options) =>
    set((state) => {
      const nextCheckIn = dates?.checkIn ?? null
      const nextCheckOut = dates?.checkOut ?? null
      const locChanged = state.activeLocation !== loc
      const datesChanged =
        nextCheckIn?.toDateString() !== state.activeDates.checkIn?.toDateString() ||
        nextCheckOut?.toDateString() !== state.activeDates.checkOut?.toDateString()
      const shouldClear = options?.clearResults !== false && (locChanged || datesChanged)

      return {
        activeLocation: loc,
        activeDates: dates
          ? { checkIn: dates.checkIn, checkOut: dates.checkOut }
          : { checkIn: null, checkOut: null },
        userPickedHotel: options?.userPicked ?? state.userPickedHotel,
        results: shouldClear ? [] : state.results,
      }
    }),
  setUserPickedHotel: (v) => set({ userPickedHotel: v }),
  clearUserPickedHotel: () => set({ userPickedHotel: false }),
  setSelectedHotel: (h) => set({ selectedHotel: h }),
}))
