'use client';

import type { FlightSuggestion } from '@/lib/types';

function formatDuration(fromISO: string, toISO: string): string {
  const ms = new Date(toISO).getTime() - new Date(fromISO).getTime();
  if (!Number.isFinite(ms) || ms <= 0) return '—';
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function inferStops(flight: FlightSuggestion): number {
  const route = `${flight.from}-${flight.to}`.toLowerCase();
  if (route.includes('doha') || route.includes('dxb') || route.includes('ist')) return 1;
  if (flight.from.length >= 3 && flight.to.length >= 3 && flight.from.slice(0, 2) !== flight.to.slice(0, 2)) {
    return 1;
  }
  return 0;
}

export function TripFlightCard({
  flight,
  onChange,
}: {
  flight: FlightSuggestion;
  onChange?: () => void;
}) {
  const stops = inferStops(flight);
  const duration = formatDuration(flight.departISO, flight.arriveISO);

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <span aria-hidden>✈️</span>
            {flight.from} → {flight.to}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {duration}
            {stops > 0 ? ` · ${stops} stop${stops > 1 ? 's' : ''}` : ' · Direct'}
            {' · '}
            Economy
          </p>
          {flight.airline && (
            <span className="mt-2 inline-block rounded-full bg-white px-2 py-0.5 text-xs font-medium text-slate-600 ring-1 ring-slate-200">
              {flight.airline}
            </span>
          )}
        </div>
        {onChange && (
          <button
            type="button"
            onClick={onChange}
            className="shrink-0 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Change
          </button>
        )}
      </div>
    </div>
  );
}
