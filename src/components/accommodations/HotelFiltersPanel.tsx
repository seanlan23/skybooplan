'use client'

import { Coffee, Waves, Wifi, Star, Building2, Home, Castle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { AccomFilters, PropertyType } from '@/types/accommodation.types'

const PROPERTY_TYPES: { value: PropertyType; label: string; icon: typeof Building2 }[] = [
  { value: 'hotel', label: 'Hoteli', icon: Building2 },
  { value: 'apartment', label: 'Apartmaji', icon: Home },
  { value: 'villa', label: 'Vile', icon: Castle },
]

const GUEST_RATINGS = [
  { value: 9, label: '9+' },
  { value: 8, label: '8+' },
  { value: 7, label: '7+' },
] as const

const PRICE_SLIDER_MAX = 600

export interface HotelFiltersPanelProps {
  filters: AccomFilters
  onUpdate: <K extends keyof AccomFilters>(key: K, val: AccomFilters[K]) => void
  accent?: 'leaf' | 'sky'
}

export function HotelFiltersPanel({ filters, onUpdate, accent = 'leaf' }: HotelFiltersPanelProps) {
  /* BACKUP accentBtn: bg-leaf-500 / bg-sky-500 */
  const accentBtn = 'bg-orange-500 border-orange-500 text-white hover:bg-orange-600'
  const accentHover = accent === 'leaf' ? 'hover:border-leaf-200' : 'hover:border-sky-200'
  const accentRange = accent === 'leaf' ? 'accent-leaf-500' : 'accent-sky-500'
  const accentFocus = accent === 'leaf' ? 'focus:border-leaf-400' : 'focus:border-sky-400'

  function togglePropertyType(t: PropertyType) {
    const current = filters.propertyTypes
    onUpdate(
      'propertyTypes',
      current.includes(t) ? current.filter((x) => x !== t) : [...current, t]
    )
  }

  function toggleBool(key: 'hasBreakfast' | 'freeCancellation' | 'hasPool' | 'hasWifi') {
    onUpdate(key, filters[key] === true ? null : true)
  }

  return (
    <div className="space-y-6">
      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
          Cena na noč (€)
        </p>
        <div className="flex justify-between text-sm font-medium text-slate-700 mb-2">
          <span>€{filters.priceMin}</span>
          <span>€{filters.priceMax}</span>
        </div>
        <label className="block text-[11px] text-slate-400 mb-1">Minimum</label>
        <input
          type="range"
          min={0}
          max={PRICE_SLIDER_MAX}
          step={5}
          value={Math.min(filters.priceMin, filters.priceMax - 5)}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            onUpdate('priceMin', Math.min(v, filters.priceMax - 5))
          }}
          className={cn('w-full mb-3', accentRange)}
        />
        <label className="block text-[11px] text-slate-400 mb-1">Maksimum</label>
        <input
          type="range"
          min={0}
          max={PRICE_SLIDER_MAX}
          step={5}
          value={filters.priceMax}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10)
            onUpdate('priceMax', Math.max(v, filters.priceMin + 5))
          }}
          className={cn('w-full', accentRange)}
        />
      </section>

      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Zvezdice
        </p>
        <div className="flex flex-wrap gap-1.5">
          {[3, 4, 5].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => {
                const current = filters.stars
                onUpdate(
                  'stars',
                  current.includes(s) ? current.filter((x) => x !== s) : [...current, s]
                )
              }}
              className={cn(
                'px-3 py-1.5 text-xs rounded-xl border font-medium flex items-center gap-0.5 transition-all',
                filters.stars.includes(s)
                  ? accentBtn
                  : cn('bg-white border-slate-200 text-slate-600', accentHover)
              )}
            >
              {s}
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Tip namestitve
        </p>
        <div className="flex flex-col gap-1.5">
          {PROPERTY_TYPES.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => togglePropertyType(value)}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left',
                filters.propertyTypes.includes(value)
                  ? accentBtn
                  : cn('bg-white border-slate-200 text-slate-600', accentHover)
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {label}
            </button>
          ))}
        </div>
        <p className="text-[11px] text-slate-400 mt-1.5">Prazno = vsi tipi</p>
      </section>

      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Ocena gostov
        </p>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => onUpdate('minGuestRating', null)}
            className={cn(
              'px-3 py-1.5 text-xs rounded-xl border font-medium',
              filters.minGuestRating === null
                ? accentBtn
                : 'border-slate-200 text-slate-600'
            )}
          >
            Vse
          </button>
          {GUEST_RATINGS.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => onUpdate('minGuestRating', value)}
              className={cn(
                'px-3 py-1.5 text-xs rounded-xl border font-medium flex items-center gap-0.5',
                filters.minGuestRating === value
                  ? accentBtn
                  : cn('border-slate-200 text-slate-600', accentHover)
              )}
            >
              {label}
              <Star className="w-3 h-3 fill-current" />
            </button>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Dodatne ugodnosti
        </p>
        <div className="flex flex-col gap-1.5">
          <FilterChip
            active={filters.freeCancellation === true}
            onClick={() => toggleBool('freeCancellation')}
            label="Brezplačna odpoved"
            accentBtn={accentBtn}
            accentHover={accentHover}
          />
          <FilterChip
            active={filters.hasBreakfast === true}
            onClick={() => toggleBool('hasBreakfast')}
            label="Zajtrk"
            icon={<Coffee className="w-3.5 h-3.5" />}
            accentBtn={accentBtn}
            accentHover={accentHover}
          />
          <FilterChip
            active={filters.hasPool === true}
            onClick={() => toggleBool('hasPool')}
            label="Bazen"
            icon={<Waves className="w-3.5 h-3.5" />}
            accentBtn={accentBtn}
            accentHover={accentHover}
          />
          <FilterChip
            active={filters.hasWifi === true}
            onClick={() => toggleBool('hasWifi')}
            label="Wi-Fi"
            icon={<Wifi className="w-3.5 h-3.5" />}
            accentBtn={accentBtn}
            accentHover={accentHover}
          />
          <FilterChip
            active={filters.isBeachfront === true}
            onClick={() => onUpdate('isBeachfront', filters.isBeachfront === true ? null : true)}
            label="Ob morju"
            icon={<Waves className="w-3.5 h-3.5" />}
            accentBtn={accentBtn}
            accentHover={accentHover}
          />
        </div>
      </section>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  label,
  icon,
  accentBtn,
  accentHover,
}: {
  active: boolean
  onClick: () => void
  label: string
  icon?: React.ReactNode
  accentBtn: string
  accentHover: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border transition-all text-left',
        active ? accentBtn : cn('bg-white border-slate-200 text-slate-600', accentHover)
      )}
    >
      {icon}
      {label}
    </button>
  )
}

function cloneFilters(f: AccomFilters): AccomFilters {
  return {
    ...f,
    stars: [...f.stars],
    sources: [...f.sources],
    propertyTypes: [...f.propertyTypes],
  }
}

export { cloneFilters as cloneAccomFilters }
