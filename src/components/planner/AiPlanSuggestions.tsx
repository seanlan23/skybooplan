'use client'

import type { ActivitySuggestion } from '@/types/itinerary.types'
import { useTranslations } from '@/i18n/LocaleProvider'

export function AiPlanSuggestions({ suggestions }: { suggestions: ActivitySuggestion[] }) {
  const { t } = useTranslations()
  if (suggestions.length === 0) return null

  return (
    <div className="pt-2 border-t border-slate-100">
      <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-3 mt-3">
        {t('dayCard.suggestionsForDay')}
      </div>
      <ul className="space-y-2">
        {suggestions.map((s, i) => (
          <li
            key={`${s.name}-${i}`}
            className="rounded-xl bg-slate-50 px-4 py-3 transition-all hover:-translate-y-0.5 hover:shadow-sm"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="font-bold text-slate-900">{s.name}</div>
                {s.description ? (
                  <div className="mt-1 text-xs text-slate-500">{s.description}</div>
                ) : null}
              </div>
              {s.priceLabel ? (
                <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                  € {s.priceLabel}
                </span>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
