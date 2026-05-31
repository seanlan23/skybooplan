'use client'

import { useMemo } from 'react'
import { TripMap } from '@/components/map/TripMap'
import {
  buildTripMapStopsFromPlannerDays,
  plannerDayForLocation,
} from '@/lib/buildTripMapStopsFromPlannerDays'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'

export function AiPlannerMap({ className }: { className?: string }) {
  const itinerary = usePlannerStore((s) => s.itinerary)
  const activeLocation = usePlannerStore((s) => s.activeLocation)
  const setActiveLocation = usePlannerStore((s) => s.setActiveLocation)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)

  const mapItinerary = useMemo(
    () => buildTripMapStopsFromPlannerDays(itinerary),
    [itinerary]
  )

  const selectedDay = useMemo(
    () => plannerDayForLocation(itinerary, activeLocation),
    [itinerary, activeLocation]
  )

  const selectedStopId = selectedDay != null ? `city-${selectedDay}` : null

  function handleStopClick(id: string) {
    const dayNum = parseInt(id.replace('city-', ''), 10)
    const day = itinerary.find((d) => d.day === dayNum)
    if (day) setActiveLocation(day.location)
  }

  if (mapItinerary.stops.length === 0 && selectedFlight) {
    return (
      <div
        className={`flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-500 ${className ?? ''}`}
      >
        Koordinate se nalagajo… poskusi znova generirati načrt.
      </div>
    )
  }

  return (
    <div className={className}>
      <TripMap
        itinerary={mapItinerary}
        selectedStopId={selectedStopId}
        selectedDay={selectedDay}
        onStopClick={handleStopClick}
        fullBleed={false}
      />
    </div>
  )
}
