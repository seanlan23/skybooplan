'use client';

import Link from 'next/link';
import { format } from 'date-fns';
import { sl } from 'date-fns/locale';
import { tripCoverImage, tripDayCount } from '@/lib/trips';
import type { TripRow } from '@/types/trip.types';

export function TripCard({ trip }: { trip: TripRow }) {
  const days = tripDayCount(trip);
  const created = format(new Date(trip.created_at), 'd. MMM yyyy', { locale: sl });

  return (
    <Link
      href={`/trip/${trip.id}`}
      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
        <img
          src={tripCoverImage(trip)}
          alt={trip.destination}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        <span
          className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow ${
            trip.pdf_unlocked
              ? 'bg-emerald-100 text-emerald-800'
              : 'bg-white/90 text-slate-700'
          }`}
        >
          {trip.pdf_unlocked ? 'Plačano ✓' : 'Zaklenjeno 🔒'}
        </span>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-slate-900 line-clamp-1">{trip.title}</h3>
        <p className="text-sm text-slate-500 mt-0.5">{trip.destination}</p>
        <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
          <span>{created}</span>
          <span>{days} {days === 1 ? 'dan' : 'dni'}</span>
        </div>
      </div>
    </Link>
  );
}
