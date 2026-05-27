'use client'

import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { AIPlannerTempoNotes, aiGenerateButtonClass } from '@/components/planner/AIPlannerTempoNotes'
import { useAIItinerary } from '@/hooks/useAIItinerary'
import { isAiPlannerPrefsValid, MIN_AI_WISHES_LENGTH } from '@/lib/aiPlannerTempo'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'

export function AISearchPlannerTab() {
  const { t } = useTranslations()
  const {
    travelTempo,
    setTravelTempo,
    specialRequestsText,
    setSpecialRequestsText,
    isGenerating,
    hotelsOnlyContext,
  } = usePlannerStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const { generate, generateHotelsOnly } = useAIItinerary()
  const [hint, setHint] = useState<string | null>(null)

  const aiPrefsValid = isAiPlannerPrefsValid(travelTempo, specialRequestsText)
  const hasAiContext = !!selectedFlight || !!hotelsOnlyContext
  const canGenerate = aiPrefsValid && !isGenerating

  async function handleGeneratePlan() {
    setHint(null)
    if (!aiPrefsValid) {
      setHint(t('planner.hintAiTabWishes'))
      return
    }
    if (!hasAiContext) {
      setHint(t('planner.hintAiTabNoContext'))
      return
    }
    if (hotelsOnlyContext) await generateHotelsOnly(hotelsOnlyContext)
    else await generate()
  }

  return (
    <div className="p-3 md:p-4 space-y-4">
      <AIPlannerTempoNotes
        tempo={travelTempo}
        onTempoChange={setTravelTempo}
        wishes={specialRequestsText}
        onWishesChange={(value) => {
          setSpecialRequestsText(value)
          if (hint) setHint(null)
        }}
      />

      <button
        type="button"
        onClick={handleGeneratePlan}
        disabled={!canGenerate}
        title={
          canGenerate
            ? undefined
            : !aiPrefsValid
              ? t('planner.titleDescribeWishes', { min: MIN_AI_WISHES_LENGTH })
              : t('planner.titleGenerating')
        }
        className={cn(
          aiGenerateButtonClass(canGenerate, false),
          'py-4 text-base rounded-xl',
          isGenerating && 'bg-sky-600 cursor-wait shadow-ai opacity-90 text-white'
        )}
      >
        {isGenerating ? (
          <>
            <svg className="animate-spin w-5 h-5 fill-none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            {t('common.generatingPlan')}
          </>
        ) : (
          <>
            <Sparkles className="w-5 h-5" />
            {t('planner.generatePlan')}
          </>
        )}
      </button>

      {hint && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
          {hint}
        </p>
      )}

      {!hasAiContext && !isGenerating && (
        <p className="text-xs text-slate-500 text-center px-2">
          {t('planner.hintAiTabFooter')}
        </p>
      )}
    </div>
  )
}
