'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { SlidersHorizontal, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAccomStore } from '@/store/useAccomStore'
import { cloneAccomFilters, HotelFiltersPanel } from './HotelFiltersPanel'
import type { AccomFilters } from '@/types/accommodation.types'
import { cn } from '@/lib/utils'

interface HotelFiltersModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  accent?: 'leaf' | 'sky'
}

export function HotelFiltersModal({ open, onOpenChange, accent = 'leaf' }: HotelFiltersModalProps) {
  const storeFilters = useAccomStore((s) => s.filters)
  const applyFilters = useAccomStore((s) => s.applyFilters)
  const resetFilters = useAccomStore((s) => s.resetFilters)
  const [draft, setDraft] = useState<AccomFilters>(() => cloneAccomFilters(storeFilters))

  useEffect(() => {
    if (open) setDraft(cloneAccomFilters(useAccomStore.getState().filters))
  }, [open])

  function updateDraft<K extends keyof AccomFilters>(key: K, val: AccomFilters[K]) {
    setDraft((prev) => ({ ...prev, [key]: val }))
  }

  function handleApply() {
    applyFilters(draft)
    onOpenChange(false)
  }

  function handleClearAll() {
    resetFilters()
    setDraft(cloneAccomFilters(useAccomStore.getState().filters))
  }

  /* BACKUP primaryBtn: accent === 'leaf' ? 'bg-leaf-500 hover:bg-leaf-600' : 'bg-sky-500 hover:bg-sky-600' */
  const primaryBtn = 'bg-orange-500 hover:bg-orange-600'

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[300] bg-slate-900/50 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-[301] w-[min(100vw-2rem,32rem)] max-h-[min(90vh,720px)]',
            '-translate-x-1/2 -translate-y-1/2 flex flex-col',
            'bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden',
            'data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95'
          )}
        >
          <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 shrink-0">
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  'w-10 h-10 rounded-2xl flex items-center justify-center',
                  accent === 'leaf' ? 'bg-leaf-50' : 'bg-sky-50'
                )}
              >
                <SlidersHorizontal
                  className={cn('w-5 h-5', accent === 'leaf' ? 'text-leaf-600' : 'text-sky-600')}
                />
              </div>
              <div>
                <Dialog.Title className="font-display font-bold text-lg text-slate-900">
                  Filtri namestitev
                </Dialog.Title>
                <Dialog.Description className="text-sm text-slate-500">
                  Prilagodi tip, ceno, ocene in ugodnosti
                </Dialog.Description>
              </div>
            </div>
            <Dialog.Close
              type="button"
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Zapri"
            >
              <X className="w-5 h-5" />
            </Dialog.Close>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            <HotelFiltersPanel filters={draft} onUpdate={updateDraft} accent={accent} />
          </div>

          <div className="shrink-0 flex flex-col sm:flex-row gap-2 px-6 py-5 border-t border-slate-100 bg-slate-50/80">
            <button
              type="button"
              onClick={handleClearAll}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 bg-white text-slate-700 font-semibold text-sm hover:bg-slate-50 transition-colors"
            >
              Počisti
            </button>
            <button
              type="button"
              onClick={handleApply}
              className={cn(
                'flex-1 px-4 py-3 rounded-2xl text-white font-semibold text-sm shadow-md transition-colors',
                primaryBtn
              )}
            >
              Uporabi filtre
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
