'use client'
import { Plane, Clock } from 'lucide-react'
import { legEndpoints } from '@/lib/formatFlight'
import type { FlightSegment } from '@/types/flight.types'
import { cn } from '@/lib/utils'

interface FlightLegSummaryProps {
  label: string
  segments: FlightSegment[]
  duration: string
  stops: number
  variant?: 'outbound' | 'return'
}

export function FlightLegSummary({
  label,
  segments,
  duration,
  stops,
  variant = 'outbound',
}: FlightLegSummaryProps) {
  const leg = legEndpoints(segments)
  if (!leg) return null

  return (
    <div
      className={cn(
        'rounded-xl p-3',
        variant === 'return' ? 'bg-slate-50' : 'bg-sky-50/60'
      )}
    >
      <p
        className={cn(
          'text-xs font-semibold uppercase tracking-wide mb-2',
          variant === 'return' ? 'text-slate-500' : 'text-sky-600'
        )}
      >
        {label}
      </p>
      <div className="flex items-center gap-2">
        <div className="text-left min-w-[4.5rem]">
          <p className="font-mono font-bold text-base text-slate-900">{leg.origin}</p>
          <p className="font-semibold text-sm text-slate-800">{leg.departTime}</p>
          <p className="text-xs text-slate-400">{leg.departDate}</p>
        </div>

        <div className="flex-1 flex flex-col items-center gap-0.5 px-1">
          <div className="flex items-center gap-1 w-full">
            <div className="h-px flex-1 bg-slate-200" />
            <Plane
              className={cn(
                'w-3.5 h-3.5 rotate-90',
                variant === 'return' ? 'text-slate-400' : 'text-sky-400'
              )}
            />
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex items-center gap-1 text-xs text-slate-500">
            <Clock className="w-3 h-3" />
            <span>{duration}</span>
            {stops === 0 ? (
              <span className="text-leaf-600 font-medium">· Direktno</span>
            ) : (
              <span>
                · {stops} postaja{stops > 1 ? 'i' : ''}
              </span>
            )}
          </div>
        </div>

        <div className="text-right min-w-[4.5rem]">
          <p className="font-mono font-bold text-base text-slate-900">{leg.destination}</p>
          <p className="font-semibold text-sm text-slate-800">{leg.arriveTime}</p>
          <p className="text-xs text-slate-400">{leg.arriveDate}</p>
        </div>
      </div>

      {segments.length > 1 && (
        <div className="mt-2 pt-2 border-t border-slate-200/60 space-y-1">
          {segments.map((seg, i) => (
            <p key={i} className="text-xs text-slate-500">
              {seg.departure.iataCode} {seg.carrierCode}
              {seg.flightNumber} → {seg.arrival.iataCode}
              {' · '}
              {seg.duration}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}
