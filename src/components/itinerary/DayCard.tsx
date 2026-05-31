'use client';

import { PhotoCarousel } from './PhotoCarousel';
import { useTripStore } from '@/lib/tripStore';
import type { DayPlan } from '@/lib/types';

export function DayCard({ day }: { day: DayPlan }) {
  const { activePlaceId, setActivePlace, setActiveDay } = useTripStore();
  const first = day.places[0]?.coordinates;

  return (
    <section
      onMouseEnter={() => first && setActiveDay(day.dayNumber, first)}
      className="rounded-2xl border bg-card p-5 shadow-sm"
    >
      <h2 className="text-xl font-bold">Day {day.dayNumber}: {day.title}</h2>
      <p className="text-sm text-muted-foreground">{day.summary}</p>
      <div className="mt-4 space-y-6">
        {day.places.map((p) => (
          <article
            key={p.id}
            onClick={() => setActivePlace(p.id, p.coordinates)}
            className={`cursor-pointer rounded-xl p-3 transition ${
              activePlaceId === p.id ? 'bg-blue-50 ring-2 ring-blue-400' : 'hover:bg-muted'
            }`}
          >
            <h3 className="font-semibold">{p.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{p.description}</p>
            {p.images?.length > 0 && <PhotoCarousel images={p.images} alt={p.name} />}
          </article>
        ))}
      </div>
    </section>
  );
}
