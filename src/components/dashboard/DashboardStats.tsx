'use client';

import { computeDashboardStats } from '@/lib/trips';
import type { TripRow } from '@/types/trip.types';

export function DashboardStats({ trips }: { trips: TripRow[] }) {
  const { totalTrips, totalDays, totalCountries } = computeDashboardStats(trips);

  const items = [
    { label: 'Skupaj planov', value: totalTrips },
    { label: 'Skupaj dni', value: totalDays },
    { label: 'Skupaj držav', value: totalCountries },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <div
          key={item.label}
          className="rounded-2xl border border-slate-200 bg-white px-5 py-4 shadow-sm"
        >
          <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
            {item.label}
          </p>
          <p className="mt-1 text-3xl font-bold text-slate-900">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
