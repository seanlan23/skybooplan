import { create } from 'zustand'
import type { Accommodation } from '@/types/accommodation.types'

export interface SegmentHotelState {
  hotels: Accommodation[]
  isLoading: boolean
  error?: string
}

interface ItineraryHotelsState {
  bySegment: Record<string, SegmentHotelState>
  setSegmentsLoading: (segmentKeys: string[]) => void
  setSegmentLoading: (segmentKey: string) => void
  setSegmentHotels: (
    segmentKey: string,
    hotels: Accommodation[],
    error?: string
  ) => void
  clearAll: () => void
}

const emptySegment = (): SegmentHotelState => ({
  hotels: [],
  isLoading: false,
})

export const useItineraryHotelsStore = create<ItineraryHotelsState>((set) => ({
  bySegment: {},

  setSegmentsLoading: (segmentKeys) =>
    set((s) => {
      const next = { ...s.bySegment }
      for (const segmentKey of segmentKeys) {
        next[segmentKey] = {
          ...(next[segmentKey] ?? emptySegment()),
          isLoading: true,
          error: undefined,
        }
      }
      return { bySegment: next }
    }),

  setSegmentLoading: (segmentKey) =>
    set((s) => ({
      bySegment: {
        ...s.bySegment,
        [segmentKey]: {
          ...(s.bySegment[segmentKey] ?? emptySegment()),
          isLoading: true,
          error: undefined,
        },
      },
    })),

  setSegmentHotels: (segmentKey, hotels, error) =>
    set((s) => ({
      bySegment: {
        ...s.bySegment,
        [segmentKey]: {
          hotels,
          isLoading: false,
          error,
        },
      },
    })),

  clearAll: () => set({ bySegment: {} }),
}))
