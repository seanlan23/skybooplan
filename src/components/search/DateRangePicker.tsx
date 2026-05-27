'use client'
import { useEffect, useState } from 'react'
import { format, addDays } from 'date-fns'
import { sl } from 'date-fns/locale'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { cn } from '@/lib/utils'
import { fieldLabelClass, fieldShellClass, type SearchFieldVariant } from './searchBarFieldStyles'
import { useSearchUIStore } from '@/store/useSearchUIStore'

const FLEX_OPTIONS = [0, 1, 2, 3, 5] as const

function MiniCalendar({
  month,
  year,
  selected,
  range,
  onSelect,
}: {
  month: number
  year: number
  selected: Date | null
  range: [Date | null, Date | null]
  onSelect: (d: Date) => void
}) {
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (Date | null)[] = []
  for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d))

  const [start, end] = range
  const today = new Date(); today.setHours(0,0,0,0)

  return (
    <div className="w-full">
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Pon','Tor','Sre','Čet','Pet','Sob','Ned'].map(d => (
          <div key={d} className="text-center text-xs text-slate-400 font-medium py-1">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />
          const isPast = date < today
          const isStart = start && date.toDateString() === start.toDateString()
          const isEnd = end && date.toDateString() === end.toDateString()
          const inRange = start && end && date > start && date < end
          return (
            <button
              key={i}
              onClick={() => !isPast && onSelect(date)}
              disabled={isPast}
              className={cn(
                'aspect-square flex items-center justify-center text-sm rounded-xl transition-all duration-150',
                isPast && 'opacity-30 cursor-not-allowed',
                !isPast && !isStart && !isEnd && 'hover:bg-sky-50 text-slate-700',
                (isStart || isEnd) &&
                  /* BACKUP: 'bg-sky-500 text-white font-semibold' */ 'bg-sky-600 text-white font-semibold',
                inRange && 'bg-sky-100 text-sky-700 rounded-none',
                isStart && end && 'rounded-l-xl rounded-r-none',
                isEnd && start && 'rounded-r-xl rounded-l-none',
              )}
            >
              {date.getDate()}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DateRangePickerProps {
  /** Vedno obseg od–do (način samo namestitve) */
  forceRange?: boolean
  label?: string
  variant?: SearchFieldVariant
  className?: string
}

export function DateRangePicker({
  forceRange = false,
  label: labelOverride,
  variant = 'default',
  className,
}: DateRangePickerProps = {}) {
  const {
    tripType,
    departureDate,
    returnDate,
    flexDays,
    setDepartureDate,
    setReturnDate,
    setFlexDays,
  } = useSearchStore()
  const isReturn = forceRange || tripType === 'return'
  const [open, setOpen] = useState(false)
  const [picking, setPicking] = useState<'dep' | 'ret'>('dep')
  const [viewMonth, setViewMonth] = useState(() => {
    const d = departureDate ?? new Date()
    return { month: d.getMonth(), year: d.getFullYear() }
  })

  function handleSelect(date: Date) {
    if (!isReturn || picking === 'dep') {
      setDepartureDate(date)
      if (!isReturn) {
        setReturnDate(null)
        setOpen(false)
        return
      }
      setPicking('ret')
      if (returnDate && date >= returnDate) setReturnDate(null)
      return
    }

    if (departureDate && date <= departureDate) {
      setDepartureDate(date)
      setPicking('ret')
    } else {
      setReturnDate(date)
      setOpen(false)
    }
  }

  const isSky = variant === 'skyscanner'

  const depLabel = departureDate
    ? flexDays > 0
      ? `${format(departureDate, 'd. MMM', { locale: sl })} ±${flexDays}`
      : format(departureDate, 'd. MMM yyyy', { locale: sl })
    : isSky
      ? 'Add date'
      : forceRange
        ? 'Od'
        : 'Datum odhoda'

  const retLabel = returnDate
    ? flexDays > 0
      ? `${format(returnDate, 'd. MMM', { locale: sl })} ±${flexDays}`
      : format(returnDate, isSky ? 'd. MMM yyyy' : 'd. MMM yyyy', { locale: sl })
    : isSky
      ? 'Add date'
      : forceRange
        ? 'Do'
        : 'Povratek'

  const dateLabel = labelOverride ?? (isReturn ? 'Datumi' : 'Datum odhoda')

  useEffect(() => {
    if (open) useSearchUIStore.getState().openSearch()
  }, [open])

  return (
    <div className={cn('relative min-w-0 h-full', isSky ? 'w-full' : 'flex-1', className)}>
      {!isSky && <label className={fieldLabelClass(variant)}>{dateLabel}</label>}
      <button
        type="button"
        onClick={() => {
          setPicking('dep')
          setOpen(!open)
        }}
        className={cn(
          isSky
            ? fieldShellClass(variant, open)
            : cn(
                'w-full flex items-center gap-2 px-3 py-2.5 bg-white border rounded-2xl text-sm transition-all duration-200 text-left',
                open ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300'
              )
        )}
      >
        {isSky ? (
          <div className="flex items-stretch gap-4 w-full min-w-0">
            <div className="flex flex-col min-w-0 text-left">
              <span className={fieldLabelClass(variant)}>Depart</span>
              <span
                className={cn(
                  'text-sm font-semibold text-slate-900 whitespace-nowrap',
                  !departureDate && 'text-slate-400 font-normal'
                )}
              >
                {depLabel}
              </span>
            </div>
            {isReturn && (
              <div
                className="flex flex-col min-w-0 text-left border-l border-slate-200 pl-4"
                onClick={(e) => {
                  e.stopPropagation()
                  setPicking('ret')
                  setOpen(true)
                }}
                role="presentation"
              >
                <span className={fieldLabelClass(variant)}>Return</span>
                <span
                  className={cn(
                    'text-sm font-semibold text-slate-900 whitespace-nowrap',
                    !returnDate && 'text-slate-400 font-normal'
                  )}
                >
                  {retLabel}
                </span>
              </div>
            )}
          </div>
        ) : (
          <>
            <CalendarDays className="w-4 h-4 text-slate-400 shrink-0" />
            <span className={departureDate ? 'text-slate-800 font-medium' : 'text-slate-400'}>
              {depLabel}
            </span>
            {isReturn && (
              <>
                <span className="text-slate-300">→</span>
                <span
                  className={returnDate ? 'text-slate-800 font-medium' : 'text-slate-400'}
                  onClick={(e) => {
                    e.stopPropagation()
                    setPicking('ret')
                    setOpen(true)
                  }}
                >
                  {retLabel}
                </span>
              </>
            )}
          </>
        )}
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-2 z-[200] bg-white border border-slate-200 rounded-2xl shadow-search p-4 w-72">
          {/* Nav */}
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setViewMonth(v => {
              const d = new Date(v.year, v.month - 1)
              return { month: d.getMonth(), year: d.getFullYear() }
            })} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="font-semibold text-sm text-slate-700 capitalize">
              {format(new Date(viewMonth.year, viewMonth.month), 'MMMM yyyy', { locale: sl })}
            </span>
            <button onClick={() => setViewMonth(v => {
              const d = new Date(v.year, v.month + 1)
              return { month: d.getMonth(), year: d.getFullYear() }
            })} className="p-1 hover:bg-slate-100 rounded-lg transition-colors">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {isReturn && (
            <div className="mb-1 flex gap-2 text-xs text-slate-500">
              <button type="button" onClick={() => setPicking('dep')} className={cn('font-medium', picking === 'dep' && 'text-sky-500')}>Odhod</button>
              <span>·</span>
              <button type="button" onClick={() => setPicking('ret')} className={cn('font-medium', picking === 'ret' && 'text-sky-500')}>Povratek</button>
            </div>
          )}

          <MiniCalendar
            month={viewMonth.month}
            year={viewMonth.year}
            selected={picking === 'dep' ? departureDate : returnDate}
            range={[departureDate, returnDate]}
            onSelect={handleSelect}
          />

          {/* Flex days */}
          <div className="mt-3 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-500 mb-2 font-medium">Fleksibilnost</p>
            <div className="flex gap-1.5">
              {FLEX_OPTIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => setFlexDays(d)}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg transition-all duration-150 font-medium',
                    flexDays === d
                      ? /* BACKUP: 'bg-sky-500 text-white' */ 'bg-orange-500 text-white hover:bg-orange-600'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  )}
                >
                  {d === 0 ? 'Točno' : `±${d}`}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
