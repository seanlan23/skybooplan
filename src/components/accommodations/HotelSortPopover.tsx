'use client'

import * as Popover from '@radix-ui/react-popover'
import { ArrowDownUp, Check } from 'lucide-react'
import { useAccomStore } from '@/store/useAccomStore'
import { cn } from '@/lib/utils'
import type { AccomFilters } from '@/types/accommodation.types'

const SORT_OPTIONS: {
  value: AccomFilters['sortBy']
  label: string
}[] = [
  { value: 'recommended', label: 'Priporočeno' },
  { value: 'price_asc', label: 'Cena: od najnižje' },
  { value: 'price_desc', label: 'Cena: od najvišje' },
  { value: 'rating', label: 'Ocena: od najvišje' },
]

interface HotelSortPopoverProps {
  accent?: 'leaf' | 'sky'
}

export function HotelSortPopover({ accent = 'leaf' }: HotelSortPopoverProps) {
  const sortBy = useAccomStore((s) => s.filters.sortBy)
  const updateFilter = useAccomStore((s) => s.updateFilter)

  const activeLabel = SORT_OPTIONS.find((o) => o.value === sortBy)?.label ?? 'Razvrsti'
  /* BACKUP accentRing/accentActive: leaf/sky border in sky-200, bg-sky-50 */
  const accentRing = 'border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-300'
  const accentActive = 'bg-orange-500 text-white hover:bg-orange-600'

  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border-2 bg-white font-semibold text-sm transition-all shadow-sm hover:shadow-md',
            accentRing
          )}
        >
          <ArrowDownUp className="w-4 h-4" />
          Sortiraj
          <span className="hidden sm:inline text-slate-400 font-normal">· {activeLabel}</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          className="z-[250] w-64 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 animate-in fade-in-0 zoom-in-95"
        >
          <p className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
            Razvrsti rezultate
          </p>
          {SORT_OPTIONS.map((option) => {
            const selected = sortBy === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => updateFilter('sortBy', option.value)}
                className={cn(
                  'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors',
                  selected ? accentActive : 'text-slate-700 hover:bg-slate-50'
                )}
              >
                {option.label}
                {selected && <Check className="w-4 h-4 shrink-0" />}
              </button>
            )
          })}
          <Popover.Arrow className="fill-white" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  )
}
