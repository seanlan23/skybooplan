'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TripMap } from './map/TripMap';
import { DayCard } from './itinerary/DayCard';
import { buildTripMapStops } from '@/lib/buildTripMapStops';
import type { Itinerary } from '@/lib/types';

export function ItineraryView({ itinerary }: { itinerary: Itinerary }) {
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const stopRefs = useRef<Map<string, HTMLElement>>(new Map());

  const mapItinerary = useMemo(() => buildTripMapStops(itinerary), [itinerary]);

  const registerStopRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) stopRefs.current.set(id, el);
    else stopRefs.current.delete(id);
  }, []);

  const handleStopClick = useCallback((id: string) => {
    setSelectedStopId(id);
    const stop = mapItinerary.stops.find((s) => s.id === id);
    if (stop) setSelectedDay(stop.day);
  }, [mapItinerary.stops]);

  useEffect(() => {
    if (!selectedStopId) return;
    const el = stopRefs.current.get(selectedStopId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStopId]);

  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
      <div className="overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">{itinerary.destination}</h1>
          <p className="text-slate-500">
            {itinerary.startDate} → {itinerary.endDate} · {itinerary.budgetEUR} €
          </p>
        </header>
        {itinerary.days.map((day) => (
          <DayCard
            key={day.dayNumber}
            day={day}
            selectedStopId={selectedStopId}
            selectedDay={selectedDay}
            onStopClick={handleStopClick}
            onDayClick={(dayNumber) => {
              setSelectedDay(dayNumber);
              setSelectedStopId(`city-${dayNumber}`);
            }}
            registerStopRef={registerStopRef}
          />
        ))}
      </div>
      <div className="sticky top-0 h-screen p-4">
        <TripMap
          itinerary={mapItinerary}
          selectedStopId={selectedStopId}
          selectedDay={selectedDay}
          onStopClick={handleStopClick}
        />
      </div>
    </div>
  );
}
