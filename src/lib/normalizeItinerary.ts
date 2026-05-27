import type { ActivitySuggestion, ItineraryDay } from '@/types/itinerary.types'

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
export function normalizeItineraryDays(days: unknown[]): ItineraryDay[] {
  if (!Array.isArray(days)) return []

  const out: ItineraryDay[] = []

  for (let index = 0; index < days.length; index++) {
    const d = days[index]
    if (!d || typeof d !== 'object') continue
    const row = d as Record<string, unknown>

      const suggestionsRaw = row.suggestions ?? row.activities ?? row.tips
      let suggestions: ActivitySuggestion[] = []

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

      const dayNum = typeof row.day === 'number' ? row.day : index + 1

    out.push({
      day: dayNum,
      location: asString(row.location) || 'Destinacija',
      title: asString(row.title) || `Dan ${dayNum}`,
      description: asString(row.description) || '',
      suggestions: suggestions.slice(0, 6),
      estimatedDate: row.estimatedDate as Date | undefined,
    })
  }

  return syncItineraryDayLabels(out)
}
