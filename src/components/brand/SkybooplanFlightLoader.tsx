'use client'

import Image from 'next/image'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

const PIXELS = {
  xs: 32,
  sm: 48,
  md: 80,
  lg: 112,
  xl: 144,
} as const

type Size = keyof typeof PIXELS

interface SkybooplanFlightLoaderProps {
  size?: Size
  className?: string
  label?: string
}

/** Skybooplan logotip z nežnim pulziranjem (fade in / out). */
export function SkybooplanFlightLoader({
  size = 'lg',
  className,
  label,
}: SkybooplanFlightLoaderProps) {
  const { t } = useTranslations()
  const px = PIXELS[size]
  const statusLabel = label ?? t('loading.searchingFlights')

  return (
    <div
      className={cn('flex flex-col items-center justify-center gap-3 w-full', className)}
      role="status"
      aria-live="polite"
      aria-label={statusLabel}
    >
      <div
        className="relative mx-auto shrink-0 skyboo-logo-pulse"
        style={{ width: px, height: px }}
      >
        <Image
          src="/logo-icon.png"
          alt=""
          width={px}
          height={px}
          className="h-full w-full object-contain pointer-events-none"
          priority
          unoptimized
        />
      </div>

      {label ? (
        <p className="text-sm text-slate-600 text-center max-w-xs">{label}</p>
      ) : null}
    </div>
  )
}
