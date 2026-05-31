import type { Airport } from '@/types/flight.types'

/** Prikaz v dropdownu / čipu: «London (All airports) - LON» */
export function formatAllAirportsLabel(
  cityName: string,
  metroCode: string,
  allAirportsLabel: string
): string {
  const city = cityName.trim()
  const code = metroCode.trim().toUpperCase()
  const label = allAirportsLabel.trim()
  return `${city} (${label}) - ${code}`
}

/** Znane IATA metro kode (mesto z več letališči) */
const KNOWN_METRO_BY_CITY: Record<string, { code: string; city: string; country: string }> = {
  london: { code: 'LON', city: 'London', country: 'UK' },
  paris: { code: 'PAR', city: 'Paris', country: 'France' },
  pariz: { code: 'PAR', city: 'Paris', country: 'France' },
  milan: { code: 'MIL', city: 'Milan', country: 'Italy' },
  milano: { code: 'MIL', city: 'Milano', country: 'Italy' },
  rome: { code: 'ROM', city: 'Rome', country: 'Italy' },
  roma: { code: 'ROM', city: 'Roma', country: 'Italy' },
  'new york': { code: 'NYC', city: 'New York', country: 'USA' },
  tokyo: { code: 'TYO', city: 'Tokyo', country: 'Japan' },
  moskva: { code: 'MOW', city: 'Moscow', country: 'Russia' },
  moscow: { code: 'MOW', city: 'Moscow', country: 'Russia' },
  stockholm: { code: 'STO', city: 'Stockholm', country: 'Sweden' },
  oslo: { code: 'OSL', city: 'Oslo', country: 'Norway' },
  buenos: { code: 'BUE', city: 'Buenos Aires', country: 'Argentina' },
  'buenos aires': { code: 'BUE', city: 'Buenos Aires', country: 'Argentina' },
}

export function createAllAirportsOption(params: {
  metroCode: string
  city: string
  country: string
  lat?: number
  lon?: number
  allAirportsLabel?: string
}): Airport {
  const city = params.city.trim()
  const code = params.metroCode.toUpperCase()
  const label = formatAllAirportsLabel(city, code, params.allAirportsLabel ?? 'All airports')
  return {
    iata: code,
    name: label,
    displayName: label,
    city,
    country: params.country,
    lat: params.lat,
    lon: params.lon,
    isAllAirports: true,
    metroCode: code,
  }
}

function normalizeCityKey(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
}

function lookupKnownMetro(cityName: string): { code: string; city: string; country: string } | null {
  const key = normalizeCityKey(cityName)
  if (KNOWN_METRO_BY_CITY[key]) return KNOWN_METRO_BY_CITY[key]
  for (const [needle, metro] of Object.entries(KNOWN_METRO_BY_CITY)) {
    if (key.includes(needle) || needle.includes(key)) return metro
  }
  return null
}

function relevanceScore(airport: Airport, query: string): number {
  const q = query.trim().toLowerCase()
  if (!q) return 0
  const hay = `${airport.iata} ${airport.name} ${airport.displayName ?? ''} ${airport.city} ${airport.country}`.toLowerCase()
  let score = 0
  if (airport.city.toLowerCase() === q || airport.iata.toLowerCase() === q) score += 50
  else if (airport.city.toLowerCase().startsWith(q)) score += 30
  else if (hay.includes(q)) score += 15
  if (airport.isAllAirports) score += 40
  return score
}

/** Združi predloge: metro na vrh, brez podvojenih kod */
export function organizeAirportSuggestions(
  airports: Airport[],
  query: string,
  limit = 10,
  allAirportsLabel = 'All airports'
): Airport[] {
  const q = query.trim()
  const seen = new Set<string>()
  const regular: Airport[] = []
  const metros: Airport[] = []

  for (const a of airports) {
    const key = a.isAllAirports ? `metro:${a.iata}` : `apt:${a.iata}`
    if (seen.has(key)) continue
    seen.add(key)
    if (a.isAllAirports) metros.push(a)
    else regular.push(a)
  }

  const metroByCode = new Map<string, Airport>()
  for (const m of metros) metroByCode.set(m.iata, m)

  const byCityCode = new Map<string, Airport[]>()
  const byCityName = new Map<string, Airport[]>()

  for (const a of regular) {
    const cityCode = a.iataCityCode?.toUpperCase()
    if (cityCode && cityCode !== a.iata) {
      const list = byCityCode.get(cityCode) ?? []
      list.push(a)
      byCityCode.set(cityCode, list)
    }
    const nameKey = normalizeCityKey(a.city)
    if (nameKey) {
      const list = byCityName.get(nameKey) ?? []
      list.push(a)
      byCityName.set(nameKey, list)
    }
  }

  function ensureMetro(code: string, city: string, country: string, sample?: Airport) {
    if (metroByCode.has(code)) return
    const metro = createAllAirportsOption({
      metroCode: code,
      city,
      country: country || sample?.country || '',
      lat: sample?.lat,
      lon: sample?.lon,
      allAirportsLabel,
    })
    metroByCode.set(code, metro)
    metros.push(metro)
  }

  for (const [cityCode, group] of Array.from(byCityCode.entries())) {
    if (group.length < 2) continue
    const sample = group[0]
    const city = sample.city || cityCode
    ensureMetro(cityCode, city, sample.country, sample)
  }

  for (const entry of Array.from(byCityName.entries())) {
    const group = entry[1]
    if (group.length < 2) continue
    const known = lookupKnownMetro(group[0].city)
    if (!known) continue
    if (group.every((a) => a.iata === known.code)) continue
    ensureMetro(known.code, known.city, known.country, group[0])
  }

  const sortedMetros = Array.from(metroByCode.values()).sort(
    (a, b) => relevanceScore(b, q) - relevanceScore(a, q)
  )
  const sortedAirports = regular.sort((a, b) => relevanceScore(b, q) - relevanceScore(a, q))

  const merged = [...sortedMetros, ...sortedAirports]
  const finalSeen = new Set<string>()
  const out: Airport[] = []

  for (const a of merged) {
    const key = a.isAllAirports ? `metro:${a.iata}` : `apt:${a.iata}`
    if (finalSeen.has(key)) continue
    finalSeen.add(key)
    out.push(a)
    if (out.length >= limit) break
  }

  return out
}

export function mergeAirportLists(local: Airport[], remote: Airport[]): Airport[] {
  const seen = new Set<string>()
  const out: Airport[] = []
  for (const a of [...local, ...remote]) {
    const key = a.isAllAirports ? `metro:${a.iata}` : `apt:${a.iata}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(a)
  }
  return out
}
