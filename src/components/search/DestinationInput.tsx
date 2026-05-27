'use client'

import { useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Search } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useBookingDestinationSearch } from '@/hooks/useBookingDestinationSearch'
import { formatBookingDestinationLabel } from '@/lib/bookingDestinations'
import { cn } from '@/lib/utils'
import type { BookingDestination } from '@/types/booking.types'
import { useTranslations } from '@/i18n/LocaleProvider'

interface DestinationInputProps {
  placeholder?: string
  label?: string
}

export function DestinationInput({
  placeholder = 'Kam potuješ?',
  label = 'Destinacija',
}: DestinationInputProps) {
  const { t } = useTranslations()
  const { hotelDestination, setHotelDestination } = useSearchStore()
  const { query, setQuery, results, isLoading } = useBookingDestinationSearch()
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const showDropdown = focused && query.length >= 2

  function select(dest: BookingDestination) {
    setHotelDestination(dest)
    setQuery('')
    setFocused(false)
  }

  function clear() {
    setHotelDestination(null)
  }

  return (
    <div className="relative flex-1 min-w-0">
      <label className="block text-xs font-semibold text-slate-500 mb-1 px-1">{label}</label>
      <div
        className={cn(
          'flex flex-wrap gap-1.5 items-center min-h-[46px] px-3 py-2 bg-white border rounded-2xl transition-all duration-200 cursor-text',
          focused ? 'border-leaf-400 ring-2 ring-leaf-100' : 'border-slate-200 hover:border-slate-300'
        )}
        onClick={() => inputRef.current?.focus()}
      >
        <MapPin className="w-4 h-4 text-leaf-500 shrink-0" />
        <AnimatePresence>
          {hotelDestination && (
            <motion.span
              key={hotelDestination.destId}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-leaf-50 text-leaf-800 border border-leaf-200 rounded-full text-sm font-medium max-w-full"
            >
              <span className="truncate">{formatBookingDestinationLabel(hotelDestination)}</span>
              <button type="button" onClick={(e) => { e.stopPropagation(); clear() }}>
                <X className="w-3 h-3 shrink-0" />
              </button>
            </motion.span>
          )}
        </AnimatePresence>
        {!hotelDestination && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setTimeout(() => setFocused(false), 200)}
            placeholder={placeholder}
            className="flex-1 min-w-[120px] outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent"
          />
        )}
        {isLoading && (
          <div className="w-3.5 h-3.5 border-2 border-leaf-500 border-t-transparent rounded-full animate-spin shrink-0" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-2 z-[200] bg-white border border-slate-200 rounded-2xl shadow-lg overflow-hidden max-h-72 overflow-y-auto">
          {isLoading && (
            <div className="px-4 py-3 text-sm text-slate-500">{t('search.searchingDestinations')}</div>
          )}
          {!isLoading && results.length === 0 && (
            <div className="px-4 py-3 text-sm text-slate-500">
              Ni zadetkov. Vpiši ime mesta (npr. Tuzla, Bangkok).
            </div>
          )}
          {results.map((dest) => (
            <button
              key={`${dest.destId}-${dest.searchType}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                select(dest)
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-leaf-50 transition-colors text-left border-b border-slate-50 last:border-0"
            >
              <MapPin className="w-4 h-4 text-leaf-600 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-800 leading-snug">{dest.label}</p>
                <p className="text-xs text-slate-500 capitalize">{dest.destType}</p>
              </div>
              <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
