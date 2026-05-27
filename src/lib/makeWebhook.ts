import type { AiPlannerSubmissionPayload } from '@/lib/aiPlannerSubmission'

/** Pošlje AI načrtovalski payload na Make.com scenarij (ne blokira glavnega toka). */
export async function sendAiPlannerPayloadToMake(
  payload: AiPlannerSubmissionPayload
): Promise<void> {
  const url = process.env.MAKE_WEBHOOK_URL?.trim()
  if (!url) return

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })
    if (!res.ok) {
      console.warn('[make] webhook failed', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.warn('[make] webhook error', err)
  }
}
