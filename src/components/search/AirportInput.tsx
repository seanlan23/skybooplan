'use client'

import { useRef, useState, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin, X, Search, Building2 } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { useAirportSearch } from '@/hooks/useAirportSearch'
import { formatAllAirportsLabel } from '@/lib/airportSuggestions'
import { cn } from '@/lib/utils'
import type { Airport } from '@/types/flight.types'
import {
  fieldLabelClass,
  fieldShellClass,
  type SearchFieldVariant,
} from './searchBarFieldStyles'
import { useTranslations } from '@/i18n/LocaleProvider'

interface AirportInputProps {
  role: 'origin' | 'destination'
  placeholder?: string
  label?: string
  variant?: SearchFieldVariant
  className?: string
}

function airportOptionKey(airport: Airport): string {
  return airport.isAllAirports ? `metro-${airport.iata}` : airport.iata
}

function chipLabel(airport: Airport, allLabel: string): string {
  if (airport.isAllAirports) {
    return formatAllAirportsLabel(airport.city, airport.iata, allLabel)
  }
  return airport.city
}

function optionTitle(airport: Airport, allLabel: string): string {
  if (airport.isAllAirports) {
    return formatAllAirportsLabel(airport.city, airport.iata, allLabel)
  }
  return airport.name
}

export function AirportInput({
  role,
  placeholder,
  label: labelOverride,
  variant = 'default',
  className,
}: AirportInputProps) {
  const { t } = useTranslations()
  const allAirportsLabel = t('airports.all')
  const { origins, destination, addOrigin, removeOrigin, setDestination } = useSearchStore()
  const { query, setQuery, results, isLoading } = useAirportSearch()
  const [focused, setFocused] = useState(false)
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 280 })
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const selected = role === 'destination' ? (destination ? [destination] : []) : origins
  const label =
    labelOverride ??
    (variant === 'skyscanner'
      ? role === 'origin'
        ? t('searchFields.from')
        : t('searchFields.to')
      : role === 'origin'
        ? t('searchFields.from')
        : t('searchFields.to'))
  const ph =
    placeholder ??
    (variant === 'skyscanner'
      ? t('searchFields.cityOrAirport')
      : role === 'origin'
        ? t('searchFields.addAirport')
        : t('searchFields.whereToFly'))
  const isSky = variant === 'skyscanner'
  const showDropdown = focused && query.trim().length >= 2

  useEffect(() => {
    setDropdownOpen(showDropdown)
  }, [showDropdown])

  useLayoutEffect(() => {
    if (!dropdownOpen || !rootRef.current) return
    const update = () => {
      const r = rootRef.current?.getBoundingClientRect()
      if (!r) return
      setMenuRect({
        top: r.bottom + 6,
        left: r.left,
        width: Math.max(r.width, 280),
      })
    }
    update()
    window.addEventListener('scroll', update, true)
    window.addEventListener('resize', update)
    return () => {
      window.removeEventListener('scroll', update, true)
      window.removeEventListener('resize', update)
    }
  }, [dropdownOpen, results.length, query])

  function select(airport: Airport) {
    if (role === 'origin') addOrigin(airport)
    else setDestination(airport)
    setQuery('')
    setFocused(false)
    setDropdownOpen(false)
  }

  function remove(iata: string) {
    if (role === 'origin') removeOrigin(iata)
    else setDestination(null)
  }

  function clearSelection(e: React.MouseEvent) {
    e.stopPropagation()
    if (role === 'origin' && origins.length) removeOrigin(origins[0].iata)
    else if (destination) setDestination(null)
    setQuery('')
    inputRef.current?.focus()
  }

  const primary = selected[0]
  const showCompact = isSky && primary && !focused && query.length === 0

  const dropdown = dropdownOpen ? (
    <div
      className="bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[min(320px,50vh)] overflow-y-auto"
      style={{
        position: 'fixed',
        top: menuRect.top,
        left: menuRect.left,
        width: menuRect.width,
        zIndex: 9999,
      }}
      role="listbox"
    >
      {isLoading && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-500">{t('search.searchingAirports')}</div>
      )}
      {!isLoading && results.length === 0 && (
        <div className="px-4 py-3 text-sm text-slate-500">
          Ni zadetkov. Poskusi z drugačnim imenom ali kodo (npr. LJU).
        </div>
      )}
      {results.map((airport, index) => {
        const isMetro = airport.isAllAirports
        const prevIsMetro = index > 0 && results[index - 1]?.isAllAirports
        const showDivider = !isMetro && prevIsMetro

        return (
          <div key={airportOptionKey(airport)}>
            {index === 0 && isMetro && (
              <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50/80">
                {t('airports.city')}
              </div>
            )}
            {showDivider && (
              <>
                <div className="border-t border-slate-100" aria-hidden />
                <div className="px-4 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400 bg-slate-50/80">
                  {t('airports.airport')}
                </div>
              </>
            )}
            <button
              type="button"
              role="option"
              onMouseDown={(e) => {
                e.preventDefault()
                select(airport)
              }}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 transition-colors text-left',
                isMetro
                  ? 'bg-sky-50/90 hover:bg-sky-100 border-b border-sky-100'
                  : 'hover:bg-sky-50'
              )}
            >
              <span
                className={cn(
                  'font-mono font-bold text-sm w-10 shrink-0',
                  isMetro ? 'text-leaf-600' : 'text-sky-600'
                )}
              >
                {airport.iata}
              </span>
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-sm truncate',
                    isMetro ? 'font-semibold text-slate-900' : 'font-medium text-slate-800'
                  )}
                >
                  {optionTitle(airport, allAirportsLabel)}
                </p>
                <p className="text-xs text-slate-500">
                  {isMetro
                    ? `${allAirportsLabel} · ${airport.country}`
                    : `${airport.city}, ${airport.country}`}
                </p>
              </div>
              {isMetro ? (
                <Building2 className="w-4 h-4 text-leaf-500 shrink-0" />
              ) : (
                <Search className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
            </button>
          </div>
        )
      })}
    </div>
  ) : null

  return (
    <div
      ref={rootRef}
      data-skip-search-overlay
      className={cn('relative flex-1 min-w-0 h-full', className)}
    >
      {!isSky && <label className={fieldLabelClass(variant)}>{label}</label>}
      <div
        className={fieldShellClass(variant, focused)}
        onClick={() => inputRef.current?.focus()}
        role="presentation"
      >
        {isSky && <span className={fieldLabelClass(variant)}>{label}</span>}

        {showCompact ? (
          <button
            type="button"
            className="flex items-center gap-2 min-w-0 mt-0.5 w-full text-left"
            onClick={() => {
              setFocused(true)
              inputRef.current?.focus()
            }}
          >
            <span className="text-lg font-bold text-slate-900 tracking-tight tabular-nums shrink-0">
              {primary.iata}
            </span>
            <span className="text-xs text-slate-500 truncate font-normal">{chipLabel(primary, allAirportsLabel)}</span>
            <span
              role="button"
              tabIndex={0}
              className="ml-auto shrink-0 p-0.5 text-slate-400 hover:text-slate-600"
              onClick={clearSelection}
              onKeyDown={(e) => e.key === 'Enter' && clearSelection(e as unknown as React.MouseEvent)}
              aria-label="Odstrani"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          </button>
        ) : (
          <div className={cn('flex flex-wrap gap-1.5 items-center min-w-0', isSky && 'mt-0.5')}>
            {!isSky && <MapPin className="w-4 h-4 text-slate-400 shrink-0" />}
            {!isSky && (
              <AnimatePresence>
                {selected.map((a) => (
                  <motion.span
                    key={airportOptionKey(a)}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    className={cn(
                      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-sm font-medium max-w-full',
                      a.isAllAirports
                        ? 'bg-leaf-50 text-leaf-800 border border-leaf-200'
                        : 'bg-sky-50 text-sky-700 border border-sky-200'
                    )}
                  >
                    <span className="font-mono font-bold text-xs shrink-0">{a.iata}</span>
                    <span
                      className={cn(
                        'text-xs truncate',
                        a.isAllAirports ? 'text-leaf-700 font-semibold' : 'text-sky-500 hidden sm:inline'
                      )}
                    >
                      {chipLabel(a, allAirportsLabel)}
                    </span>
                    <button type="button" onClick={(e) => { e.stopPropagation(); remove(a.iata) }}>
                      <X className="w-3 h-3" />
                    </button>
                  </motion.span>
                ))}
              </AnimatePresence>
            )}
            {(role === 'destination' ? !destination : origins.length < 5) && (
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setFocused(true)}
                onBlur={() => {
                  setTimeout(() => {
                    setFocused(false)
                    setDropdownOpen(false)
                  }, 200)
                }}
                placeholder={selected.length === 0 ? ph : '+'}
                autoComplete="off"
                className={cn(
                  'flex-1 min-w-[80px] outline-none bg-transparent placeholder:text-slate-400',
                  isSky
                    ? 'text-base font-semibold text-slate-900 placeholder:font-normal placeholder:text-sm'
                    : 'text-sm text-slate-800'
                )}
              />
            )}
            {isLoading && (
              <div className="w-3.5 h-3.5 border-2 border-sky-400 border-t-transparent rounded-full animate-spin shrink-0" />
            )}
          </div>
        )}
      </div>

      {typeof document !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  )
}
