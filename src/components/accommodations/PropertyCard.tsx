'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Star, Wifi, Coffee, Waves } from 'lucide-react'
import { BookingRatingBadge } from '@/components/accommodations/BookingRatingBadge'
import { cleanCityForBookingApi, formatHotelDisplayLocation } from '@/lib/bookingLocation'
import { toHdBookingImageUrl } from '@/lib/hotelGallery'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'
import type { Accommodation } from '@/types/accommodation.types'

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80'

const SOURCE_STYLES = {
  booking: { label: 'Booking', bg: 'bg-blue-50 text-blue-700 border-blue-200' },
  airbnb: { label: 'Airbnb', bg: 'bg-rose-50 text-rose-700 border-rose-200' },
  hotels: { label: 'Hotels.com', bg: 'bg-amber-50 text-amber-700 border-amber-200' },
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  WiFi: <Wifi className="w-3 h-3" />,
  Bazen: <Waves className="w-3 h-3" />,
}

function isBreakfastAmenity(name: string): boolean {
  const n = name.toLowerCase()
  return n === 'zajtrk' || n === 'breakfast' || n.includes('breakfast')
}

interface PropertyCardProps {
  accom: Accommodation
  index: number
  onOpen: (accom: Accommodation) => void
  /** Širši stolpec brez levega filter panela — večja fotografija */
  wide?: boolean
}

export function PropertyCard({ accom, index, onOpen, wide = false }: PropertyCardProps) {
  const { t } = useTranslations()
  const src = SOURCE_STYLES[accom.source]
  const [imgBroken, setImgBroken] = useState(false)
  const imageSrc =
    imgBroken || !accom.imageUrl?.trim()
      ? PLACEHOLDER_IMAGE
      : toHdBookingImageUrl(accom.imageUrl)
  const reviewCount = Number.isFinite(accom.reviewCount) ? accom.reviewCount : 0
  const amenities = Array.isArray(accom.amenities) ? accom.amenities : []
  const pricePerNight = Number.isFinite(accom.pricePerNight) ? accom.pricePerNight : 0
  const totalPrice = Number.isFinite(accom.totalPrice) ? accom.totalPrice : 0
  const locationLabel =
    formatHotelDisplayLocation(accom.location) ||
    cleanCityForBookingApi(accom.location)

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => onOpen(accom)}
      className={cn(
        'flex flex-col h-full bg-white rounded-2xl border border-slate-100',
        wide ? 'min-h-[420px]' : 'min-h-[400px]',
        'shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-200',
        'cursor-pointer overflow-hidden group'
      )}
    >
      <div
        className={cn(
          'relative shrink-0 bg-slate-100 overflow-hidden w-full',
          wide ? 'aspect-[16/10] min-h-[200px] sm:min-h-[220px]' : 'h-48'
        )}
      >
        <img
          src={imageSrc}
          alt={accom.name}
          className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setImgBroken(true)}
        />
        <div className="absolute top-3 left-3">
          <span className={cn('px-2 py-0.5 text-xs font-semibold rounded-full border', src.bg)}>
            {src.label}
          </span>
        </div>
        {accom.isBeachfront && (
          <div className="absolute top-3 right-3">
            {/* BACKUP: bg-sky-500 */}
            <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-sky-600 text-white flex items-center gap-1">
              <Waves className="w-3 h-3" /> Ob morju
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-col flex-1 p-4 justify-between min-h-0">
        <div>
          <div className="flex items-start justify-between mb-1 gap-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-900 text-sm leading-snug line-clamp-2">
                {accom.name}
              </h3>
              {accom.stars ? (
                <div className="flex mt-1">
                  {Array.from({ length: accom.stars }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                  ))}
                </div>
              ) : null}
            </div>
            <BookingRatingBadge
              rating={accom.rating}
              reviewCount={reviewCount}
              size="sm"
            />
          </div>

          <p className="text-xs text-slate-400 mb-3 line-clamp-1">
            {accom.neighborhood ?? locationLabel}
          </p>

          {accom.hasBreakfast ? (
            <div className="flex items-center gap-1 mb-3 flex-wrap">
              <span className="inline-flex items-center gap-0.5 text-xs text-leaf-600 font-medium">
                <Coffee className="w-3 h-3" /> {t('common.breakfast')}
              </span>
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1 mb-3 min-h-[1.75rem]">
            {amenities.slice(0, 3).map((a) => (
              <span
                key={a}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-500 text-xs rounded-lg border border-slate-100"
              >
                {AMENITY_ICONS[a] ?? (isBreakfastAmenity(a) ? <Coffee className="w-3 h-3" /> : null)}
                {isBreakfastAmenity(a) ? t('common.breakfast') : a}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-end justify-between pt-3 mt-auto border-t border-slate-100">
          <div>
            <span className="text-xl font-bold text-slate-900">€{pricePerNight}</span>
            <span className="text-slate-400 text-sm">/noč</span>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">{t('propertyCard.total')}</p>
            <p className="text-sm font-semibold text-slate-700">€{totalPrice}</p>
          </div>
        </div>
      </div>
    </motion.article>
  )
}
