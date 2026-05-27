'use client'
import { Sparkles, Pencil, Plus, X, GripVertical, CheckCircle2 } from 'lucide-react'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import { FlightTimeline } from './FlightTimeline'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useAIItinerary } from '@/hooks/useAIItinerary'
import { hasPlannerDestination } from '@/lib/itineraryPlannerContext'
import { DayCard } from './DayCard'
import { ItineraryTripSummaryCard } from './ItineraryTripSummaryCard'
import { AIPlannerPreferencesForm } from './AIPlannerPreferencesForm'
import { AIPlannerTempoNotes, aiGenerateButtonClass } from './AIPlannerTempoNotes'
import { MIN_AI_WISHES_LENGTH } from '@/lib/aiPlannerTempo'
import { SkeletonDayCard } from '@/components/ui/Skeleton'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/LocaleProvider'
import { formatNightsLabel } from '@/lib/formatNightsLabel'

interface AIPlannerProps {
  title?: string
  /** Polna širina levega stolpca (način Samo namestitve) */
  fillColumn?: boolean
  /** ~43% sidebar — kompaktna postavitev */
  compact?: boolean
  /** Ko uporabnik uspešno zažene «Generiraj načrt» (npr. prikaži zemljevid). */
  onGenerirajNacrt?: () => void
}

export default function AIPlanner({
  title,
  fillColumn = false,
  compact = false,
  onGenerirajNacrt,
}: AIPlannerProps) {
  const { t } = useTranslations()
  const resolvedTitle = title ?? t('planner.defaultTitle')
  const {
    itinerary,
    tripSummary,
    isGenerating,
    generatingProgress,
    mode,
    setMode,
    customLocations,
    addCustomLocation,
    removeCustomLocation,
    travelTempo,
    setTravelTempo,
    specialRequestsText,
    setSpecialRequestsText,
  } = usePlannerStore()
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)
  const searchMode = useSearchStore((s) => s.searchMode)
  const searchDestination = useSearchStore((s) => s.destination)
  const hotelDestination = useSearchStore((s) => s.hotelDestination)
  const { generate, generateHotelsOnly, generateManual } = useAIItinerary()
  const [customInput, setCustomInput] = useState('')
  const [aiPrefsHint, setAiPrefsHint] = useState<string | null>(null)

  /** Lokalno stanje zavihka: 'ai' | 'manual' (manual = store mode 'custom') */
  const activeTab = mode === 'custom' ? 'manual' : 'ai'

  function setActiveTab(tab: 'ai' | 'manual') {
    setMode(tab === 'manual' ? 'custom' : 'ai')
  }

  const hasAiContext = !!selectedFlight || !!hotelsOnlyContext
  const notesValid = specialRequestsText.trim().length >= MIN_AI_WISHES_LENGTH
  const canGenerateAi = notesValid && !isGenerating

  const hasDestination = hasPlannerDestination({
    searchMode,
    destination: searchDestination,
    hotelDestination,
    hotelsOnlyContext,
    selectedFlight,
  })

  const canGenerateManual = hasDestination

  async function handleGenerateAi() {
    setAiPrefsHint(null)
    if (!notesValid) {
      setAiPrefsHint(t('planner.hintWishesMin', { min: MIN_AI_WISHES_LENGTH }))
      return
    }
    if (!hasAiContext) {
      setAiPrefsHint(t('planner.hintSelectFlight'))
      return
    }
    onGenerirajNacrt?.()
    if (hotelsOnlyContext) await generateHotelsOnly(hotelsOnlyContext)
    else await generate()
  }

  async function handleGenerateManual() {
    await generateManual()
  }

  return (
    <aside
      className={cn(
        'w-full flex flex-col min-w-0 relative max-w-full',
        compact ? 'gap-2.5 z-10' : 'gap-4 shrink-0',
        fillColumn || compact ? 'lg:w-full' : 'lg:w-[42%]'
      )}
    >
      <div
        className={cn(
          'flex items-center justify-between gap-2',
          compact && 'flex-col items-stretch',
          !title && 'justify-end'
        )}
      >
        {title ? (
          <h2
            className={cn(
              'font-display font-bold text-slate-900 leading-tight',
              compact ? 'text-sm' : 'text-xl'
            )}
          >
            {resolvedTitle}
          </h2>
        ) : null}
        <div className={cn('flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg', compact && 'w-full')}>
          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={cn(
              'flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex-1',
              compact && 'py-1.5',
              !compact && 'gap-1.5 px-3 py-1.5 text-xs rounded-lg',
              activeTab === 'ai'
                ? /* BACKUP: 'bg-white text-slate-800 shadow-sm' */ 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Sparkles className="w-3.5 h-3.5" /> {t('planner.aiTab')}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('manual')}
            className={cn(
              'flex items-center justify-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-md transition-all flex-1',
              compact && 'py-1.5',
              !compact && 'gap-1.5 px-3 py-1.5 text-xs rounded-lg',
              activeTab === 'manual'
                ? /* BACKUP: 'bg-white text-slate-800 shadow-sm' */ 'bg-orange-500 text-white shadow-sm hover:bg-orange-600'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            <Pencil className="w-3.5 h-3.5" /> {t('planner.manualTab')}
          </button>
        </div>
      </div>

      {activeTab === 'ai' && (
        <div className={cn(compact && 'flex flex-col gap-2.5 shrink-0')}>
          {hotelsOnlyContext && (
            <div
              className={cn(
                'rounded-xl border border-leaf-200 bg-leaf-50 text-leaf-900',
                compact ? 'px-2.5 py-2 text-xs' : 'rounded-2xl px-4 py-3 text-sm'
              )}
            >
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-5 h-5 text-leaf-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-leaf-800">
                    {t('planner.hotelsOnly', {
                      destination: hotelsOnlyContext.destinationLabel,
                    })}
                  </p>
                  <p className="text-leaf-700 mt-0.5">
                    {t('planner.duration', {
                      nights: formatNightsLabel(hotelsOnlyContext.travelNights, t),
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {selectedFlight && !hotelsOnlyContext && (
            <>
              <div
                className={cn(
                  'rounded-xl border border-sky-200 bg-sky-50 text-sky-900',
                  compact ? 'px-2.5 py-2 text-xs' : 'rounded-2xl px-4 py-3 text-sm'
                )}
              >
                <div className="flex items-start gap-2">
                  <CheckCircle2
                    className={cn('text-sky-500 shrink-0 mt-0.5', compact ? 'w-4 h-4' : 'w-5 h-5')}
                  />
                  <div className="min-w-0">
                    <p className={cn('font-semibold text-sky-800', compact && 'text-[11px] leading-snug')}>
                      {selectedFlight.originLabel} ➔ {selectedFlight.destinationLabel}
                    </p>
                    <p className={cn('text-sky-700 mt-0.5', compact && 'text-[10px]')}>
                      {formatNightsLabel(selectedFlight.travelNights, t)}
                      {!selectedFlight.isRoundTrip && (
                        <span className="text-sky-600/80"> {t('planner.oneWay')}</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
              {!compact ? <FlightTimeline flight={selectedFlight} /> : null}
            </>
          )}

          <AIPlannerTempoNotes
            compact={compact}
            tempo={travelTempo}
            onTempoChange={setTravelTempo}
            wishes={specialRequestsText}
            onWishesChange={(value) => {
              setSpecialRequestsText(value)
              if (aiPrefsHint) setAiPrefsHint(null)
            }}
          />

          <button
            type="button"
            onClick={handleGenerateAi}
            disabled={!canGenerateAi}
            title={
              canGenerateAi
                ? undefined
                : t('planner.titleDescribeWishes', { min: MIN_AI_WISHES_LENGTH })
            }
            className={cn(
              aiGenerateButtonClass(canGenerateAi, compact),
              isGenerating && 'bg-sky-600 cursor-wait shadow-ai opacity-90 text-white'
            )}
          >
            {isGenerating ? (
              <>
                <svg className={cn('animate-spin fill-none', compact ? 'w-4 h-4' : 'w-5 h-5')} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('common.generating')}
              </>
            ) : (
              <>
                <Sparkles className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                {t('planner.generatePlan')}
              </>
            )}
          </button>

          {aiPrefsHint && (
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-2.5 py-2 text-center">
              {aiPrefsHint}
            </p>
          )}

          {!hasAiContext && !isGenerating && !aiPrefsHint && (
            <p className="text-xs text-slate-400 text-center px-2">
              {t('planner.hintNoContext')}
            </p>
          )}

          {compact && isGenerating && itinerary.length === 0 && (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonDayCard key={i} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'manual' && (
        <div className="space-y-3">
          <AIPlannerPreferencesForm compact={compact} />

          <div className="flex gap-2">
            <input
              value={customInput}
              onChange={(e) => setCustomInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && customInput.trim()) {
                  addCustomLocation(customInput.trim())
                  setCustomInput('')
                }
              }}
              placeholder={t('planner.addPlacePlaceholder')}
              className="flex-1 px-3 py-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-sky-400 focus:ring-2 focus:ring-sky-100 transition-all"
            />
            {/* BACKUP gumb +: className="px-3 py-2.5 bg-sky-500 text-white rounded-xl hover:bg-sky-600" */}
            <button
              type="button"
              onClick={() => {
                if (customInput.trim()) {
                  addCustomLocation(customInput.trim())
                  setCustomInput('')
                }
              }}
              className="px-3 py-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2">
            <AnimatePresence>
              {customLocations.map((loc, i) => (
                <motion.div
                  key={loc}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="flex items-center gap-2 p-3 bg-white border border-slate-100 rounded-xl"
                >
                  <GripVertical className="w-4 h-4 text-slate-300 cursor-grab" />
                  <div className="w-5 h-5 rounded-full bg-sky-50 text-sky-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <span className="flex-1 text-sm font-medium text-slate-700">{loc}</span>
                  <button
                    type="button"
                    onClick={() => removeCustomLocation(loc)}
                    className="p-1 hover:text-red-500 transition-colors text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <button
            type="button"
            onClick={handleGenerateManual}
            disabled={isGenerating || !canGenerateManual}
            className={cn(
              'relative z-10 w-full flex items-center justify-center gap-2 text-white font-semibold transition-all duration-200 pointer-events-auto',
              compact ? 'text-xs rounded-xl px-3 py-2.5' : 'text-base rounded-2xl px-6 py-4 gap-3',
              isGenerating
                ? /* BACKUP: 'bg-gradient-to-r from-sky-600 to-sky-500 ...' */ 'bg-sky-600 cursor-wait shadow-ai opacity-90'
                : canGenerateManual
                  ? /* BACKUP: 'bg-gradient-to-r from-sky-500 to-sky-600 hover:from-sky-600 ...' */ 'bg-sky-600 hover:bg-sky-700 shadow-ai hover:shadow-lg'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            )}
          >
            {isGenerating ? (
              <>
                <svg className={cn('animate-spin fill-none', compact ? 'w-4 h-4' : 'w-5 h-5')} viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {t('common.generating')}
              </>
            ) : (
              <>
                <Sparkles className={compact ? 'w-4 h-4' : 'w-5 h-5'} />
                {itinerary.length > 0 ? t('planner.edit') : t('planner.generate')}
              </>
            )}
          </button>

          {!canGenerateManual && !isGenerating && (
            <p className="text-xs text-slate-400 text-center">
              {t('planner.manualHint')}
            </p>
          )}
        </div>
      )}

      <AnimatePresence>
        {isGenerating && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden shrink-0"
          >
            <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
              {/* BACKUP progress: from-leaf-400 to-leaf-600 */}
              <motion.div
                className="h-full bg-gradient-to-r from-sky-500 to-sky-600 rounded-full"
                animate={{ width: `${generatingProgress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            <p className="text-xs text-slate-400 mt-1 text-center">
              {activeTab === 'manual' ? t('planner.progressManual') : t('planner.progressAi')}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {!compact && isGenerating && itinerary.length === 0 && (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonDayCard key={i} />
          ))}
        </div>
      )}

      {itinerary.length > 0 && (
        <div className={cn('space-y-2', compact && 'pr-0.5')}>
          {itinerary.map((day) => (
            <DayCard key={`day-${day.day}-${day.title}`} day={day} index={day.day - 1} />
          ))}
          {tripSummary ? <ItineraryTripSummaryCard summary={tripSummary} /> : null}
        </div>
      )}
    </aside>
  )
}
