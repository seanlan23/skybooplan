import { NextRequest } from 'next/server'
import OpenAI from 'openai'
import {
  buildFlightPackage,
  buildHotelsOnlyPackage,
  buildItinerarySystemPrompt,
  buildItineraryUserMessage,
  enforceShortTripItinerary,
  parseItineraryResponse,
  type ItineraryPlannerInput,
} from '@/lib/itineraryPrompt'
import { buildFlightContextForAI, formatFlightTimeForPrompt } from '@/lib/flightPromptContext'
import { tryParsePartialItinerary } from '@/lib/tryParsePartialItinerary'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
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

  const systemPrompt = buildItinerarySystemPrompt(planner)

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
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL ?? 'gpt-4o',
          stream: true,
          temperature: 0.5,
          max_tokens: 5500,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
        })

        let buffer = ''
        let lastPartialDayCount = 0
        for await (const chunk of completion) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          buffer += text
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ chunk: text })}\n\n`)
          )

          const partialDays = tryParsePartialItinerary(buffer)
          if (partialDays.length > lastPartialDayCount) {
            lastPartialDayCount = partialDays.length
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ partialItinerary: partialDays })}\n\n`
              )
            )
          }
        }

        try {
          const jsonMatch = buffer.match(/\{[\s\S]*\}/)
          if (jsonMatch) {
            const parsed = JSON.parse(jsonMatch[0]) as {
              days?: unknown[]
              tripSummary?: unknown
            }
            let { days: itinerary, tripSummary } = parseItineraryResponse(parsed)
            itinerary = enforceShortTripItinerary(itinerary, destLabel, totalDays)
            controller.enqueue(
              encoder.encode(
                `data: ${JSON.stringify({ done: true, itinerary, tripSummary })}\n\n`
              )
            )
          }
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: 'Parse error' })}\n\n`)
          )
        }

        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        )
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
