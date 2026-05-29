export type PendingExportAction = 'pdf' | 'docs'

const STORAGE_KEY = 'skybooplan-pending-export'

export function savePendingExportAction(action: PendingExportAction): void {
  if (typeof window === 'undefined') return
  sessionStorage.setItem(STORAGE_KEY, action)
}

export function consumePendingExportAction(): PendingExportAction | null {
  if (typeof window === 'undefined') return null
  const value = sessionStorage.getItem(STORAGE_KEY)
  if (value !== 'pdf' && value !== 'docs') return null
  sessionStorage.removeItem(STORAGE_KEY)
  return value
}
