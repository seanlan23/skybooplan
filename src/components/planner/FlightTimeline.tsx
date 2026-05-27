'use client'

import { format, parseISO } from 'date-fns'
import { sl } from 'date-fns/locale'
import { Clock, Plane } from 'lucide-react'
import { formatDurationMinutes } from '@/lib/buildFlightTimeline'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import { cn } from '@/lib/utils'

function formatPointTime(iso: string) {
  try {
    return format(parseISO(iso), 'HH:mm', { locale: sl })
  } catch {
    return '—'
  }
}

function formatPointDate(iso: string) {
  try {
    return format(parseISO(iso), 'd. MMM', { locale: sl })
  } catch {
    return ''
  }
}

interface FlightTimelineProps {
  flight: SelectedFlightForAI
}

export function FlightTimeline({ flight }: FlightTimelineProps) {
  const points = flight.timeline
  if (!points.length) return null

  return (
    <div className="rounded-2xl border border-sky-200 bg-gradient-to-b from-sky-50/90 to-white px-4 pt-4 pb-5 shadow-sm">
      <div className="flex items-center justify-between gap-2 mb-5">
        <div className="flex items-center gap-2 min-w-0">
          <Plane className="w-4 h-4 text-sky-500 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-sky-800 uppercase tracking-wide">
              Časovna premica leta
            </p>
            <p className="text-xs text-slate-500 truncate">
              {flight.airline} · {flight.origin} → {flight.destination}
            </p>
          </div>
        </div>
        {/* BACKUP: bg-sky-500 */}
        <div className="flex items-center gap-1.5 shrink-0 bg-sky-600 text-white text-xs font-bold px-2.5 py-1 rounded-full">
          <Clock className="w-3.5 h-3.5" />
          Skupaj {flight.totalDurationLabel}
        </div>
      </div>

      <div className="relative px-2 pb-1">
        <div
          className="absolute top-5 left-6 right-6 h-0.5 bg-sky-200"
          aria-hidden
        />

        <div
          className="grid gap-3"
          style={{ gridTemplateColumns: `repeat(${points.length}, minmax(0, 1fr))` }}
        >
          {points.map((point, index) => (
            <div
              key={`${point.kind}-${point.iata}-${index}`}
              className="flex flex-col items-center min-w-0 relative z-10 min-h-[7.5rem]"
            >
              <div
                className={cn(
                  'w-10 h-10 rounded-full border-2 flex items-center justify-center text-[10px] font-bold bg-white shadow-sm shrink-0',
                  point.kind === 'departure' && 'border-sky-500 text-sky-600',
                  point.kind === 'stopover' && 'border-amber-400 text-amber-700',
                  point.kind === 'arrival' && 'border-leaf-500 text-leaf-700'
                )}
              >
                {point.iata}
              </div>

              <p
                className={cn(
                  'mt-3 text-[10px] font-bold uppercase tracking-wide text-center',
                  point.kind === 'departure' && 'text-sky-600',
                  point.kind === 'stopover' && 'text-amber-700',
                  point.kind === 'arrival' && 'text-leaf-700'
                )}
              >
                {point.label}
              </p>

              <p className="font-mono text-sm font-bold text-slate-900 mt-1">
                {formatPointTime(point.at)}
              </p>
              <p className="text-[10px] text-slate-400">{formatPointDate(point.at)}</p>

              {point.kind === 'stopover' && point.connectionDepartureAt && (
                <div className="mt-3 w-full max-w-[9rem] rounded-lg bg-amber-50 border border-amber-100 px-2 py-2 text-center space-y-1">
                  <p className="text-[10px] text-amber-800 leading-snug">
                    nadaljevanje {formatPointTime(point.connectionDepartureAt)}
                  </p>
                  {point.layoverMinutes != null && point.layoverMinutes > 0 && (
                    <p className="text-[10px] text-slate-600 font-medium leading-snug">
                      postanek {formatDurationMinutes(point.layoverMinutes)}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {flight.isRoundTrip && (
        <p className="text-[10px] text-slate-400 mt-4 text-center border-t border-sky-100 pt-3">
          Prikazan je odhod do destinacije · povratek je ločen pri rezervaciji
        </p>
      )}
    </div>
  )
}
