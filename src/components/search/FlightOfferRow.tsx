'use client'

import type { MouseEvent } from 'react'
import { Sparkles } from 'lucide-react'
import { FlightCard } from './FlightCard'
import { useSearchStore } from '@/store/useSearchStore'
import type { FlightOffer } from '@/types/flight.types'
import { cn } from '@/lib/utils'

interface FlightOfferRowProps {
  offer: FlightOffer
  selectedForAI: boolean
  onSelectOffer?: () => void
  onSelectForAI: (e: MouseEvent) => void
}

function formatTravelerLabel(total: number): string {
  if (total === 1) return '1 traveler'
  return `${total} travelers`
}

export function FlightOfferRow({
  offer,
  selectedForAI,
  onSelectOffer,
  onSelectForAI,
}: FlightOfferRowProps) {
  const totalPassengers = useSearchStore((s) => s.totalPassengers)

  return (
    <div className="shrink-0 space-y-0">
      <FlightCard
        offer={offer}
        travelerLabel={formatTravelerLabel(totalPassengers)}
        selected={selectedForAI}
        onSelect={onSelectOffer}
        className={cn(selectedForAI && 'rounded-b-none border-b-0 shadow-md')}
      />

      <div
        className={cn(
          'flex items-center px-3 py-2 border border-t-0 rounded-b-lg bg-slate-50/80',
          selectedForAI ? 'border-sky-500' : 'border-slate-200'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onSelectForAI}
          className={cn(
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors',
            selectedForAI
              ? 'bg-sky-600 text-white hover:bg-sky-700'
              : 'bg-white text-sky-700 border border-sky-200 hover:bg-sky-50'
          )}
        >
          <Sparkles className="w-3.5 h-3.5" />
          {selectedForAI ? 'Izbrano za AI' : 'Izberi za AI načrt'}
        </button>
      </div>
    </div>
  )
}
