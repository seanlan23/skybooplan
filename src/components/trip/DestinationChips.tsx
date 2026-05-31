'use client';

import { cn } from '@/lib/utils';
import type { TripDestination } from '@/lib/buildTripDestinations';

export function DestinationChips({
  destinations,
  selectedId,
  onSelect,
}: {
  destinations: TripDestination[];
  selectedId?: string | null;
  onSelect: (id: string) => void;
}) {
  if (destinations.length === 0) return null;

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
      {destinations.map((dest) => {
        const active = selectedId === dest.id;
        return (
          <button
            key={dest.id}
            type="button"
            onClick={() => onSelect(dest.id)}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium transition',
              active
                ? 'border-slate-900 bg-slate-900 text-white'
                : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
            )}
          >
            <span
              className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                active ? 'bg-white text-slate-900' : 'bg-slate-900 text-white'
              )}
            >
              {dest.order}
            </span>
            <span className="max-w-[120px] truncate">{dest.name}</span>
          </button>
        );
      })}
    </div>
  );
}
