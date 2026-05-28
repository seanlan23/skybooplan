import { normalizeItineraryDays } from '@/lib/normalizeItinerary'
import type { ItineraryDay } from '@/types/itinerary.types'

/**
 * Iz stream bufferja izlušči vse popolnoma zaprte objekte dni
 * (ne zanaša se na celoten JSON parse, ki pogosto vrne samo zadnje dni).
 */
function extractCompleteDayObjects(buffer: string): unknown[] {
  const daysIdx = buffer.indexOf('"days"')
  if (daysIdx < 0) return []

  const arrStart = buffer.indexOf('[', daysIdx)
  if (arrStart < 0) return []

  const objects: unknown[] = []
  let depth = 0
  let objStart = -1

  for (let i = arrStart + 1; i < buffer.length; i++) {
    const ch = buffer[i]
    if (ch === '{') {
      if (depth === 0) objStart = i
      depth++
    } else if (ch === '}') {
      depth--
      if (depth === 0 && objStart >= 0) {
        const slice = buffer.slice(objStart, i + 1)
        try {
          objects.push(JSON.parse(slice))
        } catch {
          // nepopoln objekt
        }
        objStart = -1
      }
    }
  }

  return objects
}

/** Parse final stream buffer — prefers complete day objects over fragile full JSON. */
export function parseItineraryFromStreamBuffer(buffer: string): {
  days: unknown[]
  tripSummary?: unknown
} {
  const dayObjects = extractCompleteDayObjects(buffer)
  if (dayObjects.length > 0) {
    const start = buffer.indexOf('{')
    if (start >= 0) {
      try {
        const parsed = JSON.parse(buffer.slice(start)) as { tripSummary?: unknown }
        return { days: dayObjects, tripSummary: parsed.tripSummary }
      } catch {
        // truncated tail — day objects are still valid
      }
    }
    return { days: dayObjects }
  }

  const start = buffer.indexOf('{')
  if (start < 0) return { days: [] }

  try {
    const parsed = JSON.parse(buffer.slice(start)) as {
      days?: unknown[]
      tripSummary?: unknown
    }
    return { days: parsed.days ?? [], tripSummary: parsed.tripSummary }
  } catch {
    return { days: [] }
  }
}

/** Poskusi iznesti delni JSON itinerar iz OpenAI stream bufferja. */
export function tryParsePartialItinerary(buffer: string): ItineraryDay[] {
  const fromObjects = extractCompleteDayObjects(buffer)
  if (fromObjects.length > 0) {
    return normalizeItineraryDays(fromObjects)
  }

  const start = buffer.indexOf('{')
  if (start < 0) return []

  let attempt = buffer.slice(start).trim()
  const openBraces = (attempt.match(/\{/g) ?? []).length
  const closeBraces = (attempt.match(/\}/g) ?? []).length
  const openArr = (attempt.match(/\[/g) ?? []).length
  const closeArr = (attempt.match(/\]/g) ?? []).length

  attempt += ']'.repeat(Math.max(0, openArr - closeArr))
  attempt += '}'.repeat(Math.max(0, openBraces - closeBraces))

  try {
    const parsed = JSON.parse(attempt) as { days?: unknown[] }
    return normalizeItineraryDays(parsed.days ?? [])
  } catch {
    return []
  }
}
