'use client'

import { Sparkles } from 'lucide-react'
import { useTranslations } from '@/i18n/LocaleProvider'
import type { ItineraryTripSummary } from '@/types/itinerary.types'

export function AiPlanSummary({
  destination,
  summary,
  dayCount,
  tripSummary,
}: {
  destination: string
  summary?: string
  dayCount: number
  tripSummary?: ItineraryTripSummary | null
}) {
  const { t } = useTranslations()

  const budgetMatch = tripSummary?.totalCostEstimate?.match(/[\d.,]+/)
  const budgetLabel = budgetMatch?.[0] ?? null

  return (
    <div className="rounded-2xl border border-sky-200 bg-white p-5 sm:p-6 shadow-sm">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-600 uppercase tracking-wider">
            <Sparkles className="h-4 w-4" />
            {t('planner.planTitle')}
          </div>
          <h2 className="mt-1 text-2xl sm:text-3xl font-bold text-slate-900">{destination}</h2>
          {summary ? (
            <p className="mt-2 text-slate-600 max-w-2xl text-sm leading-relaxed">{summary}</p>
          ) : null}
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
            {dayCount} {dayCount === 1 ? 'dan' : 'dni'}
          </div>
          {budgetLabel ? (
            <>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold mt-2">
                Skupaj
              </div>
              <div className="text-3xl font-bold text-slate-900">€{budgetLabel}</div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
