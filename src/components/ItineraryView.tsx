'use client';

import { TripMap } from './map/TripMap';
import { DayCard } from './itinerary/DayCard';
import type { Itinerary } from '@/lib/types';

export function ItineraryView({ itinerary }: { itinerary: Itinerary }) {
  return (
    <div className="grid h-screen grid-cols-1 lg:grid-cols-[1fr_1.2fr]">
      <div className="overflow-y-auto p-6 space-y-6">
        <header>
          <h1 className="text-3xl font-bold">{itinerary.destination}</h1>
          <p className="text-muted-foreground">
            {itinerary.startDate} → {itinerary.endDate} · {itinerary.budgetEUR} €
          </p>
        </header>
        {itinerary.days.map((d) => <DayCard key={d.dayNumber} day={d} />)}
      </div>
      <div className="sticky top-0 h-screen p-4">
        <TripMap itinerary={itinerary} />
      </div>
    </div>
  );
}
