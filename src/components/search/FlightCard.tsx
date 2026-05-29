'use client'

import { ArrowRight, Info, Plane } from 'lucide-react'
import {
  formatStopsLine,
  getLegStopoverCode,
  formatLegDuration,
  getOfferDisplayLegs,
  type OfferLegDisplay,
  type StopsLabels,
} from '@/lib/flightOfferLegs'
import { formatFlightPrice } from '@/lib/flightCurrency'
import type { FlightOffer } from '@/types/flight.types'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

export interface FlightCardProps {
  offer: FlightOffer
  travelerLabel?: string
  selected?: boolean
  onSelect?: () => void
  className?: string
}

function Co2Banner({ offer }: { offer: FlightOffer }) {
  const { t } = useTranslations()
  if (!offer.co2SavingsPercent) return null

  return (
    <div className="flex items-start gap-2 px-4 py-2.5 bg-[#e8f4fd] border-b border-[#d4e8f7] text-[13px] leading-snug text-[#0d4d7a]">
      <p className="flex-1">
        {t('flights.co2Emits')}{' '}
        <span className="font-semibold">
          {t('flights.co2LessThan', { percent: offer.co2SavingsPercent })}
        </span>{' '}
        {t('flights.co2AmongResults')}
        {offer.totalEmissionsKg != null && (
          <span className="text-[#3d6d8f]"> (≈ {offer.totalEmissionsKg} kg)</span>
        )}
        .
      </p>
      <span className="shrink-0 mt-0.5" title={t('flights.co2Tooltip')}>
        <Info className="w-4 h-4 text-[#0770e3]" aria-hidden />
      </span>
    </div>
  )
}

function AirlineColumn({ leg }: { leg: OfferLegDisplay }) {
  return (
    <div className="flex flex-col items-center w-[72px] sm:w-[80px] shrink-0 pt-0.5">
      {leg.airlineLogo ? (
        <img src={leg.airlineLogo} alt="" className="h-8 w-8 sm:h-9 sm:w-9 object-contain" />
      ) : (
        <div className="h-8 w-8 sm:h-9 sm:w-9 rounded bg-slate-100 flex items-center justify-center">
          <Plane className="w-4 h-4 text-slate-400" aria-hidden />
        </div>
      )}
      <span className="mt-1.5 text-[11px] font-medium text-slate-600 text-center leading-tight line-clamp-2 max-w-[76px]">
        {leg.airline}
      </span>
    </div>
  )
}

function SkyscannerLegRow({
  leg,
  showDivider,
  stopsLabels,
}: {
  leg: OfferLegDisplay
  showDivider?: boolean
  stopsLabels: StopsLabels
}) {
  const stopover = getLegStopoverCode(leg.segments)
  const stopsText = formatStopsLine(leg.stops, stopover, stopsLabels)
  const durationShort = formatLegDuration(leg.duration)

  return (
    <div
      className={cn(
        'flex items-center gap-3 sm:gap-5 py-4 px-4 sm:px-5',
        showDivider && 'border-t border-slate-100'
      )}
    >
      <AirlineColumn leg={leg} />

      <div className="flex-1 flex justify-center min-w-0">
        <div className="flex items-center gap-3 sm:gap-6 w-full max-w-[340px]">
          <div className="w-[52px] sm:w-[58px] shrink-0">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums leading-none">
              {leg.departTime}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              {leg.origin}
            </p>
          </div>

          <div className="flex-1 min-w-[100px] max-w-[160px] px-1">
            <p className="text-center text-xs text-slate-500 font-medium tabular-nums mb-1.5">
              {durationShort}
            </p>
            <div className="relative flex items-center">
              <div className="flex-1 border-t border-slate-300" />
              <div className="mx-1 flex items-center justify-center w-5 h-5 rounded-full bg-white border border-slate-300">
                <Plane className="w-2.5 h-2.5 text-slate-500 rotate-90" aria-hidden />
              </div>
              <div className="flex-1 border-t border-slate-300" />
            </div>
            <p
              className={cn(
                'text-center text-xs font-medium mt-1.5',
                leg.stops > 0 ? 'text-[#c8102e]' : 'text-slate-500'
              )}
            >
              {stopsText}
            </p>
          </div>

          <div className="w-[52px] sm:w-[58px] shrink-0 text-right">
            <p className="text-xl sm:text-2xl font-bold text-slate-900 tabular-nums leading-none">
              {leg.arriveTime}
              {leg.arriveDayOffset > 0 && (
                <sup className="text-[10px] sm:text-[11px] font-semibold text-slate-500 align-super ml-px">
                  {leg.arriveDayOffset}
                </sup>
              )}
            </p>
            <p className="text-xs text-slate-500 mt-1 font-medium uppercase tracking-wide">
              {leg.destination}
            </p>
          </div>
        </div>
      </div>

      <span className="sr-only">{leg.label}</span>
    </div>
  )
}

export function FlightCard({
  offer,
  travelerLabel = '1 traveler',
  selected = false,
  onSelect,
  className,
}: FlightCardProps) {
  const { t } = useTranslations()
  const legs = getOfferDisplayLegs(offer)
  const priceLabel = formatFlightPrice(offer.price, offer.currency)
  const stopsLabels: StopsLabels = {
    direct: t('flights.direct'),
    oneStop: t('flights.oneStop'),
    oneStopAt: (code) => t('flights.oneStopAt', { code }),
    stopsMany: (count) => t('flights.stopsMany', { count }),
  }

  return (
    <article
      className={cn(
        'bg-white rounded-xl border font-sans antialiased overflow-hidden transition-shadow',
        selected
          ? 'border-[#0770e3] shadow-md ring-1 ring-[#b8d9f7]'
          : 'border-slate-200 hover:border-slate-300 hover:shadow-md',
        className
      )}
    >
      <Co2Banner offer={offer} />

      <div className="flex flex-col lg:flex-row lg:items-stretch">
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {legs.map((leg, i) => (
            <SkyscannerLegRow
              key={leg.label}
              leg={leg}
              showDivider={i > 0}
              stopsLabels={stopsLabels}
            />
          ))}
        </div>

        <div className="flex flex-row lg:flex-col items-center lg:items-stretch justify-between gap-4 px-5 py-4 lg:py-5 lg:w-[200px] lg:shrink-0 border-t lg:border-t-0 lg:border-l border-slate-100 bg-white">
          <div className="lg:text-right flex-1 lg:flex-none min-w-0">
            <p className="text-xs text-slate-500 mb-1">{travelerLabel}</p>
            <p className="text-2xl sm:text-[28px] font-bold text-slate-900 tabular-nums leading-none tracking-tight">
              {priceLabel}
            </p>
            <p className="text-[11px] text-slate-400 mt-1 hidden sm:block">{t('flights.perAdult')}</p>
          </div>
          <button
            type="button"
            onClick={() => onSelect?.()}
            className={cn(
              'shrink-0 w-full sm:w-auto lg:w-full inline-flex items-center justify-center gap-2',
              'rounded-lg px-6 py-3 text-[15px] font-semibold text-white',
              'bg-sky-600 hover:bg-sky-700 active:bg-sky-800 transition-colors'
            )}
          >
            {t('flights.select')}
            <ArrowRight className="w-4 h-4" aria-hidden />
          </button>
        </div>
      </div>
    </article>
  )
}
