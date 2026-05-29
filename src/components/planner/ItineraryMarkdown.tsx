'use client'

import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

type TimeOfDayKind = 'dopoldan' | 'popoldan' | 'vecer'

const TIME_OF_DAY_STYLES: Record<
  TimeOfDayKind,
  { border: string; emoji: string }
> = {
  dopoldan: { border: 'border-l-[#3b82f6]', emoji: '⏰' },
  popoldan: { border: 'border-l-[#f59e0b]', emoji: '🌤' },
  vecer: { border: 'border-l-[#6366f1]', emoji: '🌙' },
}

function parseTimeOfDayHeading(
  text: string,
  labels: { morning: string; afternoon: string; evening: string }
): {
  kind: TimeOfDayKind | null
  label: string
} {
  const raw = text.replace(/^###\s*/, '').trim()
  const lower = raw.toLowerCase()
  if (
    lower.includes('dopoldan') ||
    lower.includes('morning') ||
    lower.includes('jutro') ||
    lower.includes('vormittag')
  ) {
    return { kind: 'dopoldan', label: raw.replace(/^⏰\s*/, '').trim() || labels.morning }
  }
  if (
    lower.includes('popoldan') ||
    lower.includes('afternoon') ||
    lower.includes('poslijepodne') ||
    lower.includes('nachmittag')
  ) {
    return { kind: 'popoldan', label: raw.replace(/^🌤\s*/, '').trim() || labels.afternoon }
  }
  if (
    lower.includes('večer') ||
    lower.includes('vecer') ||
    lower.includes('evening') ||
    lower.includes('abend')
  ) {
    return { kind: 'vecer', label: raw.replace(/^🌙\s*/, '').trim() || labels.evening }
  }
  return { kind: null, label: raw }
}

function isTravelHackLine(trimmed: string): boolean {
  return (
    /travel\s*hack/i.test(trimmed) ||
    /^💡/.test(trimmed) ||
    /\*\*💡/.test(trimmed)
  )
}

function renderTravelHackContent(trimmed: string) {
  const cleaned = trimmed
    .replace(/^\*\*💡\s*travel\s*hack:?\*\*/i, '')
    .replace(/^💡\s*travel\s*hack:?\s*/i, '')
    .replace(/^\*\*💡\*\*:?\s*/i, '')
    .trim()

  const boldParts = cleaned.split(/\*\*(.+?)\*\*/g)
  if (boldParts.length > 1) {
    return boldParts.map((part, j) =>
      j % 2 === 1 ? (
        <strong key={j} className="font-semibold text-amber-950">
          {part}
        </strong>
      ) : (
        <span key={j}>{part}</span>
      )
    )
  }
  return cleaned || trimmed
}

/** Preprost prikaz Markdown odstavkov iz AI (brez zunanjih odvisnosti). */
export function ItineraryMarkdown({ text }: { text: string }) {
  const { t } = useTranslations()
  const timeLabels = {
    morning: t('dayCard.morning'),
    afternoon: t('dayCard.afternoon'),
    evening: t('dayCard.evening'),
  }
  const lines = text.split('\n')

  return (
    <div className="text-sm text-slate-600 leading-[1.6] space-y-2.5">
      {lines.map((line, i) => {
        const trimmed = line.trimEnd()
        if (!trimmed) return <div key={i} className="h-2" />

        if (trimmed.startsWith('### ')) {
          const { kind, label } = parseTimeOfDayHeading(trimmed, timeLabels)
          if (kind) {
            const style = TIME_OF_DAY_STYLES[kind]
            return (
              <div
                key={i}
                className={cn(
                  'flex items-center gap-2 pl-3 py-1.5 mt-3 first:mt-0',
                  'border-l-[3px] rounded-r-md bg-slate-50/60',
                  style.border
                )}
              >
                <span className="text-base leading-none" aria-hidden>
                  {style.emoji}
                </span>
                <span className="text-xs font-bold uppercase tracking-wide text-slate-700">
                  {label}
                </span>
              </div>
            )
          }
          return (
            <h4
              key={i}
              className="text-xs font-bold uppercase tracking-wide text-slate-500 mt-3 first:mt-0"
            >
              {label}
            </h4>
          )
        }

        if (isTravelHackLine(trimmed)) {
          return (
            <div
              key={i}
              className="bg-[#fffbeb] border-l-4 border-[#f59e0b] rounded-r-lg px-3.5 py-3 my-3 text-sm text-amber-950 leading-[1.6]"
            >
              <span className="font-bold text-amber-800">💡 {t('dayCard.travelHack')}: </span>
              {renderTravelHackContent(trimmed)}
            </div>
          )
        }

        if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
          return (
            <p
              key={i}
              className="pl-3 text-[0.9375rem] text-slate-600 leading-[1.6] before:content-['•'] before:mr-2 before:text-slate-400"
            >
              {trimmed.slice(2)}
            </p>
          )
        }

        const boldParts = trimmed.split(/\*\*(.+?)\*\*/g)
        if (boldParts.length > 1) {
          return (
            <p key={i} className="leading-[1.6]">
              {boldParts.map((part, j) =>
                j % 2 === 1 ? (
                  <strong key={j} className="font-semibold text-slate-800">
                    {part}
                  </strong>
                ) : (
                  <span key={j}>{part}</span>
                )
              )}
            </p>
          )
        }

        return (
          <p key={i} className="leading-[1.6]">
            {trimmed}
          </p>
        )
      })}
    </div>
  )
}
