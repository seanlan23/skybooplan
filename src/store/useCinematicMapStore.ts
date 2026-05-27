import { create } from 'zustand'
import type { ItineraryDay } from '@/types/itinerary.types'

export type CinematicMapPhase =
  | 'idle'
  | 'flight'
  | 'country'
  | 'itinerary'
  | 'complete'

export interface CinematicMapMarker {
  day: number
  location: string
  title: string
  description: string
  coordinates: [number, number]
}

interface CinematicMapState {
  sessionId: number
  phase: CinematicMapPhase
  streamingDays: ItineraryDay[]
  markers: CinematicMapMarker[]
  /** Sproži Phase 1 ob kliku Generiraj načrt */
  startCinematic: () => void
  setPhase: (phase: CinematicMapPhase) => void
  setStreamingDays: (days: ItineraryDay[]) => void
  setMarkers: (markers: CinematicMapMarker[]) => void
  addMarker: (marker: CinematicMapMarker) => void
  reset: () => void
}

export const useCinematicMapStore = create<CinematicMapState>((set, get) => ({
  sessionId: 0,
  phase: 'idle',
  streamingDays: [],
  markers: [],

  startCinematic: () => {
    set({
      sessionId: get().sessionId + 1,
      phase: 'flight',
      streamingDays: [],
      markers: [],
    })
  },

  setPhase: (phase) => set({ phase }),

  setStreamingDays: (days) => set({ streamingDays: days }),

  setMarkers: (markers) => set({ markers }),

  addMarker: (marker) =>
    set((s) => {
      if (s.markers.some((m) => m.day === marker.day)) return s
      return { markers: [...s.markers, marker].sort((a, b) => a.day - b.day) }
    }),

  reset: () =>
    set({
      sessionId: 0,
      phase: 'idle',
      streamingDays: [],
      markers: [],
    }),
}))
