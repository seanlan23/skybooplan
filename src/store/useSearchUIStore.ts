import { create } from 'zustand'

interface SearchUIState {
  /** Darkens / blurs content below search when inputs are active */
  overlayActive: boolean
  setOverlayActive: (active: boolean) => void
  openSearch: () => void
  closeSearch: () => void
}

export const useSearchUIStore = create<SearchUIState>((set) => ({
  overlayActive: false,
  setOverlayActive: (overlayActive) => set({ overlayActive }),
  openSearch: () => set({ overlayActive: true }),
  closeSearch: () => set({ overlayActive: false }),
}))
