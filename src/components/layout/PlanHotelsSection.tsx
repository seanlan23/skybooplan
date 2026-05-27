'use client'

import AIPlanner from '@/components/planner/AIPlanner'
import HotelAggregator from '@/components/accommodations/HotelAggregator'
import { useSearchStore } from '@/store/useSearchStore'

export function PlanHotelsSection() {
  const isHotelsOnly = useSearchStore((s) => s.searchMode === 'hotels_only')

  if (isHotelsOnly) {
    return (
      <section id="plan-section" className="w-full max-w-7xl mx-auto px-4 py-6">
        <div className="flex flex-col lg:flex-row gap-6 lg:items-start">
          <div className="w-full lg:w-1/4 shrink-0 lg:sticky lg:top-4 lg:self-start">
            <AIPlanner title="AI potovalni plan" fillColumn />
          </div>
          <div id="hotels-section" className="w-full lg:flex-1 min-w-0">
            <HotelAggregator layout="full" />
          </div>
        </div>
      </section>
    )
  }

  /** Booking pod karticami letov — glej FlightsPlanGridSection */
  return null
}
