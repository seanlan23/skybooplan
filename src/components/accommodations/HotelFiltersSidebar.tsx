'use client'

import { RotateCcw } from 'lucide-react'
import { useAccomStore } from '@/store/useAccomStore'
import { HotelFiltersPanel } from './HotelFiltersPanel'

/**
 * Klasični levi filter stolpec (ohranjen za združljivost).
 * Na strani z namestitvami se filtri odprejo prek HotelFiltersModal + HotelResultsToolbar.
 */
export function HotelFiltersSidebar() {
  const { filters, updateFilter, resetFilters } = useAccomStore()

  return (
    <aside className="w-full lg:w-1/4 shrink-0">
      <div className="sticky top-4 bg-white border border-slate-100 rounded-2xl shadow-card p-5 space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="font-display font-bold text-slate-900 text-lg">Filtri</h3>
          <button
            type="button"
            onClick={() => resetFilters()}
            className="text-xs text-slate-500 hover:text-leaf-600 flex items-center gap-1"
          >
            <RotateCcw className="w-3 h-3" />
            Ponastavi
          </button>
        </div>
        <HotelFiltersPanel filters={filters} onUpdate={updateFilter} accent="leaf" />
      </div>
    </aside>
  )
}
