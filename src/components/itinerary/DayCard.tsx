'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { PhotoCarousel } from './PhotoCarousel';
import { TripFlightCard } from '@/components/trip/TripFlightCard';
import type { DayPlan, FlightSuggestion } from '@/lib/types';

interface DayCardProps {
  day: DayPlan;
  index: number;
  flight?: FlightSuggestion;
  selectedStopId?: string | null;
  selectedDay?: number | null;
  onStopClick?: (id: string) => void;
  onDayClick?: (dayNumber: number) => void;
  registerStopRef?: (id: string, el: HTMLElement | null) => void;
}

function formatDayDate(dateISO: string): string {
  try {
    return format(parseISO(dateISO), 'MMM d');
  } catch {
    return dateISO;
  }
}

function DayPhotoStrip({ images, alt }: { images: string[]; alt: string }) {
  const photos = images.slice(0, 3);
  if (photos.length === 0) return null;

  return (
    <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {photos.map((src, i) => (
        <div
          key={`${src}-${i}`}
          className="h-24 w-32 shrink-0 overflow-hidden rounded-xl bg-slate-100 shadow-sm"
        >
          <img src={src} alt={`${alt} ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
        </div>
      ))}
    </div>
  );
}

function ReadMoreText({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const long = text.length > 160;

  if (!long) return <p className="text-sm leading-relaxed text-slate-600">{text}</p>;

  return (
    <p className="text-sm leading-relaxed text-slate-600">
      {expanded ? text : `${text.slice(0, 160).trim()}…`}{' '}
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setExpanded((v) => !v);
        }}
        className="font-medium text-slate-900 underline-offset-2 hover:underline"
      >
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </p>
  );
}

export function DayCard({
  day,
  index,
  flight,
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

  const dayPhotos = day.places.flatMap((p) => p.images ?? []).slice(0, 3);
  const greeting = day.summary || day.places[0]?.description || '';

  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      ref={(el) => registerStopRef?.(cityStopId, el)}
      onClick={() => onDayClick?.(day.dayNumber)}
      className={`rounded-2xl border bg-white p-5 shadow-sm transition ${
        isDaySelected ? 'ring-2 ring-amber-400 border-amber-200' : 'border-slate-100'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        Day {day.dayNumber} · {formatDayDate(day.date)}
      </p>
      <h2 className="mt-1 text-xl font-bold text-slate-900">{day.title}</h2>

      {greeting && (
        <div className="mt-2">
          <ReadMoreText text={greeting} />
        </div>
      )}

      <DayPhotoStrip images={dayPhotos} alt={day.title} />

      {index === 0 && flight && (
        <div className="mt-4" onClick={(e) => e.stopPropagation()}>
          <TripFlightCard flight={flight} />
        </div>
      )}

      <div className="mt-4 space-y-4">
        {day.places.map((place) => {
          const isSelected = selectedStopId === place.id;
          return (
            <motion.article
              key={place.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.08 + 0.05 }}
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
              <h3 className="font-semibold text-slate-900">{place.name}</h3>
              <div className="mt-1">
                <ReadMoreText text={place.description} />
              </div>
              {place.images?.length > 0 && (
                <div className="mt-2">
                  <PhotoCarousel images={place.images} alt={place.name} />
                </div>
              )}
            </motion.article>
          );
        })}
      </div>
    </motion.section>
  );
}
