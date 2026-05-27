import { create } from 'zustand'
import type { FlightOffer } from '@/types/flight.types'

interface FlightResultsState {
  offers: FlightOffer[]
  isSearching: boolean
  error: string | null
  skyscannerUrl: string | null
  hasSearched: boolean
  duffelTestMode: boolean
  setOffers: (offers: FlightOffer[]) => void
  setIsSearching: (v: boolean) => void
  setError: (error: string | null) => void
  setSkyscannerUrl: (url: string | null) => void
  setHasSearched: (v: boolean) => void
  setDuffelTestMode: (v: boolean) => void
  resetResults: () => void
}

export const useFlightResultsStore = create<FlightResultsState>((set) => ({
  offers: [],
  isSearching: false,
  error: null,
  skyscannerUrl: null,
  hasSearched: false,
  duffelTestMode: false,
  setOffers: (offers) => set({ offers }),
  setIsSearching: (isSearching) => set({ isSearching }),
  setError: (error) => set({ error }),
  setSkyscannerUrl: (skyscannerUrl) => set({ skyscannerUrl }),
  setHasSearched: (hasSearched) => set({ hasSearched }),
  setDuffelTestMode: (duffelTestMode) => set({ duffelTestMode }),
  resetResults: () =>
    set({
      offers: [],
      isSearching: false,
      error: null,
      skyscannerUrl: null,
      hasSearched: false,
      duffelTestMode: false,
    }),
}))
