'use client'

import { useState } from 'react'
import { SlidersHorizontal } from 'lucide-react'
import { HotelFiltersModal } from './HotelFiltersModal'
import { HotelSortPopover } from './HotelSortPopover'
import { cn } from '@/lib/utils'

interface HotelResultsToolbarProps {
  accent?: 'leaf' | 'sky'
  resultCount?: number
}

export function HotelResultsToolbar({ accent = 'leaf', resultCount }: HotelResultsToolbarProps) {
  const [filtersOpen, setFiltersOpen] = useState(false)

  /* BACKUP filterBtnClass: accent leaf/sky border in sky-200 / leaf-200 */
  const filterBtnClass =
    'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300'

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 w-full">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setFiltersOpen(true)}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 bg-white font-semibold text-sm transition-all shadow-sm hover:shadow-md',
              filterBtnClass
            )}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filtri
          </button>
          <HotelSortPopover accent={accent} />
        </div>
        {typeof resultCount === 'number' && (
          <p className="text-xs text-slate-400 tabular-nums">
            {resultCount} namestitev
          </p>
        )}
      </div>

      <HotelFiltersModal open={filtersOpen} onOpenChange={setFiltersOpen} accent={accent} />
    </>
  )
}
