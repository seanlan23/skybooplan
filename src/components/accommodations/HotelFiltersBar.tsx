'use client'

import { Coffee, Waves, Star } from 'lucide-react'
import { useAccomStore } from '@/store/useAccomStore'
import { cn } from '@/lib/utils'

const SORT_OPTIONS = [
  { value: 'recommended', label: 'Priporočeno' },
  { value: 'price_asc', label: 'Cena ↑' },
  { value: 'price_desc', label: 'Cena ↓' },
  { value: 'rating', label: 'Ocena' },
] as const

/** Kompaktni filtri v vrstici (način z leti) */
export function HotelFiltersBar() {
  const { filters, updateFilter } = useAccomStore()

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs">
        <span className="text-slate-500">€{filters.priceMin}</span>
        <input
          type="range"
          min={0}
          max={500}
          step={10}
          value={filters.priceMax}
          onChange={(e) => updateFilter('priceMax', parseInt(e.target.value, 10))}
          className="w-20 accent-sky-500"
        />
        <span className="text-slate-700 font-medium">€{filters.priceMax}</span>
      </div>

      {[3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => {
            const current = filters.stars
            updateFilter(
              'stars',
              current.includes(s) ? current.filter((x) => x !== s) : [...current, s]
            )
          }}
          className={cn(
            'px-2.5 py-1.5 text-xs rounded-xl border transition-all flex items-center gap-1',
            filters.stars.includes(s)
              ? /* BACKUP: 'bg-sky-500 border-sky-500 text-white' */ 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
              : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
          )}
        >
          {s}
          <Star className="w-2.5 h-2.5" />
        </button>
      ))}

      <button
        type="button"
        onClick={() => updateFilter('hasBreakfast', filters.hasBreakfast === true ? null : true)}
        className={cn(
          'px-2.5 py-1.5 text-xs rounded-xl border transition-all flex items-center gap-1',
          filters.hasBreakfast
            ? /* BACKUP: 'bg-sky-500 border-sky-500 text-white' */ 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <Coffee className="w-3 h-3" /> Zajtrk
      </button>

      <button
        type="button"
        onClick={() => updateFilter('isBeachfront', filters.isBeachfront === true ? null : true)}
        className={cn(
          'px-2.5 py-1.5 text-xs rounded-xl border transition-all flex items-center gap-1',
          filters.isBeachfront
            ? /* BACKUP: 'bg-sky-500 border-sky-500 text-white' */ 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
            : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
        )}
      >
        <Waves className="w-3 h-3" /> Ob morju
      </button>

      <select
        value={filters.sortBy}
        onChange={(e) => updateFilter('sortBy', e.target.value as typeof filters.sortBy)}
        className="ml-auto px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl text-slate-600 outline-none cursor-pointer"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  )
}
