'use client'

import { useSearchUIStore } from '@/store/useSearchUIStore'
import { cn } from '@/lib/utils'

export function SearchContentOverlay({ children }: { children: React.ReactNode }) {
  const overlayActive = useSearchUIStore((s) => s.overlayActive)

  return (
    <div className="relative">
      {overlayActive && (
        <div
          className="absolute inset-0 z-40 bg-slate-900/50 backdrop-blur-[3px] pointer-events-auto"
          aria-hidden
          onClick={() => useSearchUIStore.getState().closeSearch()}
        />
      )}
      <div
        className={cn(
          'relative',
          overlayActive && 'pointer-events-none select-none opacity-60'
        )}
      >
        {children}
      </div>
    </div>
  )
}
