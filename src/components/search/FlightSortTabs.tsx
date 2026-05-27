'use client'

import type { FlightSortMode } from '@/lib/sortFlights'
import { cn } from '@/lib/utils'

const TABS: { id: FlightSortMode; label: string }[] = [
  { id: 'best', label: 'Best' },
  { id: 'cheapest', label: 'Cheapest' },
  { id: 'fastest', label: 'Fastest' },
]

interface FlightSortTabsProps {
  active: FlightSortMode
  onChange: (mode: FlightSortMode) => void
  disabled?: boolean
  /** Show lowest price per tab when available */
  priceHints?: Partial<Record<FlightSortMode, string>>
}

export function FlightSortTabs({
  active,
  onChange,
  disabled,
  priceHints,
}: FlightSortTabsProps) {
  return (
    <div className="flex gap-2 mb-3" role="tablist" aria-label="Razvrsti lete">
      {TABS.map((tab) => {
        const isActive = active === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 min-w-0 rounded-lg border px-3 py-2.5 text-left transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              isActive
                ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
            )}
          >
            <span className={cn('block text-sm font-bold', isActive ? 'text-white' : 'text-slate-900')}>
              {tab.label}
            </span>
            {priceHints?.[tab.id] && (
              <span
                className={cn(
                  'block text-xs mt-0.5 tabular-nums',
                  isActive ? 'text-sky-100' : 'text-slate-500'
                )}
              >
                from {priceHints[tab.id]}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
