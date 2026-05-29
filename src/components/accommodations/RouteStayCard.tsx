'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ExternalLink } from 'lucide-react'
import { BookingRatingBadge } from '@/components/accommodations/BookingRatingBadge'
import { toHdBookingImageUrl } from '@/lib/hotelGallery'
import { cn } from '@/lib/utils'
import type { Accommodation } from '@/types/accommodation.types'
import { useTranslations } from '@/i18n/LocaleProvider'
import { getDateFnsLocale } from '@/i18n/localeDateFns'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

interface RouteStayCardProps {
  accom: Accommodation
  onView: (accom: Accommodation) => void
  className?: string
}

export function RouteStayCard({ accom, onView, className }: RouteStayCardProps) {
  const { t, locale } = useTranslations()
  const [imgBroken, setImgBroken] = useState(false)
  const imageSrc =
    imgBroken || !accom.imageUrl?.trim()
      ? PLACEHOLDER_IMAGE
      : toHdBookingImageUrl(accom.imageUrl)
  const pricePerNight = Number.isFinite(accom.pricePerNight) ? accom.pricePerNight : 0
  const dateFnsLocale = getDateFnsLocale(locale)

  const dateLabel =
    accom.checkIn && accom.checkOut
      ? `${format(accom.checkIn, 'd. MMM', { locale: dateFnsLocale })} – ${format(accom.checkOut, 'd. MMM yyyy', { locale: dateFnsLocale })}`
      : null

  return (
    <article
      className={cn(
        'flex flex-col shrink-0 w-[min(100%,260px)] sm:w-[260px]',
        'bg-white rounded-2xl border border-slate-100 shadow-card',
        'overflow-hidden hover:shadow-card-hover transition-shadow duration-200',
        className
      )}
    >
      <button
        type="button"
        onClick={() => onView(accom)}
        className="relative aspect-[16/10] w-full bg-slate-100 overflow-hidden text-left"
      >
        <img
          src={imageSrc}
          alt={accom.name}
          className="absolute inset-0 h-full w-full object-cover"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgBroken(true)}
        />
        <div className="absolute top-2 right-2">
          <BookingRatingBadge
            rating={accom.rating}
            reviewCount={accom.reviewCount}
            size="sm"
          />
        </div>
      </button>

      <div className="flex flex-col flex-1 p-3 gap-2">
        <button
          type="button"
          onClick={() => onView(accom)}
          className="text-left font-semibold text-sm text-slate-900 leading-snug line-clamp-2 hover:text-sky-700 transition-colors"
        >
          {accom.name}
        </button>

        {dateLabel ? (
          <p className="text-[11px] text-slate-500 tabular-nums">{dateLabel}</p>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-2 pt-1">
          <div>
            <span className="text-lg font-bold text-slate-900">€{pricePerNight}</span>
            <span className="text-slate-400 text-xs">{t('hotels.perNight')}</span>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => onView(accom)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 text-slate-700 hover:border-sky-300 hover:text-sky-700 hover:bg-sky-50/80 transition-colors"
            >
              {t('hotels.view')}
            </button>
            <a
              href={accom.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer sponsored"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-sky-600 text-white hover:bg-sky-700 transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              {t('hotels.book')}
              <ExternalLink className="w-3 h-3" aria-hidden />
            </a>
          </div>
        </div>
      </div>
    </article>
  )
}
