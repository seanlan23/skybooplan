import type { ActivitySuggestion, ItineraryDay } from '@/types/itinerary.types'

export type DayActivity = {
  name: string
  description?: string
  priceLabel?: string
}

const PRICE_REGEX = /\(([^)]*(?:€|EUR|THB|USD|\$|£|JPY|¥|brezplačno|free|varies)[^)]*)\)/i
const BOLD_REGEX = /\*\*([^*]+)\*\*/

function parseActivitiesFromText(text?: string): DayActivity[] {
  if (!text?.trim()) return []

  const segments = text
    .split(/\n+|(?:^|\s)[•\-*]\s+/g)
    .map((p) => p.trim())
    .filter(Boolean)

  const parts = segments.length > 0 ? segments : [text.trim()]

  return parts.map((seg) => {
    const boldMatch = seg.match(BOLD_REGEX)
    const priceMatch = seg.match(PRICE_REGEX)

    let name = boldMatch?.[1]?.trim() ?? ''
    let description = seg
      .replace(BOLD_REGEX, '')
      .replace(PRICE_REGEX, '')
      .replace(/^[:·\-\s]+/, '')
      .replace(/\s+/g, ' ')
      .trim()

    if (!name) {
      const colonIdx = description.indexOf(':')
      if (colonIdx > 0 && colonIdx < 60) {
        name = description.slice(0, colonIdx).trim()
        description = description.slice(colonIdx + 1).trim()
      } else {
        name = description
        description = ''
      }
    }

    return {
      name,
      description: description || undefined,
      priceLabel: priceMatch?.[1]?.trim(),
    }
  })
}

function slotHeadingPattern(slot: 'morning' | 'afternoon' | 'evening'): RegExp {
  if (slot === 'morning') return /dopoldan|morning|jutro|vormittag/i
  if (slot === 'afternoon') return /popoldan|afternoon|nachmittag/i
  return /večer|vecer|evening|abend/i
}

function parseSlotFromDescription(
  description: string,
  slot: 'morning' | 'afternoon' | 'evening'
): DayActivity[] {
  const lines = description.split('\n')
  const pattern = slotHeadingPattern(slot)
  let capturing = false
  const buffer: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('### ')) {
      if (capturing) break
      if (pattern.test(trimmed)) {
        capturing = true
      }
      continue
    }
    if (capturing) {
      if (trimmed) buffer.push(trimmed)
    }
  }

  return parseActivitiesFromText(buffer.join('\n'))
}

export function getDaySlotActivities(
  day: ItineraryDay,
  slot: 'morning' | 'afternoon' | 'evening'
): DayActivity[] {
  if (slot === 'morning' && day.morning?.length) {
    return day.morning.map(mapSuggestion)
  }
  if (slot === 'afternoon' && day.afternoon?.length) {
    return day.afternoon.map(mapSuggestion)
  }
  if (slot === 'evening') {
    if (day.evening?.restaurant) {
      const parts = [day.evening.cuisine, day.evening.pricePerPerson].filter(Boolean)
      return [
        {
          name: day.evening.restaurant,
          description: parts.join(' · ') || undefined,
          priceLabel: day.evening.pricePerPerson,
        },
      ]
    }
  }

  const fromDescription = parseSlotFromDescription(day.description, slot)
  if (fromDescription.length) return fromDescription

  return []
}

function mapSuggestion(s: ActivitySuggestion): DayActivity {
  return {
    name: s.name,
    description: s.description || undefined,
    priceLabel: s.priceLabel || undefined,
  }
}

export function dayHasTimeBlocks(day: ItineraryDay): boolean {
  return (
    getDaySlotActivities(day, 'morning').length > 0 ||
    getDaySlotActivities(day, 'afternoon').length > 0 ||
    getDaySlotActivities(day, 'evening').length > 0
  )
}
