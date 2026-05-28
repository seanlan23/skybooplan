export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import { assertOpenAIConfigured, getOpenAIClient } from '@/lib/openaiClient'
import {
  assessItineraryCompleteness,
  buildItineraryContinuationMessage,
  logIncompleteItineraryWarning,
} from '@/lib/itineraryCompleteness'
import {
  buildFlightPackage,
  buildHotelsOnlyPackage,
  buildItineraryUserMessage,
  enforceShortTripItinerary,
  parseItineraryResponse,
  type ItineraryPlannerInput,
} from '@/lib/itineraryPrompt'
import { buildSkybooplanItinerarySystemPrompt } from '@/lib/skybooplanItinerarySystemPrompt'
import { buildFlightContextForAI, formatFlightTimeForPrompt } from '@/lib/flightPromptContext'
import { mergeItineraryDaysByNumber } from '@/lib/normalizeItinerary'
import { parseItineraryFromStreamBuffer, tryParsePartialItinerary } from '@/lib/tryParsePartialItinerary'
import type { ItineraryDay } from '@/types/itinerary.types'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

/** Long trips need many structured day objects — keep output budget high. */
const MAX_OUTPUT_TOKENS = 16_000
const MAX_CONTINUATION_ROUNDS = 3

type ChatMessage = OpenAI.Chat.Completions.ChatCompletionMessageParam

async function streamCompletionToBuffer(
  messages: ChatMessage[],
  onToken?: (fullBuffer: string) => void
): Promise<{ buffer: string; finishReason: string | null }> {
  const completion = await getOpenAIClient().chat.completions.create({
    model: process.env.OPENAI_MODEL ?? 'gpt-4o',
    stream: true,
    temperature: 0.5,
    max_tokens: MAX_OUTPUT_TOKENS,
    messages,
  })

  let buffer = ''
  let finishReason: string | null = null

  for await (const chunk of completion) {
    const choice = chunk.choices[0]
    const text = choice?.delta?.content ?? ''
    if (text) {
      buffer += text
      onToken?.(buffer)
    }
    if (choice?.finish_reason) {
      finishReason = choice.finish_reason
    }
  }

  return { buffer, finishReason }
}

function parseBufferToDays(buffer: string): {
  days: ItineraryDay[]
  tripSummary: ReturnType<typeof parseItineraryResponse>['tripSummary']
} {
  const raw = parseItineraryFromStreamBuffer(buffer)
  const { days, tripSummary } = parseItineraryResponse({
    days: raw.days,
    tripSummary: raw.tripSummary,
  })
  return { days, tripSummary }
}

export async function POST(req: NextRequest) {
  try {
    assertOpenAIConfigured()
  } catch {
    return new Response('OPENAI_API_KEY environment variable is missing or empty', {
      status: 503,
    })
  }

  const body = (await req.json()) as {
    destination: string
    travelNights: number
    selectedFlight?: SelectedFlightForAI
    hotelsOnly?: { arrivalAt: string }
    plannerInput?: ItineraryPlannerInput
  }

  const { destination, travelNights, selectedFlight, hotelsOnly, plannerInput } = body

  const hasFlight = !!selectedFlight?.outboundArrivalAt
  const hasHotelsOnly = !!hotelsOnly?.arrivalAt

  if (!destination?.trim() || !travelNights || travelNights < 1 || (!hasFlight && !hasHotelsOnly)) {
    return new Response('Missing fields', { status: 400 })
  }

  const totalDays = travelNights + 1
  const destLabel = destination.trim()

  const travelPackage = hasFlight
    ? buildFlightPackage(
        destLabel,
        travelNights,
        totalDays,
        selectedFlight!.origin,
        selectedFlight!.destination,
        formatFlightTimeForPrompt(selectedFlight!.outboundDepartureAt),
        formatFlightTimeForPrompt(selectedFlight!.outboundArrivalAt)
      )
    : buildHotelsOnlyPackage(
        destLabel,
        travelNights,
        totalDays,
        formatFlightTimeForPrompt(hotelsOnly!.arrivalAt)
      )

  const flightBlock = hasFlight
    ? `${travelPackage}\n\n${buildFlightContextForAI(selectedFlight!)}`
    : travelPackage

  const planner: ItineraryPlannerInput = plannerInput ?? {
    currentDestination: destLabel,
    checkInDate: '—',
    checkOutDate: '—',
    passengerCount: 2,
    travelNights,
  }

  const systemPrompt = buildSkybooplanItinerarySystemPrompt(planner)

  const userMessage = buildItineraryUserMessage(
    destLabel,
    travelNights,
    totalDays,
    flightBlock,
    planner
  )

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
      }

      try {
        let messages: ChatMessage[] = [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ]

        let mergedDays: ItineraryDay[] = []
        let tripSummary: ReturnType<typeof parseItineraryResponse>['tripSummary'] = null
        let lastPartialCount = 0

        const emitPartialIfNeeded = (buffer: string) => {
          const partialDays = tryParsePartialItinerary(buffer)
          if (partialDays.length === 0) return
          const combined = mergeItineraryDaysByNumber(mergedDays, partialDays)
          if (combined.length > lastPartialCount) {
            lastPartialCount = combined.length
            enqueue({ partialItinerary: combined })
          }
        }

        for (let round = 0; round <= MAX_CONTINUATION_ROUNDS; round++) {
          const { buffer, finishReason } = await streamCompletionToBuffer(
            messages,
            emitPartialIfNeeded
          )

          const parsed = parseBufferToDays(buffer)
          mergedDays = mergeItineraryDaysByNumber(mergedDays, parsed.days)
          if (parsed.tripSummary) tripSummary = parsed.tripSummary

          lastPartialCount = mergedDays.length
          enqueue({ partialItinerary: mergedDays })

          const completeness = assessItineraryCompleteness(mergedDays, travelNights)
          const hitTokenLimit = finishReason === 'length'
          const shouldContinue =
            completeness.isIncomplete &&
            mergedDays.length > 0 &&
            round < MAX_CONTINUATION_ROUNDS &&
            (hitTokenLimit || parsed.days.length > 0)

          if (!shouldContinue) break

          const lastDay = mergedDays[mergedDays.length - 1]?.day ?? 0
          messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
            { role: 'assistant', content: buffer },
            {
              role: 'user',
              content: buildItineraryContinuationMessage(lastDay, totalDays, destLabel),
            },
          ]
        }

        let itinerary = enforceShortTripItinerary(mergedDays, destLabel, totalDays)
        const completeness = assessItineraryCompleteness(itinerary, travelNights)
        logIncompleteItineraryWarning(completeness)

        enqueue({
          done: true,
          itinerary,
          tripSummary,
          completeness: {
            expectedDays: completeness.expectedDays,
            generatedDays: completeness.generatedDays,
            isIncomplete: completeness.isIncomplete,
          },
        })
      } catch (err) {
        enqueue({ error: String(err) })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
