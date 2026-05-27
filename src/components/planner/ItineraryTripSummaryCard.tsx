'use client'
import { CloudRain, Lightbulb, Wallet } from 'lucide-react'
import type { ItineraryTripSummary } from '@/types/itinerary.types'

export function ItineraryTripSummaryCard({ summary }: { summary: ItineraryTripSummary }) {
  if (
    !summary.totalCostEstimate &&
    !summary.rainyDayPlan &&
    !summary.generalTips?.length
  ) {
    return null
  }

  return (
    <div className="rounded-2xl border border-amber-200 bg-amber-50/80 p-4 space-y-3 text-sm text-amber-950">
      <p className="font-display font-bold text-amber-900">Povzetek potovanja</p>

      {summary.totalCostEstimate ? (
        <div className="flex gap-2">
          <Wallet className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <p>{summary.totalCostEstimate}</p>
        </div>
      ) : null}

      {summary.generalTips && summary.generalTips.length > 0 ? (
        <div>
          <div className="flex items-center gap-1.5 font-semibold text-amber-900 mb-1">
            <Lightbulb className="w-4 h-4" />
            Splošni nasveti
          </div>
          <ul className="list-disc pl-5 space-y-1 text-amber-900/90">
            {summary.generalTips.map((tip) => (
              <li key={tip}>{tip}</li>
            ))}
          </ul>
        </div>
      ) : null}

      {summary.rainyDayPlan ? (
        <div className="flex gap-2 pt-1 border-t border-amber-200/80">
          <CloudRain className="w-4 h-4 shrink-0 text-amber-700 mt-0.5" />
          <div>
            <p className="font-semibold text-amber-900">Rezervni / deževni dan</p>
            <p className="mt-0.5 text-amber-900/90">{summary.rainyDayPlan}</p>
          </div>
        </div>
      ) : null}
    </div>
  )
}
