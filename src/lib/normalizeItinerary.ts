import { getItineraryServerLabels } from '@/i18n/itineraryServerLabels'
import type {
  ActivitySuggestion,
  ItineraryDay,
  ItineraryEvening,
  ItineraryTransportType,
  TransportFromPrevious,
} from '@/types/itinerary.types'

function asString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : ''
}

function normalizeSuggestion(raw: unknown): ActivitySuggestion | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const name = asString(o.name ?? o.title ?? o.activity)
  if (!name) return null

  const description = asString(o.description ?? o.desc ?? o.summary)
  let priceLabel = asString(o.priceLabel ?? o.price ?? o.priceEur ?? o.cost)

  if (!priceLabel && typeof o.priceEur === 'number') {
    priceLabel = o.priceEur === 0 ? 'Brezplačno' : `cca. ${o.priceEur} €`
  }
  if (!priceLabel) priceLabel = 'Cena na lokaciji'

  if (/brezplač/i.test(priceLabel)) priceLabel = 'Brezplačno'
  if (!/€|eur/i.test(priceLabel) && /^\d/.test(priceLabel)) {
    priceLabel = `cca. ${priceLabel} €`
  }

  return { name, description, priceLabel }
}

function normalizeActivityList(raw: unknown): ActivitySuggestion[] {
  if (!Array.isArray(raw)) return []
  const out: ActivitySuggestion[] = []
  for (const item of raw) {
    if (typeof item === 'string') {
      const name = item.trim()
      if (name) out.push({ name, description: '', priceLabel: 'Cena na lokaciji' })
      continue
    }
    const norm = normalizeSuggestion(item)
    if (norm) out.push(norm)
  }
  return out
}

function normalizeTransportType(raw: unknown): ItineraryTransportType | null {
  const t = asString(raw).toLowerCase()
  if (t === 'flight' || t === 'ferry' || t === 'car' || t === 'bus' || t === 'none') {
    return t
  }
  return null
}

function normalizeTransportFromPrevious(raw: unknown): TransportFromPrevious | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const type = normalizeTransportType(o.type)
  if (!type) return undefined
  return {
    type,
    duration: asString(o.duration) || undefined,
    cost: asString(o.cost) || undefined,
    description: asString(o.description) || undefined,
  }
}

function normalizeEvening(raw: unknown): ItineraryEvening | undefined {
  if (!raw || typeof raw !== 'object') return undefined
  const o = raw as Record<string, unknown>
  const restaurant = asString(o.restaurant)
  const cuisine = asString(o.cuisine)
  const pricePerPerson = asString(o.pricePerPerson ?? o.price)
  if (!restaurant && !cuisine && !pricePerPerson) return undefined
  return { restaurant, cuisine, pricePerPerson }
}

function formatActivityLines(activities: ActivitySuggestion[]): string[] {
  return activities.map((a) => {
    const price = a.priceLabel ? ` (${a.priceLabel})` : ''
    const desc = a.description ? `: ${a.description}` : ''
    return `- **${a.name}**${price}${desc}`
  })
}

function buildDescriptionFromStructured(
  row: Record<string, unknown>,
  locale?: string
): string {
  const L = getItineraryServerLabels(locale)
  const parts: string[] = []

  const morning = normalizeActivityList(row.morning)
  const afternoon = normalizeActivityList(row.afternoon)
  const evening = normalizeEvening(row.evening)
  const transport = normalizeTransportFromPrevious(row.transportFromPrevious)
  const travelHack = asString(row.travelHack)
  const dailyBudget =
    typeof row.dailyBudget === 'number'
      ? row.dailyBudget
      : typeof row.dailyBudget === 'string'
        ? parseFloat(row.dailyBudget.replace(/[^\d.,]/g, '').replace(',', '.'))
        : NaN

  if (morning.length) {
    parts.push(`### ⏰ ${L.morning}`, ...formatActivityLines(morning))
  }
  if (afternoon.length) {
    parts.push(`### 🌤 ${L.afternoon}`, ...formatActivityLines(afternoon))
  }
  if (evening) {
    parts.push(`### 🌙 ${L.evening}`)
    const rest = evening.restaurant || L.dinner
    const cuisine = evening.cuisine ? ` · ${evening.cuisine}` : ''
    const price = evening.pricePerPerson ? ` · ${evening.pricePerPerson}${L.perPerson}` : ''
    parts.push(`- **${rest}**${cuisine}${price}`)
  }
  if (transport && transport.type !== 'none') {
    const label =
      transport.type === 'flight'
        ? L.transportFlight
        : transport.type === 'ferry'
          ? L.transportFerry
          : transport.type === 'bus'
            ? L.transportBus
            : transport.type === 'car'
              ? L.transportCar
              : L.transport
    const dur = transport.duration ? ` · ${transport.duration}` : ''
    const cost = transport.cost ? ` · ${transport.cost}` : ''
    const desc = transport.description ? `\n${transport.description}` : ''
    parts.push(`**${L.transport}:** ${label}${dur}${cost}${desc}`)
  }
  if (travelHack) {
    parts.push(`**💡 ${L.travelHack}:** ${travelHack}`)
  }
  if (Number.isFinite(dailyBudget) && dailyBudget > 0) {
    parts.push(`**${L.dailyBudget}:** cca. ${Math.round(dailyBudget)} €`)
  }

  return parts.join('\n')
}

/** Združi dneve po številki dneva (npr. nadaljevanje po odrezanem streamu). */
export function mergeItineraryDaysByNumber(
  existing: ItineraryDay[],
  incoming: ItineraryDay[]
): ItineraryDay[] {
  const byDay = new Map<number, ItineraryDay>()
  for (const d of [...existing, ...incoming]) {
    byDay.set(d.day, d)
  }
  return syncItineraryDayLabels(Array.from(byDay.values()))
}

/** Uskladi številko dneva v polju `day` in v naslovu (Dan 1, Dan 2, …). */
export function syncItineraryDayLabels(days: ItineraryDay[]): ItineraryDay[] {
  const sorted = [...days].sort((a, b) => a.day - b.day)
  return sorted.map((d, i) => {
    const seq = i + 1
    const stripped = d.title.replace(/^Dan\s+\d+\s*:\s*/i, '').trim()
    const title = stripped ? `Dan ${seq}: ${stripped}` : `Dan ${seq}`
    return { ...d, day: seq, title }
  })
}

/** AI JSON → konsistenten itinerar s predlogi */
export function normalizeItineraryDays(days: unknown[], locale?: string): ItineraryDay[] {
  if (!Array.isArray(days)) return []

  const out: ItineraryDay[] = []

  for (let index = 0; index < days.length; index++) {
    const d = days[index]
    if (!d || typeof d !== 'object') continue
    const row = d as Record<string, unknown>

    const dayNum =
      typeof row.dayNumber === 'number'
        ? row.dayNumber
        : typeof row.day === 'number'
          ? row.day
          : index + 1

    const morning = normalizeActivityList(row.morning)
    const afternoon = normalizeActivityList(row.afternoon)
    const evening = normalizeEvening(row.evening)
    const transportFromPrevious = normalizeTransportFromPrevious(row.transportFromPrevious)
    const travelHack = asString(row.travelHack) || undefined

    let dailyBudget: number | undefined
    if (typeof row.dailyBudget === 'number' && row.dailyBudget > 0) {
      dailyBudget = row.dailyBudget
    } else if (typeof row.dailyBudget === 'string') {
      const n = parseFloat(row.dailyBudget.replace(/[^\d.,]/g, '').replace(',', '.'))
      if (Number.isFinite(n) && n > 0) dailyBudget = n
    }

    const suggestionsRaw = row.suggestions ?? row.activities ?? row.tips
    let suggestions: ActivitySuggestion[] = [...morning, ...afternoon]

    if (Array.isArray(suggestionsRaw)) {
      for (const item of suggestionsRaw) {
        if (typeof item === 'string') {
          const name = item.trim()
          if (name) {
            suggestions.push({
              name,
              description: '',
              priceLabel: 'Cena na lokaciji',
            })
          }
          continue
        }
        const norm = normalizeSuggestion(item)
        if (norm) suggestions.push(norm)
      }
    }

    if (!suggestions.length && Array.isArray(row.activities)) {
      suggestions = (row.activities as string[])
        .filter((a) => typeof a === 'string' && a.trim())
        .map((a) => ({
          name: a.trim(),
          description: '',
          priceLabel: 'Cena na lokaciji',
        }))
    }

    const structuredDescription = buildDescriptionFromStructured(row, locale)
    const legacyDescription = asString(row.description)
    const description = structuredDescription || legacyDescription

    out.push({
      day: dayNum,
      location: asString(row.location) || 'Destinacija',
      title: asString(row.title) || `Dan ${dayNum}`,
      description,
      suggestions: suggestions.slice(0, 8),
      estimatedDate: row.estimatedDate as Date | undefined,
      date: asString(row.date) || undefined,
      transportFromPrevious,
      morning: morning.length ? morning : undefined,
      afternoon: afternoon.length ? afternoon : undefined,
      evening,
      travelHack,
      dailyBudget,
    })
  }

  return syncItineraryDayLabels(out)
}
