'use client'

import type { DayActivity } from '@/lib/dayPlanActivities'

const VARIANT_CONF = {
  morning: { border: 'border-blue-500', bg: 'bg-slate-50', emoji: '⏰' },
  afternoon: { border: 'border-amber-500', bg: 'bg-slate-50', emoji: '🌤' },
  evening: { border: 'border-indigo-500', bg: 'bg-slate-50', emoji: '🌙' },
} as const

export function AiPlanTimeBlock({
  variant,
  label,
  activities,
}: {
  variant: keyof typeof VARIANT_CONF
  label: string
  activities: DayActivity[]
}) {
  const conf = VARIANT_CONF[variant]
  if (activities.length === 0) return null

  return (
    <div>
      <div
        className={`flex items-center gap-2 border-l-[3px] ${conf.border} ${conf.bg} px-3 py-2 rounded-r-md`}
      >
        <span aria-hidden className="text-base leading-none">
          {conf.emoji}
        </span>
        <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
          {label}
        </span>
      </div>
      <ul className="mt-2 space-y-2 pl-1">
        {activities.map((a, i) => (
          <li key={`${a.name}-${i}`} className="flex gap-2 text-sm leading-relaxed">
            <span aria-hidden className="text-slate-400 mt-1">
              •
            </span>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-slate-900">{a.name}</span>
              {a.priceLabel ? (
                <span className="text-slate-500"> ({a.priceLabel})</span>
              ) : null}
              {a.description ? (
                <>
                  {a.name ? <span className="text-slate-700">: </span> : null}
                  <span className="text-slate-700">{a.description}</span>
                </>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
