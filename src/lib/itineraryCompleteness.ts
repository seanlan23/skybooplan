import type { ItineraryDay } from '@/types/itinerary.types'

export interface ItineraryCompletenessResult {
  expectedDays: number
  generatedDays: number
  isComplete: boolean
  /** True when fewer than all required days were produced */
  isIncomplete: boolean
}

/** Expected calendar days = nights + 1 (arrival day through last day before return). */
export function expectedItineraryDays(travelNights: number): number {
  return Math.max(1, travelNights + 1)
}

export function assessItineraryCompleteness(
  days: ItineraryDay[],
  travelNights: number
): ItineraryCompletenessResult {
  const expectedDays = expectedItineraryDays(travelNights)
  const generatedDays = days.length
  const isComplete = generatedDays >= expectedDays
  const isIncomplete = generatedDays < expectedDays

  return { expectedDays, generatedDays, isComplete, isIncomplete }
}

export function logIncompleteItineraryWarning(
  result: ItineraryCompletenessResult
): void {
  if (!result.isIncomplete) return
  console.warn(
    'Plan incomplete:',
    result.generatedDays,
    'of',
    result.expectedDays,
    'days generated'
  )
}

/** Prominent duration block — must appear in every AI user message. */
export function buildTripDurationRequirement(
  travelNights: number,
  totalDays?: number
): string {
  const days = totalDays ?? expectedItineraryDays(travelNights)
  return [
    '=== TRIP DURATION (MANDATORY — HIGHEST PRIORITY) ===',
    `This trip is ${travelNights} nights / ${days} days long.`,
    `You MUST generate a plan for ALL ${days} days, from day 1 to day ${days}.`,
    'Do not stop early. Do not summarize or skip days.',
    'Every single day must have morning, afternoon and evening planned.',
    `The "days" array in your JSON must contain exactly ${days} day objects (dayNumber 1 through ${days}).`,
  ].join('\n')
}

export function buildItineraryContinuationMessage(
  lastDayGenerated: number,
  totalDays: number,
  destination: string
): string {
  const start = lastDayGenerated + 1
  return [
    `Your previous itinerary for ${destination} was cut off after day ${lastDayGenerated}.`,
    `Continue the trip plan from day ${start} through day ${totalDays} ONLY.`,
    `Return valid JSON: { "days": [ ... ] } with exactly ${totalDays - lastDayGenerated} day objects.`,
    `Use dayNumber ${start}, ${start + 1}, … ${totalDays}.`,
    'Each day must include morning, afternoon, evening, transportFromPrevious, travelHack, and dailyBudget.',
    'Do not repeat days already planned. Match the same language and style as before.',
  ].join('\n')
}
