'use client'
import { useRef, useEffect, useState, useMemo } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { useSearchStore, type TripType } from '@/store/useSearchStore'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

interface TripTypeDropdownProps {
  onDark?: boolean
}

export function TripTypeDropdown({ onDark = false }: TripTypeDropdownProps) {
  const { t } = useTranslations()
  const { tripType, setTripType } = useSearchStore()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  const options: { value: TripType; label: string }[] = useMemo(
    () => [
      { value: 'return', label: t('search.returnTrip') },
      { value: 'one_way', label: t('search.oneWay') },
    ],
    [t]
  )

  const current = options.find((o) => o.value === tripType) ?? options[0]

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm font-semibold transition-colors rounded-lg px-1 py-0.5',
          onDark
            ? 'text-white hover:text-sky-200'
            : 'text-slate-800 hover:text-sky-600',
          open && (onDark ? 'text-sky-200' : 'text-sky-600')
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {current.label}
        <ChevronDown
          className={cn(
            'w-4 h-4 transition-transform duration-200',
            onDark ? 'text-slate-300' : 'text-slate-500',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          role="listbox"
          className="absolute left-0 top-full mt-2 z-[300] min-w-[160px] bg-white border border-slate-200 rounded-xl shadow-lg py-1 overflow-hidden"
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              role="option"
              aria-selected={tripType === opt.value}
              onClick={() => {
                setTripType(opt.value)
                setOpen(false)
              }}
              className={cn(
                'w-full flex items-center justify-between gap-3 px-4 py-2.5 text-sm text-left transition-colors',
                tripType === opt.value
                  ? 'bg-orange-500 text-white font-semibold hover:bg-orange-600'
                  : 'text-slate-700 hover:bg-slate-50'
              )}
            >
              {opt.label}
              {tripType === opt.value && <Check className="w-4 h-4 text-white shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
