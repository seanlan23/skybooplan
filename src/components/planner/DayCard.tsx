'use client'
import { motion } from 'framer-motion'
import { MapPin, Euro } from 'lucide-react'
import { format } from 'date-fns'
import { sl } from 'date-fns/locale'
import { parseISO, startOfDay } from 'date-fns'
import { calendarDateForDay } from '@/lib/itineraryDates'
import { computeStayWindow } from '@/lib/itineraryStay'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useAccomStore } from '@/store/useAccomStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import type { ItineraryDay } from '@/types/itinerary.types'
import { ItineraryMarkdown } from './ItineraryMarkdown'

interface DayCardProps {
  day: ItineraryDay
  index: number
}

export function DayCard({ day, index }: DayCardProps) {
  const { activeLocation, setActiveLocation, itinerary } = usePlannerStore()
  const { setActiveLocation: setAccomLocation } = useAccomStore()
  const { departureDate } = useSearchStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)

  const isActive = activeLocation === day.location
  const suggestions = day.suggestions ?? []

  function handleLocationClick() {
    setActiveLocation(day.location)

    const tripStart = selectedFlight
      ? startOfDay(parseISO(selectedFlight.outboundArrivalAt))
      : departureDate
        ? startOfDay(departureDate)
        : startOfDay(new Date())

    const { checkIn, checkOut } = computeStayWindow(
      itinerary,
      day.location,
      day.day,
      tripStart
    )
    useAccomStore.getState().setUserPickedHotel(true)
    setAccomLocation(day.location, { checkIn, checkOut }, { userPicked: true, clearResults: true })
    useAccomStore.getState().triggerHotelSearch()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={cn(
        'bg-white rounded-2xl border p-4 md:p-5 transition-all duration-200',
        isActive
          ? 'border-sky-300 shadow-card-hover ring-2 ring-sky-100'
          : 'border-slate-100 shadow-card hover:border-slate-200'
      )}
    >
      <div className="flex items-start gap-3 mb-3">
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
            isActive ? /* BACKUP: 'bg-sky-500 text-white' */ 'bg-sky-600 text-white' : 'bg-sky-50 text-sky-600'
          )}
        >
          {day.day}
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-slate-900 text-sm leading-tight">{day.title}</p>
          {(selectedFlight || departureDate) && (
            <p className="text-xs text-slate-400 mt-0.5">
              {format(
                day.estimatedDate ??
                  (selectedFlight
                    ? calendarDateForDay(selectedFlight.outboundArrivalAt, day.day)
                    : departureDate!),
                'EEEE, d. MMM',
                { locale: sl }
              )}
            </p>
          )}
        </div>
      </div>

      <button
        type="button"
        onClick={handleLocationClick}
        className={cn(
          'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-3 transition-all duration-200',
          isActive
            ? /* BACKUP: 'bg-sky-500 text-white' */ 'bg-sky-600 text-white hover:bg-sky-700'
            : 'bg-sky-50 text-sky-700 hover:bg-sky-100 border border-sky-200'
        )}
      >
        <MapPin className="w-3 h-3" />
        {day.location}
      </button>

      <div className="mb-4">
        <ItineraryMarkdown text={day.description} />
      </div>

      {suggestions.length > 0 && (
        <div className="border-t border-slate-100 pt-3 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1">
            Predlogi za dan
          </p>
          {suggestions.map((s, i) => (
            <div
              key={`${s.name}-${i}`}
              className="rounded-xl bg-slate-50/90 border border-slate-100 px-3 py-2.5"
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-slate-800 leading-snug">{s.name}</p>
                <span className="shrink-0 inline-flex items-center gap-0.5 text-xs font-semibold text-leaf-700 bg-leaf-50 border border-leaf-100 rounded-md px-1.5 py-0.5">
                  <Euro className="w-3 h-3" />
                  {s.priceLabel}
                </span>
              </div>
              {s.description ? (
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{s.description}</p>
              ) : null}
            </div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
