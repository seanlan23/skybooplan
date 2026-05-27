'use client'

import {
  AI_TRAVEL_TEMPO_OPTIONS,
  MIN_AI_WISHES_LENGTH,
  type AiTravelTempo,
} from '@/lib/aiPlannerTempo'
import { useTranslations } from '@/i18n/LocaleProvider'
import { cn } from '@/lib/utils'

const TEMPO_LABEL_KEYS: Record<AiTravelTempo, string> = {
  intensive: 'planner.tempoIntensive',
  relaxed: 'planner.tempoRelaxed',
  calm: 'planner.tempoCalm',
}

interface AIPlannerTempoNotesProps {
  tempo: AiTravelTempo | null | undefined
  onTempoChange: (tempo: AiTravelTempo) => void
  wishes: string
  onWishesChange: (value: string) => void
  compact?: boolean
}

export function AIPlannerTempoNotes({
  tempo,
  onTempoChange,
  wishes,
  onWishesChange,
  compact = false,
}: AIPlannerTempoNotesProps) {
  const { t } = useTranslations()
  const wishesValid = wishes.trim().length >= MIN_AI_WISHES_LENGTH
  const wishesChars = wishes.trim().length

  return (
    <div
      className={cn(
        'bg-white border border-slate-100 space-y-3',
        compact ? 'rounded-xl p-2.5 shadow-sm' : 'rounded-2xl p-4 shadow-search space-y-4'
      )}
    >
      <div>
        <p className={cn('font-semibold text-slate-600 mb-2', compact ? 'text-[10px]' : 'text-xs')}>
          {t('planner.travelTempo')} <span className="text-red-500">*</span>
        </p>
        <div className="flex flex-wrap gap-2">
          {AI_TRAVEL_TEMPO_OPTIONS.map((opt) => {
            const selected = tempo === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onTempoChange(opt.value)}
                className={cn(
                  'rounded-full font-semibold border transition-all',
                  compact ? 'px-2.5 py-1 text-[10px]' : 'px-3 py-1.5 text-xs',
                  selected
                    ? 'bg-sky-600 border-sky-600 text-white shadow-sm'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-sky-300 hover:text-sky-700'
                )}
              >
                {t(TEMPO_LABEL_KEYS[opt.value])}
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <label
          htmlFor="ai-planner-wishes"
          className={cn('block font-semibold text-slate-600 mb-1.5', compact ? 'text-[10px]' : 'text-xs')}
        >
          {t('planner.yourWishes')} <span className="text-red-500">*</span>
        </label>
        <textarea
          id="ai-planner-wishes"
          value={wishes}
          onChange={(e) => onWishesChange(e.target.value)}
          placeholder={t('planner.wishesPlaceholder')}
          rows={compact ? 2 : 3}
          className={cn(
            'w-full bg-white border border-slate-200 text-slate-800 placeholder:text-slate-400',
            'outline-none transition-all resize-y',
            compact
              ? 'px-2 py-2 rounded-lg text-xs min-h-[72px] focus:border-sky-400 focus:ring-2 focus:ring-sky-100'
              : 'px-3 py-2.5 rounded-xl text-sm min-h-[88px] hover:border-slate-300 focus:border-sky-400 focus:ring-2 focus:ring-sky-100',
            wishesValid && 'border-sky-200'
          )}
        />
        <p
          className={cn(
            'mt-1.5',
            compact ? 'text-[10px]' : 'text-[11px]',
            wishesValid ? 'text-slate-500' : 'text-amber-700'
          )}
        >
          {wishesValid
            ? t('planner.wishesThanks')
            : t('planner.wishesMinChars', {
                min: MIN_AI_WISHES_LENGTH,
                current: wishesChars,
              })}
        </p>
      </div>
    </div>
  )
}

export function aiGenerateButtonClass(active: boolean, compact: boolean): string {
  return cn(
    'relative z-10 w-full flex items-center justify-center gap-2 font-semibold transition-all duration-200 pointer-events-auto',
    compact ? 'text-xs rounded-xl px-3 py-2.5' : 'text-base rounded-2xl px-6 py-4 gap-3',
    active
      ? 'text-white bg-sky-600 hover:bg-sky-700 shadow-ai hover:shadow-lg'
      : 'text-slate-400 bg-slate-200 cursor-not-allowed shadow-none'
  )
}
