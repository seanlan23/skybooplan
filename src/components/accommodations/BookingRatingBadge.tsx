'use client'

import { formatBookingGuestRating, normalizeBookingGuestRating } from '@/lib/hotelRating'
import { cn } from '@/lib/utils'

export interface BookingRatingBadgeProps {
  rating: number
  reviewCount: number
  /** sm = kartica; md = modal */
  size?: 'sm' | 'md'
  className?: string
}

export function BookingRatingBadge({
  rating,
  reviewCount,
  size = 'sm',
  className,
}: BookingRatingBadgeProps) {
  const normalized = normalizeBookingGuestRating(rating)
  if (normalized <= 0) return null

  const reviews = Number.isFinite(reviewCount) ? reviewCount : 0
  const label = formatBookingGuestRating(normalized)

  return (
    <div
      className={cn(
        'flex flex-col items-end gap-0.5 shrink-0 text-right',
        className
      )}
    >
      <span
        className={cn(
          'inline-flex items-center justify-center font-bold text-white leading-none bg-[#003580]',
          'rounded-[3px] shadow-sm',
          size === 'sm' ? 'min-w-[2.125rem] px-1.5 py-1 text-[13px]' : 'min-w-[2.75rem] px-2 py-1.5 text-base'
        )}
        aria-label={`Ocena gostov ${label} od 10`}
      >
        {label}
      </span>
      {reviews > 0 ? (
        <span
          className={cn(
            'text-slate-500 font-normal tabular-nums',
            size === 'sm' ? 'text-[11px] leading-tight' : 'text-xs'
          )}
        >
          ({reviews.toLocaleString('sl-SI')} ocen)
        </span>
      ) : null}
    </div>
  )
}
