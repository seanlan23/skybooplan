'use client'
import { useEffect, useState } from 'react'
import { Users, ChevronDown, Plus, Minus } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { cn } from '@/lib/utils'
import type { SearchState } from '@/store/useSearchStore'
import { fieldLabelClass, fieldShellClass, type SearchFieldVariant } from './searchBarFieldStyles'
import { useSearchUIStore } from '@/store/useSearchUIStore'

const CABIN_OPTIONS = [
  { value: 'economy', label: 'Economy' },
  { value: 'premium_economy', label: 'Prem. Economy' },
  { value: 'business', label: 'Business' },
  { value: 'first', label: 'First Class' },
] as const

function formatRoomCount(count: number): string {
  if (count === 1) return '1 soba'
  if (count === 2) return '2 sobi'
  if (count === 3 || count === 4) return `${count} sobe`
  return `${count} sob`
}

interface PassengerSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  variant?: SearchFieldVariant
  className?: string
}

export function PassengerSelector({
  open,
  onOpenChange,
  variant = 'default',
  className,
}: PassengerSelectorProps) {
  const {
    adults,
    children,
    rooms,
    cabinClass,
    searchMode,
    setPassengers,
    setRooms,
    setCabinClass,
    totalPassengers,
  } = useSearchStore()

  const [draftAdults, setDraftAdults] = useState(adults)
  const [draftChildren, setDraftChildren] = useState(children)
  const [draftRooms, setDraftRooms] = useState(rooms)
  const [draftCabinClass, setDraftCabinClass] = useState<SearchState['cabinClass']>(cabinClass)

  const isHotelsOnly = searchMode === 'hotels_only'
  const cabinLabel = CABIN_OPTIONS.find((o) => o.value === cabinClass)?.label ?? 'Economy'
  const triggerLabel = isHotelsOnly
    ? `${totalPassengers} pot. • ${formatRoomCount(rooms)}`
    : `${totalPassengers} pot.`

  useEffect(() => {
    if (open) {
      useSearchUIStore.getState().openSearch()
      setDraftAdults(adults)
      setDraftChildren(children)
      setDraftRooms(rooms)
      setDraftCabinClass(cabinClass)
    }
  }, [open, adults, children, rooms, cabinClass])

  function openPopover() {
    setDraftAdults(adults)
    setDraftChildren(children)
    setDraftRooms(rooms)
    setDraftCabinClass(cabinClass)
    onOpenChange(true)
  }

  function handleConfirm() {
    setPassengers(draftAdults, draftChildren)
    setRooms(draftRooms)
    if (!isHotelsOnly) {
      setCabinClass(draftCabinClass)
    }
    onOpenChange(false)
  }

  const isSky = variant === 'skyscanner'
  const paxLabel = isHotelsOnly ? 'Guests' : 'Travellers'

  return (
    <div className={cn('relative min-w-0 h-full w-full', className)}>
      {!isSky && (
        <label className={fieldLabelClass(variant)}>{isHotelsOnly ? 'Gostje' : 'Potniki'}</label>
      )}
      <button
        type="button"
        onClick={() => {
          if (!open) openPopover()
        }}
        aria-expanded={open}
        aria-haspopup="dialog"
        className={cn(
          isSky
            ? cn(fieldShellClass(variant, open), 'relative pr-8')
            : cn(
                'flex items-center gap-2 px-3 py-2.5 bg-white border rounded-2xl text-sm transition-all duration-200 whitespace-nowrap',
                open
                  ? isHotelsOnly
                    ? 'border-leaf-400 ring-2 ring-leaf-100'
                    : 'border-sky-400 ring-2 ring-sky-100'
                  : 'border-slate-200 hover:border-slate-300'
              )
        )}
      >
        {isSky ? (
          <>
            <span className={fieldLabelClass(variant)}>{paxLabel}</span>
            <span className="text-sm font-semibold text-slate-900 truncate">{triggerLabel}</span>
            {!isHotelsOnly && (
              <span className="text-[11px] text-slate-500 truncate">{cabinLabel}</span>
            )}
          </>
        ) : (
          <>
            <Users className="w-4 h-4 text-slate-400" />
            <span className="font-medium text-slate-800">{triggerLabel}</span>
            {!isHotelsOnly && (
              <span className="text-slate-400 text-xs hidden md:inline">· {cabinLabel}</span>
            )}
          </>
        )}
        <ChevronDown
          className={cn(
            'w-3.5 h-3.5 text-slate-400 transition-transform shrink-0',
            isSky ? 'absolute right-3 top-1/2 -translate-y-1/2' : '',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 z-50 bg-white border border-slate-200 rounded-2xl shadow-search p-4 w-64"
          role="dialog"
          aria-label={isHotelsOnly ? 'Izbira gostov in sob' : 'Izbira potnikov'}
        >
          <Counter
            label="Odrasli"
            sub="18+ let"
            value={draftAdults}
            min={1}
            max={9}
            onChange={(v) => setDraftAdults(v)}
          />
          <Counter
            label="Otroci"
            sub="0–17 let"
            value={draftChildren}
            min={0}
            max={8}
            onChange={(v) => setDraftChildren(v)}
          />
          {isHotelsOnly && (
            <Counter
              label="Sobe"
              sub="Število sob"
              value={draftRooms}
              min={1}
              max={8}
              onChange={setDraftRooms}
            />
          )}

          {!isHotelsOnly && (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs text-slate-500 mb-2 font-medium">Razred leta</p>
              <div className="grid grid-cols-2 gap-1.5">
                {CABIN_OPTIONS.map((o) => (
                  <button
                    key={o.value}
                    type="button"
                    onClick={() => setDraftCabinClass(o.value)}
                    className={cn(
                      'px-2 py-1.5 text-xs rounded-xl transition-all font-medium',
                      draftCabinClass === o.value
                        ? /* BACKUP: 'bg-sky-500 text-white' */ 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    )}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            className={cn(
              'w-full mt-3 py-2 text-white text-sm font-semibold rounded-xl transition-colors',
              /* BACKUP: isHotelsOnly ? 'bg-leaf-500 hover:bg-leaf-600' : 'bg-sky-500 hover:bg-sky-600' */
              'bg-sky-600 hover:bg-sky-700'
            )}
          >
            Potrdi
          </button>
        </div>
      )}
    </div>
  )
}

function Counter({ label, sub, value, min, max, onChange }: {
  label: string; sub: string; value: number; min: number; max: number; onChange: (v: number) => void
}) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div>
        <p className="text-sm font-medium text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:border-sky-300 hover:text-sky-500 disabled:opacity-30 transition-all"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="w-5 text-center font-semibold text-sm">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-200 hover:border-sky-300 hover:text-sky-500 disabled:opacity-30 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  )
}
