import { NextRequest, NextResponse } from 'next/server'
import {
  aiTravelTempoToPromptLabel,
  MIN_AI_WISHES_LENGTH,
  VALID_AI_TRAVEL_TEMPO,
  type AiTravelTempo,
} from '@/lib/aiPlannerTempo'
import type { AiPlannerSubmissionPayload } from '@/lib/aiPlannerSubmission'
import { sendAiPlannerPayloadToMake } from '@/lib/makeWebhook'

export async function POST(req: NextRequest) {
  const body = await req.json()
  const tempo = body.tempo as AiTravelTempo
  const notes = String(body.notes ?? '').trim()

  if (!tempo || !VALID_AI_TRAVEL_TEMPO.has(tempo)) {
    return NextResponse.json({ error: 'Izberi tempo potovanja.' }, { status: 400 })
  }
  if (notes.length < MIN_AI_WISHES_LENGTH) {
    return NextResponse.json(
      { error: `Opiši želje z vsaj ${MIN_AI_WISHES_LENGTH} znaki.` },
      { status: 400 }
    )
  }

  const payload = {
    ...body,
    source: 'ai_planner' as const,
    tempo,
    notes,
    tempoLabel: aiTravelTempoToPromptLabel(tempo),
  } as AiPlannerSubmissionPayload

  await sendAiPlannerPayloadToMake(payload)

  return NextResponse.json({ ok: true })
}
