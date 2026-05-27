'use client'

import { useSearchStore } from '@/store/useSearchStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { PLANNER_TRAVEL_STYLE_OPTIONS } from '@/lib/plannerPreferences'
import type { PlannerTravelStyle } from '@/lib/plannerPreferences'
import { cn } from '@/lib/utils'

/**
 * Prilagoditve AI itinerarija — enak vizualni jezik kot iskalnik mest
 * (rounded-2xl, border-slate-200, focus ring sky/leaf).
 */
export function AIPlannerPreferencesForm({ compact = false }: { compact?: boolean }) {
  const isHotelsOnly = useSearchStore((s) => s.searchMode === 'hotels_only')
  const {
    dailyBudgetPerPerson,
    travelStyle,
    setDailyBudgetPerPerson,
    setTravelStyle,
  } = usePlannerStore()

  const focusRing = isHotelsOnly
    ? 'focus:border-leaf-400 focus:ring-leaf-100'
    : 'focus:border-sky-400 focus:ring-sky-100'

  const fieldClass = cn(
    'w-full bg-white border border-slate-200 text-slate-800',
    compact ? 'px-2 py-2 rounded-lg text-xs' : 'px-3 py-2.5 rounded-2xl text-sm',
    'outline-none transition-all duration-200 hover:border-slate-300 focus:ring-2',
    focusRing
  )

  const labelClass = 'block text-xs font-semibold text-slate-500 mb-1 px-1'

  return (
    <div
      className={cn(
        'bg-white border border-slate-100 space-y-3',
        compact ? 'rounded-xl p-2.5 shadow-sm' : 'rounded-3xl shadow-search p-4 md:p-5 space-y-4'
      )}
    >
      <p
        className={cn(
          'font-semibold text-slate-500 uppercase tracking-wide px-1',
          compact ? 'text-[10px]' : 'text-xs'
        )}
      >
        Prilagodi AI načrt
      </p>

      <div>
        <label htmlFor="planner-daily-budget" className={labelClass}>
          Proračun na osebo (€)
        </label>
        <input
          id="planner-daily-budget"
          type="number"
          min={0}
          step={1}
          inputMode="numeric"
          value={dailyBudgetPerPerson}
          onChange={(e) => setDailyBudgetPerPerson(e.target.value)}
          placeholder="npr. 500"
          className={fieldClass}
        />
        <p className="text-[10px] text-slate-400 mt-1 px-1">
          Brez letov in nastanitve; prazno = optimizirano
        </p>
      </div>

      <div>
        <label htmlFor="planner-travel-style" className={labelClass}>
          Prednost / Stil potovanja
        </label>
        <select
          id="planner-travel-style"
          value={travelStyle}
          onChange={(e) => setTravelStyle(e.target.value as PlannerTravelStyle)}
          className={cn(fieldClass, 'cursor-pointer')}
        >
          {PLANNER_TRAVEL_STYLE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

    </div>
  )
}
