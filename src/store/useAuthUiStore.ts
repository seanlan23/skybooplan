import { create } from 'zustand'
import type { PendingExportAction } from '@/lib/authPendingExport'

interface AuthUiState {
  loginModalOpen: boolean
  pendingAction: PendingExportAction | null
  openLoginModal: (action?: PendingExportAction) => void
  closeLoginModal: () => void
  setPendingAction: (action: PendingExportAction | null) => void
  clearPendingAction: () => void
}

export const useAuthUiStore = create<AuthUiState>((set) => ({
  loginModalOpen: false,
  pendingAction: null,
  openLoginModal: (action) =>
    set({
      loginModalOpen: true,
      pendingAction: action ?? null,
    }),
  closeLoginModal: () => set({ loginModalOpen: false }),
  setPendingAction: (action) => set({ pendingAction: action }),
  clearPendingAction: () => set({ pendingAction: null }),
}))
