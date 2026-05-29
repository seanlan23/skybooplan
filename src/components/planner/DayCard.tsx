'use client'
import { motion } from 'framer-motion'
import { MapPin, Euro } from 'lucide-react'
import { format } from 'date-fns'
import { parseISO, startOfDay } from 'date-fns'
import { calendarDateForDay } from '@/lib/itineraryDates'
import { computeStayWindow } from '@/lib/itineraryStay'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useAccomStore } from '@/store/useAccomStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import { isFirstDayForCity } from '@/lib/itineraryCitySegments'
import type { ItineraryDay } from '@/types/itinerary.types'
import { DayCardHotels } from './DayCardHotels'
import { ItineraryMarkdown } from './ItineraryMarkdown'
import { useTranslations } from '@/i18n/LocaleProvider'
import { getDateFnsLocale } from '@/i18n/localeDateFns'

interface DayCardProps {
  day: ItineraryDay
  index: number
}

export function DayCard({ day, index }: DayCardProps) {
  const { t, locale } = useTranslations()
  const { activeLocation, setActiveLocation, itinerary } = usePlannerStore()
  const { setActiveLocation: setAccomLocation } = useAccomStore()
  const { departureDate } = useSearchStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)

  const isActive = activeLocation === day.location
  const suggestions = day.suggestions ?? []
  const showHotels = isFirstDayForCity(day, itinerary)

  const dateLabel =
    selectedFlight || departureDate
      ? format(
          day.estimatedDate ??
            (selectedFlight
              ? calendarDateForDay(selectedFlight.outboundArrivalAt, day.day)
              : departureDate!),
          'EEEE, d. MMM',
          { locale: getDateFnsLocale(locale) }
        )
      : null

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
        'overflow-hidden rounded-2xl border bg-white transition-all duration-200',
        'shadow-[0_4px_18px_rgba(15,23,42,0.07)]',
        isActive
          ? 'border-sky-300 shadow-[0_8px_28px_rgba(14,165,233,0.18)] ring-2 ring-sky-100'
          : 'border-slate-100 hover:border-slate-200 hover:shadow-[0_6px_22px_rgba(15,23,42,0.1)]'
      )}
    >
      {/* Glava dneva */}
      <div
        className={cn(
          'px-4 py-4 md:px-5 md:py-4',
          'bg-gradient-to-br from-sky-50/95 via-slate-50/90 to-slate-100/80',
          isActive && 'from-sky-100/90 via-sky-50/80 to-slate-50/90'
        )}
      >
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold',
              isActive ? 'bg-sky-600 text-white shadow-sm' : 'bg-white text-sky-600 shadow-sm ring-1 ring-sky-100'
            )}
          >
            {day.day}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-bold leading-snug text-slate-900 md:text-[1.0625rem]">
              {day.title}
            </h3>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {dateLabel ? (
                <span className="text-xs font-medium text-slate-500">{dateLabel}</span>
              ) : null}
              <button
                type="button"
                onClick={handleLocationClick}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium',
                  'shadow-sm transition-all duration-200',
                  isActive
                    ? 'bg-sky-600 text-white hover:bg-sky-700 shadow-md'
                    : 'border border-sky-200 bg-sky-50 text-sky-700 hover:bg-sky-100 hover:shadow-md'
                )}
              >
                <MapPin className="h-3 w-3 shrink-0" />
                {day.location}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vsebina */}
      <div className="space-y-5 px-4 py-5 leading-[1.6] md:px-5">
        <ItineraryMarkdown text={day.description} />

        {showHotels ? <DayCardHotels day={day} /> : null}

        {suggestions.length > 0 ? (
          <div className="space-y-3 border-t border-slate-100 pt-5">
            <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
              {t('dayCard.suggestionsForDay')}
            </p>
            <div className="space-y-2.5">
              {suggestions.map((s, i) => (
                <div
                  key={`${s.name}-${i}`}
                  className={cn(
                    'rounded-xl border border-slate-100 bg-slate-50/90 px-3.5 py-3',
                    'transition-all duration-200',
                    'hover:-translate-y-0.5 hover:border-slate-200 hover:bg-white hover:shadow-md'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold leading-snug text-slate-800">{s.name}</p>
                    <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full border border-leaf-200 bg-leaf-50 px-2.5 py-1 text-xs font-bold text-leaf-700 shadow-sm">
                      <Euro className="h-3 w-3" />
                      {s.priceLabel}
                    </span>
                  </div>
                  {s.description ? (
                    <p className="mt-2 text-xs leading-[1.6] text-slate-500">{s.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </motion.div>
  )
}
