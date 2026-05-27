import { create } from 'zustand'
import { devtools } from 'zustand/middleware'
import { applyHotelsFromFlight, clearHotelsFromFlight } from '@/lib/applyHotelsFromFlight'
import { usePlannerStore } from '@/store/usePlannerStore'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

interface SelectedFlightState {
  selectedFlight: SelectedFlightForAI | null
  selectFlightForAI: (flight: SelectedFlightForAI) => void
  clearSelectedFlight: () => void
  isSelected: (offerId: string) => boolean
}

export const useSelectedFlightStore = create<SelectedFlightState>()(
  devtools(
    (set, get) => ({
      selectedFlight: null,
      selectFlightForAI: (flight) => {
        usePlannerStore.getState().setItinerary([])
        usePlannerStore.getState().setActiveLocation(null)
        applyHotelsFromFlight(flight)
        set({ selectedFlight: flight })
      },
      clearSelectedFlight: () => {
        clearHotelsFromFlight()
        set({ selectedFlight: null })
      },
      isSelected: (offerId) => get().selectedFlight?.offerId === offerId,
    }),
    { name: 'selected-flight-store' }
  )
)
