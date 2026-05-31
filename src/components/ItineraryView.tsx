'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { TripMap } from './map/TripMap';
import { DayCard } from './itinerary/DayCard';
import { buildTripMapStops } from '@/lib/buildTripMapStops';
import { buildTripDestinations } from '@/lib/buildTripDestinations';
import { TripPanelToggle } from '@/components/trip/TripPanelToggle';
import { DestinationChips } from '@/components/trip/DestinationChips';
import { TripChatPanel } from '@/components/trip/TripChatPanel';
import { BookTripCta } from '@/components/trip/BookTripCta';
import type { Itinerary } from '@/lib/types';

type PanelMode = 'trip' | 'chat';

export function ItineraryView({
  itinerary,
  onBook,
}: {
  itinerary: Itinerary;
  onBook?: () => void;
}) {
  const [panelMode, setPanelMode] = useState<PanelMode>('trip');
  const [selectedStopId, setSelectedStopId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const stopRefs = useRef<Map<string, HTMLElement>>(new Map());

  const mapItinerary = useMemo(() => buildTripMapStops(itinerary), [itinerary]);
  const destinations = useMemo(() => buildTripDestinations(itinerary), [itinerary]);
  const primaryFlight = itinerary.flights[0];

  const registerStopRef = useCallback((id: string, el: HTMLElement | null) => {
    if (el) stopRefs.current.set(id, el);
    else stopRefs.current.delete(id);
  }, []);

  const handleStopClick = useCallback(
    (id: string) => {
      setSelectedStopId(id);
      const stop = mapItinerary.stops.find((s) => s.id === id);
      if (stop) setSelectedDay(stop.day);
    },
    [mapItinerary.stops]
  );

  const handleDestinationSelect = useCallback(
    (id: string) => {
      setSelectedStopId(id);
      const dest = destinations.find((d) => d.id === id);
      if (dest) {
        const dayNum = parseInt(id.replace('city-', ''), 10);
        if (!Number.isNaN(dayNum)) setSelectedDay(dayNum);
      }
    },
    [destinations]
  );

  useEffect(() => {
    if (!selectedStopId) return;
    const el = stopRefs.current.get(selectedStopId);
    el?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [selectedStopId]);

  return (
    <div className="grid h-full min-h-0 grid-cols-1 lg:grid-cols-[2fr_3fr]">
      {/* Map — first on mobile, right on desktop */}
      <div className="relative order-1 h-[42vh] min-h-[280px] lg:order-2 lg:h-full">
        <TripMap
          itinerary={mapItinerary}
          selectedStopId={selectedStopId}
          selectedDay={selectedDay}
          onStopClick={handleStopClick}
          fullBleed
        />
      </div>

      {/* Trip panel */}
      <div className="relative order-2 flex min-h-0 flex-col lg:order-1">
        <div className="flex-1 overflow-y-auto px-5 pb-28 pt-5 lg:px-6 lg:pt-6">
          <div className="mb-5 space-y-4">
            <TripPanelToggle mode={panelMode} onChange={setPanelMode} />
            {panelMode === 'trip' && (
              <>
                <header>
                  <h1 className="text-2xl font-bold text-slate-900 lg:text-3xl">
                    {itinerary.destination}
                  </h1>
                  <p className="text-sm text-slate-500">
                    {itinerary.startDate} → {itinerary.endDate} · {itinerary.budgetEUR} €
                  </p>
                </header>
                <DestinationChips
                  destinations={destinations}
                  selectedId={selectedStopId}
                  onSelect={handleDestinationSelect}
                />
              </>
            )}
          </div>

          {panelMode === 'chat' ? (
            <TripChatPanel itinerary={itinerary} />
          ) : (
            <div className="space-y-5">
              {itinerary.days.map((day, index) => (
                <DayCard
                  key={day.dayNumber}
                  day={day}
                  index={index}
                  flight={index === 0 ? primaryFlight : undefined}
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
          )}
        </div>

        {panelMode === 'trip' && <BookTripCta onBook={onBook} />}
      </div>
    </div>
  );
}
