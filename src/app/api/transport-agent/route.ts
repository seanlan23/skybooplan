export const dynamic = 'force-dynamic'

import { NextRequest } from 'next/server'
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from 'openai/resources/chat/completions'
import {
  buildTransportAgentSystemPrompt,
  buildTransportContextAppendix,
  type TransportTripContext,
} from '@/lib/transportAgentPrompt'
import { assertOpenAIConfigured, getOpenAIClient } from '@/lib/openaiClient'
import { searchWeb } from '@/lib/webSearch'

const WEB_SEARCH_TOOL: ChatCompletionTool = {
  type: 'function',
  function: {
    name: 'web_search',
    description:
      'Search the web for current transport schedules, fares, ferry/train operators, airport transfers, and ride-hail apps for any worldwide route or destination.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description:
            'Search query in English or local language, e.g. "Rome Fiumicino airport to city center train 2026 price"',
        },
      },
      required: ['query'],
    },
  },
}

const MAX_TOOL_ROUNDS = 3

interface ClientMessage {
  role: 'user' | 'assistant'
  content: string
}

function normalizeTripContext(raw?: Partial<TransportTripContext>): TransportTripContext {
  return {
    currentOrigin: raw?.currentOrigin?.trim() || 'Not specified',
    currentDestination: raw?.currentDestination?.trim() || 'Not specified',
    checkInDate: raw?.checkInDate?.trim() || 'Not specified',
    checkOutDate: raw?.checkOutDate?.trim() || 'Not specified',
    passengerCount: Math.max(1, raw?.passengerCount ?? 1),
    transportBudget: raw?.transportBudget,
    searchMode: raw?.searchMode,
    activeLocation: raw?.activeLocation,
    itineraryLocations: raw?.itineraryLocations,
  }
}

async function runWithTools(
  messages: ChatCompletionMessageParam[],
  model: string
): Promise<{ messages: ChatCompletionMessageParam[]; finalText: string | null }> {
  let conversation = [...messages]
  let rounds = 0

  while (rounds < MAX_TOOL_ROUNDS) {
    const completion = await getOpenAIClient().chat.completions.create({
      model,
      temperature: 0.55,
      max_tokens: 2200,
      messages: conversation,
      tools: [WEB_SEARCH_TOOL],
      tool_choice: 'auto',
    })

    const choice = completion.choices[0]?.message
    if (!choice) break

    conversation.push(choice)

    const toolCalls = choice.tool_calls
    if (!toolCalls?.length) {
      const text = choice.content?.trim()
      return { messages: conversation, finalText: text || null }
    }

    for (const call of toolCalls) {
      if (call.type !== 'function' || call.function.name !== 'web_search') continue
      let query = 'public transport schedules prices 2026'
      try {
        const args = JSON.parse(call.function.arguments) as { query?: string }
        if (args.query?.trim()) query = args.query.trim()
      } catch {
        // privzeti query
      }
      const result = await searchWeb(query)
      conversation.push({
        role: 'tool',
        tool_call_id: call.id,
        content: result,
      })
    }

    rounds++
  }

  return { messages: conversation, finalText: null }
}

function emitTextStream(
  controller: ReadableStreamDefaultController<Uint8Array>,
  encoder: TextEncoder,
  text: string
) {
  const chunkSize = 24
  for (let i = 0; i < text.length; i += chunkSize) {
    const slice = text.slice(i, i + chunkSize)
    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: slice })}\n\n`))
  }
  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`))
}

export async function POST(req: NextRequest) {
  try {
    assertOpenAIConfigured()
  } catch {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY manjka' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: { messages?: ClientMessage[]; tripContext?: Partial<TransportTripContext> }
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Neveljavno telo' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const clientMessages = body.messages?.filter(
    (m) => m.role === 'user' || m.role === 'assistant'
  )
  if (!clientMessages?.length) {
    return new Response(JSON.stringify({ error: 'Manjkajo sporočila' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const model = process.env.OPENAI_MODEL ?? 'gpt-4o'
  const tripContext = normalizeTripContext(body.tripContext)
  const systemContent =
    buildTransportAgentSystemPrompt(tripContext) +
    buildTransportContextAppendix(tripContext)

  const baseMessages: ChatCompletionMessageParam[] = [
    { role: 'system', content: systemContent },
    ...clientMessages.slice(-16).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ]

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const { messages: afterTools, finalText } = await runWithTools(
          baseMessages,
          model
        )

        if (finalText) {
          emitTextStream(controller, encoder, finalText)
          controller.close()
          return
        }

        const streamCompletion = await getOpenAIClient().chat.completions.create({
          model,
          temperature: 0.55,
          max_tokens: 2200,
          messages: afterTools,
          stream: true,
        })

        for await (const chunk of streamCompletion) {
          const text = chunk.choices[0]?.delta?.content ?? ''
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            )
          }
        }

        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ done: true })}\n\n`)
        )
        controller.close()
      } catch (err) {
        controller.enqueue(
          encoder.encode(
            `data: ${JSON.stringify({
              error: err instanceof Error ? err.message : 'Napaka strežnika',
            })}\n\n`
          )
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
