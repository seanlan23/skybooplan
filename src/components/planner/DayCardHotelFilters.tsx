'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import type { RouteStayFilterState, RouteStayPriceSort, RouteStayRatingSort } from '@/lib/routeStayHotels'
import type { LocationAreaFilter } from '@/lib/hotelLocationArea'

interface DayCardHotelFiltersProps {
  filters: RouteStayFilterState
  onChange: (next: RouteStayFilterState) => void
}

function FilterBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors',
        active
          ? 'bg-blue-600 text-white border-blue-600'
          : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
      )}
    >
      {children}
    </button>
  )
}

const LOCATION_OPTIONS: { value: LocationAreaFilter; label: string }[] = [
  { value: 'all', label: 'Vse' },
  { value: 'center', label: 'Center' },
  { value: 'beach', label: 'Plaža' },
  { value: 'airport', label: 'Letališče' },
]

export function DayCardHotelFilters({ filters, onChange }: DayCardHotelFiltersProps) {
  const setPrice = (priceSort: RouteStayPriceSort) => {
    onChange({
      ...filters,
      priceSort: filters.priceSort === priceSort ? null : priceSort,
      ratingSort: null,
    })
  }

  const setRating = (ratingSort: RouteStayRatingSort) => {
    onChange({
      ...filters,
      ratingSort: filters.ratingSort === ratingSort ? null : ratingSort,
      priceSort: null,
    })
  }

  const setLocation = (locationFilter: LocationAreaFilter) => {
    onChange({ ...filters, locationFilter })
  }

  return (
    <div className="mb-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[11px] text-slate-600">
      <span className="font-medium text-slate-500 shrink-0">Razvrsti po:</span>
      <div className="flex flex-wrap items-center gap-1">
        <FilterBtn active={filters.priceSort === 'price_asc'} onClick={() => setPrice('price_asc')}>
          Cena ↑
        </FilterBtn>
        <FilterBtn
          active={filters.priceSort === 'price_desc'}
          onClick={() => setPrice('price_desc')}
        >
          Cena ↓
        </FilterBtn>
        <FilterBtn
          active={filters.ratingSort === 'rating_asc'}
          onClick={() => setRating('rating_asc')}
        >
          Ocena ↑
        </FilterBtn>
        <FilterBtn
          active={filters.ratingSort === 'rating_desc'}
          onClick={() => setRating('rating_desc')}
        >
          Ocena ↓
        </FilterBtn>
      </div>

      <span className="font-medium text-slate-500 shrink-0 ml-0.5">Lokacija:</span>
      <div className="flex flex-wrap items-center gap-1">
        {LOCATION_OPTIONS.map((opt) => (
          <FilterBtn
            key={opt.value}
            active={filters.locationFilter === opt.value}
            onClick={() => setLocation(opt.value)}
          >
            {opt.label}
          </FilterBtn>
        ))}
      </div>
    </div>
  )
}
