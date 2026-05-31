'use client'

import { motion } from 'framer-motion'
import { MapPin, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { parseISO, startOfDay } from 'date-fns'
import { calendarDateForDay } from '@/lib/itineraryDates'
import { computeStayWindow } from '@/lib/itineraryStay'
import { getDaySlotActivities, dayHasTimeBlocks } from '@/lib/dayPlanActivities'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useAccomStore } from '@/store/useAccomStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import { isFirstDayForCity } from '@/lib/itineraryCitySegments'
import type { ItineraryDay } from '@/types/itinerary.types'
import { DayCardHotels } from './DayCardHotels'
import { AiPlanTimeBlock } from './AiPlanTimeBlock'
import { AiPlanSuggestions } from './AiPlanSuggestions'
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
  const hasTimeBlocks = dayHasTimeBlocks(day)
  const transport = day.transportFromPrevious

  const dateLabel =
    selectedFlight || departureDate
      ? format(
          day.estimatedDate ??
            (day.date
              ? parseISO(day.date)
              : selectedFlight
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
        'overflow-hidden rounded-2xl bg-white shadow-sm transition-all duration-200 animate-fade-in',
        isActive
          ? 'border-2 border-sky-300 ring-2 ring-sky-100'
          : 'border border-slate-100 hover:shadow-md'
      )}
    >
      {/* Glava — Lovable style */}
      <div className="bg-gradient-to-br from-sky-50 via-slate-50 to-slate-100 px-5 py-5 sm:px-6 sm:py-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sky-600 text-white font-bold text-base shadow-sm">
            {day.day}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
              Dan {day.day}: {day.title}
            </h3>
            <div className="mt-1.5 flex flex-wrap items-center gap-2">
              {dateLabel ? (
                <span className="text-sm text-slate-500 capitalize">{dateLabel}</span>
              ) : null}
              <button
                type="button"
                onClick={handleLocationClick}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold shadow-sm transition-colors',
                  isActive
                    ? 'bg-sky-700 text-white hover:bg-sky-800'
                    : 'bg-sky-600 text-white hover:bg-sky-700'
                )}
              >
                <MapPin className="h-3 w-3 shrink-0" />
                {day.location}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vsebina — Lovable time blocks */}
      <div className="px-5 py-5 sm:px-6 sm:py-6 space-y-4">
        {hasTimeBlocks ? (
          <>
            <AiPlanTimeBlock
              variant="morning"
              label={t('dayCard.morning')}
              activities={getDaySlotActivities(day, 'morning')}
            />
            <AiPlanTimeBlock
              variant="afternoon"
              label={t('dayCard.afternoon')}
              activities={getDaySlotActivities(day, 'afternoon')}
            />
            <AiPlanTimeBlock
              variant="evening"
              label={t('dayCard.evening')}
              activities={getDaySlotActivities(day, 'evening')}
            />
          </>
        ) : (
          <ItineraryMarkdown text={day.description} />
        )}

        {transport && transport.type !== 'none' && (
          <div className="pt-1">
            <p className="text-sm text-slate-700">
              <span className="font-bold text-slate-900">{t('dayCard.transport')}:</span>{' '}
              {transport.type}
              {transport.duration ? ` · ${transport.duration}` : ''}
              {transport.cost ? ` · ${transport.cost}` : ''}
            </p>
            {transport.description ? (
              <p className="mt-1 text-sm text-slate-600">{transport.description}</p>
            ) : null}
          </div>
        )}

        {day.travelHack ? (
          <div className="flex items-start gap-3 rounded-r-lg border-l-4 border-amber-500 bg-amber-50 px-4 py-3">
            <span aria-hidden className="text-lg leading-none">
              💡
            </span>
            <p className="text-sm text-amber-900">
              <span className="font-bold">{t('dayCard.travelHack')}:</span> {day.travelHack}
            </p>
          </div>
        ) : null}

        {typeof day.dailyBudget === 'number' && (
          <p className="text-sm text-slate-800 flex items-center gap-2">
            <Wallet className="h-4 w-4 text-slate-500" />
            <span className="font-bold">{t('dayCard.dailyBudget')}:</span> cca. €{day.dailyBudget}
          </p>
        )}

        {showHotels ? <DayCardHotels day={day} /> : null}

        {suggestions.length > 0 ? <AiPlanSuggestions suggestions={suggestions} /> : null}
      </div>
    </motion.div>
  )
}
