'use client';

import { PhotoCarousel } from './PhotoCarousel';
import type { DayPlan } from '@/lib/types';

interface DayCardProps {
  day: DayPlan;
  selectedStopId?: string | null;
  selectedDay?: number | null;
  onStopClick?: (id: string) => void;
  onDayClick?: (dayNumber: number) => void;
  registerStopRef?: (id: string, el: HTMLElement | null) => void;
}

export function DayCard({
  day,
  selectedStopId,
  selectedDay,
  onStopClick,
  onDayClick,
  registerStopRef,
}: DayCardProps) {
  const cityStopId = `city-${day.dayNumber}`;
  const isDaySelected =
    selectedStopId === cityStopId ||
    (selectedDay === day.dayNumber && selectedStopId == null);

  return (
    <section
      ref={(el) => registerStopRef?.(cityStopId, el)}
      onClick={() => onDayClick?.(day.dayNumber)}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        isDaySelected ? 'ring-2 ring-amber-400 border-amber-200' : ''
      }`}
    >
      <h2 className="text-xl font-bold">Day {day.dayNumber}: {day.title}</h2>
      <p className="text-sm text-slate-500">{day.summary}</p>
      <div className="mt-4 space-y-6">
        {day.places.map((place) => {
          const isSelected = selectedStopId === place.id;
          return (
            <article
              key={place.id}
              ref={(el) => registerStopRef?.(place.id, el)}
              onClick={(e) => {
                e.stopPropagation();
                onStopClick?.(place.id);
              }}
              className={`cursor-pointer rounded-xl p-3 transition ${
                isSelected
                  ? 'bg-amber-50 ring-2 ring-amber-400'
                  : 'hover:bg-slate-50'
              }`}
            >
              <h3 className="font-semibold">{place.name}</h3>
              <p className="text-sm text-slate-500 mb-2">{place.description}</p>
              {place.images?.length > 0 && (
                <PhotoCarousel images={place.images} alt={place.name} />
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
