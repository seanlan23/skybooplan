'use client'

import { Plane, Building2, Sparkles } from 'lucide-react'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore, type SearchMode } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

const MODES: { value: SearchMode; labelKey: string; icon: typeof Plane }[] = [
  { value: 'flights', labelKey: 'search.modeFlights', icon: Plane },
  { value: 'hotels_only', labelKey: 'search.modeHotelsOnly', icon: Building2 },
  { value: 'ai_planner', labelKey: 'search.modeAiPlanner', icon: Sparkles },
]

interface SearchModeTabsProps {
  onDark?: boolean
}

export function SearchModeTabs({ onDark = false }: SearchModeTabsProps) {
  const { t } = useTranslations()
  const { searchMode, setSearchMode } = useSearchStore()

  return (
    <div
      className={cn(
        'flex items-center gap-1 p-1 rounded-lg flex-wrap',
        onDark ? 'bg-white/10' : 'bg-slate-100 rounded-xl'
      )}
    >
      {MODES.map(({ value, labelKey, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => {
            setSearchMode(value)
            if (value === 'flights') {
              usePlannerStore.getState().setHotelsOnlyContext(null)
              useSearchStore.getState().setHotelDestination(null)
            } else if (value === 'hotels_only') {
              useSelectedFlightStore.getState().clearSelectedFlight()
              useSearchStore.getState().setDestination(null)
            }
          }}
          className={cn(
            'flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md transition-all',
            searchMode === value
              ? onDark
                ? 'bg-[#0770e3] text-white shadow-sm'
                : 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
              : onDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-500 hover:text-slate-700'
          )}
        >
          <Icon className="w-4 h-4 shrink-0" />
          <span className="whitespace-nowrap">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  )
}
