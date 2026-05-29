'use client'
import { parseISO, startOfDay } from 'date-fns'
import { reanchorItineraryToArrival } from '@/lib/itineraryDates'
import { computeStayWindowForFirstLocation } from '@/lib/itineraryStay'
import {
  buildCombinedSpecialRequests,
  buildItineraryPlannerInput,
  computeTravelNightsForPlanner,
  getPlannerDestinationLabel,
  resolvePlannerArrivalIso,
} from '@/lib/itineraryPlannerContext'
import { buildAiPlannerSubmissionPayload } from '@/lib/aiPlannerSubmission'
import {
  aiTravelTempoToPromptLabel,
  isAiPlannerPrefsValid,
} from '@/lib/aiPlannerTempo'
import {
  resolveDailyBudgetForPrompt,
  travelStyleToPromptLabel,
} from '@/lib/plannerPreferences'
import type { ItineraryPlannerInput } from '@/lib/itineraryPrompt'
import { useAccomStore } from '@/store/useAccomStore'
import { usePlannerStore } from '@/store/usePlannerStore'
import { useSearchStore } from '@/store/useSearchStore'
import { useSelectedFlightStore } from '@/store/useSelectedFlightStore'
import type {
  HotelsOnlyContext,
  ItineraryCompletenessWarning,
} from '@/store/usePlannerStore'
import { sanitizeHotelLocation } from '@/lib/bookingLocation'
import {
  assessItineraryCompleteness,
  logIncompleteItineraryWarning,
} from '@/lib/itineraryCompleteness'
import { normalizeItineraryDays, syncItineraryDayLabels } from '@/lib/normalizeItinerary'
import { normalizeTripSummary } from '@/lib/itineraryPrompt'
import type { ItineraryDay, ItineraryTripSummary } from '@/types/itinerary.types'
import { useItineraryHotelsStore } from '@/store/useItineraryHotelsStore'
import { useLocaleStore } from '@/store/useLocaleStore'
import { resetItineraryHotelCache } from '@/hooks/useItineraryCityHotels'

type StreamCallbacks = {
  onDone: (
    days: ItineraryDay[],
    tripSummary: ItineraryTripSummary | null,
    completeness: ItineraryCompletenessWarning | null
  ) => void
  onPartial?: (days: ItineraryDay[]) => void
}

async function consumeItineraryStream(
  res: Response,
  callbacks: StreamCallbacks,
  setProgress: (n: number) => void,
  locale?: string
) {
  const { onDone, onPartial } = callbacks
  if (!res.body) throw new Error('No response body')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let sseBuffer = ''
  let progress = 5
  const progressInterval = setInterval(() => {
    progress = Math.min(progress + 3, 90)
    setProgress(progress)
  }, 400)

  const processSseLine = (line: string) => {
    if (!line.startsWith('data: ')) return
    try {
      const json = JSON.parse(line.slice(6)) as {
        partialItinerary?: unknown[]
        done?: boolean
        itinerary?: unknown[]
        tripSummary?: unknown
        completeness?: {
          expectedDays: number
          generatedDays: number
          isIncomplete: boolean
        }
        error?: string
      }

      if (json.error) {
        throw new Error(json.error)
      }

      if (json.partialItinerary?.length) {
        const partial = normalizeItineraryDays(json.partialItinerary, locale)
        onPartial?.(partial)
      }

      if (json.done && json.itinerary) {
        clearInterval(progressInterval)
        setProgress(100)
        const days = normalizeItineraryDays(json.itinerary, locale)
        const tripSummary = json.tripSummary
          ? normalizeTripSummary(json.tripSummary)
          : null

        let completenessWarning: ItineraryCompletenessWarning | null = null
        if (json.completeness?.isIncomplete) {
          completenessWarning = {
            expectedDays: json.completeness.expectedDays,
            generatedDays: json.completeness.generatedDays,
          }
          logIncompleteItineraryWarning({
            expectedDays: json.completeness.expectedDays,
            generatedDays: json.completeness.generatedDays,
            isComplete: false,
            isIncomplete: true,
          })
        }

        onDone(days, tripSummary, completenessWarning)
      }
    } catch (err) {
      if (err instanceof Error && err.message !== 'Unexpected end of JSON input') {
        throw err
      }
    }
  }

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    sseBuffer += decoder.decode(value, { stream: true })
    const lines = sseBuffer.split('\n')
    sseBuffer = lines.pop() ?? ''

    for (const line of lines) {
      if (line.trim()) processSseLine(line)
    }
  }

  if (sseBuffer.trim()) {
    processSseLine(sseBuffer)
  }

  clearInterval(progressInterval)
  setProgress(100)
}

function buildPlannerPayload(
  destination: string,
  travelNights: number,
  plannerInput: ItineraryPlannerInput
) {
  return {
    destination,
    travelNights,
    plannerInput,
  }
}

export function useAIItinerary() {
  const search = useSearchStore()
  const {
    setItinerary,
    setTripSummary,
    setItineraryCompleteness,
    setIsGenerating,
    setProgress,
    customLocations,
    dailyBudgetPerPerson,
    travelStyle,
    travelTempo,
    specialRequestsText,
  } = usePlannerStore()
  const locale = useLocaleStore((s) => s.locale)
  const selectedFlight = useSelectedFlightStore((s) => s.selectedFlight)
  const hotelsOnlyContext = usePlannerStore((s) => s.hotelsOnlyContext)

  function notifyMakeOnAiGenerate() {
    if (!travelTempo || !isAiPlannerPrefsValid(travelTempo, specialRequestsText)) return
    const submission = buildAiPlannerSubmissionPayload(
      search,
      travelTempo,
      specialRequestsText,
      selectedFlight
    )
    void fetch('/api/search/notify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(submission),
    })
  }

  const generate = async () => {
    if (!selectedFlight) return
    if (!isAiPlannerPrefsValid(travelTempo, specialRequestsText)) return

    const travelTypeLabel = aiTravelTempoToPromptLabel(travelTempo!)
    notifyMakeOnAiGenerate()

    const plannerInput = buildItineraryPlannerInput({
      searchMode: search.searchMode,
      destination: search.destination,
      hotelDestination: search.hotelDestination,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      adults: search.adults,
      children: search.children,
      cabinClass: search.cabinClass,
      selectedFlight,
      travelType: travelTypeLabel,
      dailyBudget: resolveDailyBudgetForPrompt(dailyBudgetPerPerson),
      specialRequests: buildCombinedSpecialRequests(specialRequestsText, []),
      locale,
    })

    setIsGenerating(true)
    setProgress(0)
    setItinerary([])
    setTripSummary(null)
    setItineraryCompleteness(null)
    useItineraryHotelsStore.getState().clearAll()
    resetItineraryHotelCache()

    const alignDays = (raw: ItineraryDay[]) =>
      syncItineraryDayLabels(
        reanchorItineraryToArrival(
          raw,
          selectedFlight.outboundArrivalAt,
          selectedFlight.destinationLabel
        )
      )

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPlannerPayload(
            selectedFlight.destinationLabel,
            selectedFlight.travelNights,
            plannerInput
          ),
          selectedFlight,
        }),
      })

      await consumeItineraryStream(
        res,
        {
          onPartial: (raw) => {
            const aligned = alignDays(raw)
            setItinerary(aligned)
          },
          onDone: (raw, tripSummary) => {
          const aligned = alignDays(raw)
          setItinerary(aligned)
          setTripSummary(tripSummary)
          useAccomStore.getState().clearUserPickedHotel()

          const anchor = startOfDay(parseISO(selectedFlight.outboundArrivalAt))
          const stay = computeStayWindowForFirstLocation(aligned, anchor)
          if (stay) {
            const loc = sanitizeHotelLocation(stay.location)
            usePlannerStore.getState().setActiveLocation(loc)
            useAccomStore.getState().setActiveLocation(
              loc,
              { checkIn: stay.checkIn, checkOut: stay.checkOut },
              { userPicked: false, clearResults: true }
            )
            useAccomStore.getState().triggerHotelSearch()
          }
          },
        },
        setProgress,
        locale
      )
    } catch (err) {
      console.error('AI itinerary error:', err)
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 500)
    }
  }

  const generateHotelsOnly = async (ctx: HotelsOnlyContext) => {
    if (!isAiPlannerPrefsValid(travelTempo, specialRequestsText)) return

    const travelTypeLabel = aiTravelTempoToPromptLabel(travelTempo!)
    notifyMakeOnAiGenerate()

    const plannerInput = buildItineraryPlannerInput({
      searchMode: 'hotels_only',
      destination: null,
      hotelDestination: search.hotelDestination,
      departureDate: ctx.checkIn,
      returnDate: ctx.checkOut,
      adults: search.adults,
      children: search.children,
      selectedFlight: null,
      hotelsOnlyDestinationLabel: ctx.destinationLabel,
      travelType: travelTypeLabel,
      dailyBudget: resolveDailyBudgetForPrompt(dailyBudgetPerPerson),
      specialRequests: buildCombinedSpecialRequests(specialRequestsText, []),
      locale,
    })

    setIsGenerating(true)
    setProgress(0)
    setItinerary([])
    setTripSummary(null)
    setItineraryCompleteness(null)
    useItineraryHotelsStore.getState().clearAll()
    resetItineraryHotelCache()

    try {
      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...buildPlannerPayload(ctx.destinationLabel, ctx.travelNights, plannerInput),
          hotelsOnly: { arrivalAt: ctx.arrivalAt },
        }),
      })

      if (!res.ok) throw new Error('AI načrt ni uspel')

      await consumeItineraryStream(
        res,
        {
          onDone: (raw, tripSummary) => {
            const aligned = syncItineraryDayLabels(
              reanchorItineraryToArrival(raw, ctx.arrivalAt, ctx.destinationLabel)
            )
            setItinerary(aligned)
            setTripSummary(tripSummary)
            useAccomStore.getState().clearUserPickedHotel()
          },
        },
        setProgress,
        locale
      )
    } catch (err) {
      console.error('AI hotels-only itinerary error:', err)
      throw err
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 500)
    }
  }

  /** Ročni zavihek: destinacija iz iskalnika, let ni obvezen. */
  const generateManual = async () => {
    const destinationLabel = getPlannerDestinationLabel({
      searchMode: search.searchMode,
      destination: search.destination,
      hotelDestination: search.hotelDestination,
      hotelsOnlyContext,
      selectedFlight,
    })
    if (!destinationLabel) return

    const travelNights = computeTravelNightsForPlanner({
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      selectedFlight,
      hotelsOnlyContext,
    })

    const arrivalAt = resolvePlannerArrivalIso({
      departureDate: search.departureDate,
      selectedFlight,
      hotelsOnlyContext,
    })

    const plannerInput = buildItineraryPlannerInput({
      searchMode: search.searchMode,
      destination: search.destination,
      hotelDestination: search.hotelDestination,
      departureDate: search.departureDate,
      returnDate: search.returnDate,
      adults: search.adults,
      children: search.children,
      cabinClass: search.cabinClass,
      selectedFlight,
      hotelsOnlyDestinationLabel: hotelsOnlyContext?.destinationLabel,
      travelType: travelStyleToPromptLabel(travelStyle),
      dailyBudget: resolveDailyBudgetForPrompt(dailyBudgetPerPerson),
      specialRequests: buildCombinedSpecialRequests(specialRequestsText, customLocations),
      locale,
    })

    setIsGenerating(true)
    setProgress(0)
    setItinerary([])
    setTripSummary(null)
    setItineraryCompleteness(null)
    useItineraryHotelsStore.getState().clearAll()
    resetItineraryHotelCache()

    try {
      const body: Record<string, unknown> = {
        ...buildPlannerPayload(destinationLabel, travelNights, plannerInput),
      }
      if (selectedFlight?.outboundArrivalAt) {
        body.selectedFlight = selectedFlight
      } else {
        body.hotelsOnly = { arrivalAt: arrivalAt }
      }

      const res = await fetch('/api/ai/itinerary', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) throw new Error('AI načrt ni uspel')

      await consumeItineraryStream(
        res,
        {
          onDone: (raw, tripSummary, completeness) => {
          const aligned = syncItineraryDayLabels(
            reanchorItineraryToArrival(raw, arrivalAt, destinationLabel)
          )
          setItinerary(aligned)
          setTripSummary(tripSummary)
          setItineraryCompleteness(completeness)
          useAccomStore.getState().clearUserPickedHotel()

          if (selectedFlight?.outboundArrivalAt) {
            const anchor = startOfDay(parseISO(selectedFlight.outboundArrivalAt))
            const stay = computeStayWindowForFirstLocation(aligned, anchor)
            if (stay) {
              const loc = sanitizeHotelLocation(stay.location)
              usePlannerStore.getState().setActiveLocation(loc)
              useAccomStore.getState().setActiveLocation(
                loc,
                { checkIn: stay.checkIn, checkOut: stay.checkOut },
                { userPicked: false, clearResults: true }
              )
              useAccomStore.getState().triggerHotelSearch()
            }
          } else if (search.departureDate && search.returnDate) {
            const loc = sanitizeHotelLocation(
              aligned[0]?.location ?? destinationLabel
            )
            usePlannerStore.getState().setActiveLocation(loc)
            useAccomStore.getState().setActiveLocation(
              loc,
              {
                checkIn: startOfDay(search.departureDate),
                checkOut: startOfDay(search.returnDate),
              },
              { userPicked: false, clearResults: true }
            )
            useAccomStore.getState().triggerHotelSearch()
          }
          },
        },
        setProgress,
        locale
      )
    } catch (err) {
      console.error('AI manual itinerary error:', err)
      throw err
    } finally {
      setTimeout(() => {
        setIsGenerating(false)
        setProgress(0)
      }, 500)
    }
  }

  return { generate, generateHotelsOnly, generateManual }
}
