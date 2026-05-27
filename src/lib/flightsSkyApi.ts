import { buildSkyscannerFlightsUrl } from '@/lib/skyscannerUrl'
import type { Airport, FlightOffer, FlightSegment } from '@/types/flight.types'

const RAPIDAPI_BASE = 'https://flights-sky.p.rapidapi.com'

function getConfig() {
  const key = process.env.RAPIDAPI_KEY
  const host = process.env.RAPIDAPI_FLIGHTS_HOST ?? 'flights-sky.p.rapidapi.com'
  if (!key) throw new Error('RAPIDAPI_KEY manjka v .env.local')
  return { key, host }
}

const DEFAULT_MARKET = process.env.FLIGHTS_MARKET ?? 'SI'
const DEFAULT_LOCALE = process.env.FLIGHTS_LOCALE ?? 'en-GB'
const DEFAULT_CURRENCY = process.env.FLIGHTS_CURRENCY ?? 'EUR'

/** RapidAPI odgovori pogosto po 40–50 s – ne prekinaj prezgodaj */
const SEARCH_TIMEOUT_MS = 65_000
const AIRPORT_TIMEOUT_MS = 10_000
const POLL_ATTEMPTS = 4
const POLL_DELAY_MS = 2_000
const POLL_TIMEOUT_MS = 20_000

const CABIN_MAP: Record<string, string> = {
  economy: 'economy',
  premium_economy: 'premium_economy',
  business: 'business',
  first: 'first',
}

async function fetchFlightsSky(
  path: string,
  params: Record<string, string>,
  timeoutMs: number
) {
  const { key, host } = getConfig()
  const url = new URL(`${RAPIDAPI_BASE}${path}`)
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') url.searchParams.set(k, v)
  }

  const res = await fetch(url.toString(), {
    headers: {
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': host,
      'Content-Type': 'application/json',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(timeoutMs),
  })

  return res.json()
}

export function isFlightsSkyHost(host?: string) {
  return (host ?? process.env.RAPIDAPI_FLIGHTS_HOST ?? '').includes('flights-sky')
}

export async function searchAirportsFlightsSky(query: string): Promise<Airport[]> {
  const json = await fetchFlightsSky('/web/flights/auto-complete', { query }, AIRPORT_TIMEOUT_MS)
  if (!json?.status || !Array.isArray(json.data)) return []

  return json.data.slice(0, 8).map((item: Record<string, string>): Airport => {
    const placeId = item.PlaceId ?? ''
    const iataMatch = item.ResultingPhrase?.match(/\(([A-Z]{3})\)/)
    const iata = (item.IataCode || iataMatch?.[1] || placeId).toUpperCase()
    const [lat, lon] = (item.Location ?? '').split(',').map(Number)

    return {
      iata,
      name: item.PlaceName || item.CityName || iata,
      city: item.CityName || item.PlaceName || '',
      country: item.CountryName || '',
      lat: Number.isFinite(lat) ? lat : undefined,
      lon: Number.isFinite(lon) ? lon : undefined,
      skyscannerPlaceId: placeId || iata,
    }
  }).filter((a: Airport) => Boolean(a.iata))
}

export async function resolveSkyscannerPlaceId(iata: string): Promise<string> {
  const code = iata.toUpperCase()
  try {
    const airports = await searchAirportsFlightsSky(code)
    const match =
      airports.find((a) => a.iata === code) ??
      airports.find((a) => a.iata.startsWith(code.slice(0, 2))) ??
      airports[0]
    return match?.skyscannerPlaceId ?? code
  } catch {
    return code
  }
}

type SearchPayload = Record<string, unknown>

function unwrapSearchPayload(json: SearchPayload): SearchPayload {
  const inner = json.data
  if (inner && typeof inner === 'object' && !Array.isArray(inner)) {
    return inner as SearchPayload
  }
  return json
}

function apiErrorText(json: SearchPayload): string {
  if (typeof json.errors === 'string') return json.errors
  if (json.errors && typeof json.errors === 'object') {
    const e = json.errors as Record<string, string>
    const first = Object.values(e)[0]
    if (first) return first
    return JSON.stringify(json.errors)
  }
  return String(json.message ?? 'API napaka')
}

function extractSessionId(payload: SearchPayload): string | undefined {
  const id = payload.sessionId ?? payload.token
  return typeof id === 'string' ? id : undefined
}

function extractContextStatus(payload: SearchPayload): string | undefined {
  const context = payload.context as { status?: string } | undefined
  return context?.status
}

function extractItineraries(payload: SearchPayload): unknown[] {
  const itineraries = payload.itineraries as
    | { results?: unknown[] }
    | unknown[]
    | undefined

  if (Array.isArray(itineraries)) return itineraries
  if (itineraries && typeof itineraries === 'object' && Array.isArray(itineraries.results)) {
    return itineraries.results
  }

  const nested = payload.data as SearchPayload | undefined
  if (nested) return extractItineraries(nested)

  return []
}

function formatDuration(minutes?: number) {
  if (!minutes) return ''
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`
}

function airportCode(loc: { displayCode?: string; id?: string } | undefined, fallback: string) {
  return loc?.displayCode ?? loc?.id ?? fallback
}

function mapLegSegments(leg: Record<string, unknown>): FlightSegment[] {
  const segments = (leg.segments as Record<string, unknown>[]) ?? []
  return segments.map((s) => {
    const dep = s.origin as { displayCode?: string; id?: string } | undefined
    const arr = s.destination as { displayCode?: string; id?: string } | undefined
    const mc = s.marketingCarrier as { alternateId?: string } | undefined
    return {
      departure: { iataCode: airportCode(dep, ''), at: String(s.departure ?? '') },
      arrival: { iataCode: airportCode(arr, ''), at: String(s.arrival ?? '') },
      carrierCode: mc?.alternateId ?? '',
      flightNumber: String(s.flightNumber ?? ''),
      duration: formatDuration(s.durationInMinutes as number | undefined),
    }
  })
}

function legStops(leg: Record<string, unknown>, segmentCount: number) {
  const stopCount = leg.stopCount as number | undefined
  return stopCount ?? Math.max(0, segmentCount - 1)
}

function extractItineraryDeepLink(it: Record<string, unknown>, fallbackUrl: string): string {
  const pricingOptions = it.pricingOptions as
    | { items?: { url?: string; deepLink?: string; deeplink?: string }[] }[]
    | undefined

  if (Array.isArray(pricingOptions)) {
    for (const option of pricingOptions) {
      const items = option?.items
      if (!Array.isArray(items)) continue
      for (const item of items) {
        const url = item.url ?? item.deepLink ?? item.deeplink
        if (typeof url === 'string' && url.startsWith('http')) return url
      }
    }
  }

  for (const key of ['deeplink', 'deepLink', 'bookingUrl', 'redirectUrl', 'url'] as const) {
    const value = it[key]
    if (typeof value === 'string' && value.startsWith('http')) return value
  }

  const itineraryId = it.id ?? it.itineraryId
  if (itineraryId) {
    try {
      const url = new URL(fallbackUrl)
      url.searchParams.set('selectedoutbound', String(itineraryId))
      return url.toString()
    } catch {
      return fallbackUrl
    }
  }

  return fallbackUrl
}

function mapItineraryToOffer(
  it: Record<string, unknown>,
  params: FlightsSkySearchParams
): FlightOffer {
  const legs = (it.legs as Record<string, unknown>[]) ?? []
  const outbound = legs[0] ?? {}
  const inbound = legs[1]
  const priceObj = it.price as { raw?: number; amount?: number } | undefined
  const price = Math.round(priceObj?.raw ?? priceObj?.amount ?? (it.minPrice as number) ?? 0)
  const carriers = outbound.carriers as { marketing?: { name?: string; logoUrl?: string }[] } | undefined
  const carrier = carriers?.marketing?.[0] ?? {}
  const outboundSegments = mapLegSegments(outbound)
  const returnSegments = inbound ? mapLegSegments(inbound) : undefined

  const origin = airportCode(
    outbound.origin as { displayCode?: string; id?: string },
    params.originIata
  )
  const destination = airportCode(
    outbound.destination as { displayCode?: string; id?: string },
    params.destinationIata
  )

  const itineraryId = String(it.id ?? it.itineraryId ?? Math.random().toString(36).slice(2))
  const searchUrl = buildSkyscannerFlightsUrl({
    origin: params.originIata,
    destination: params.destinationIata,
    departDate: params.departDate,
    returnDate: params.returnDate,
    adults: params.adults,
    cabinClass: params.cabinClass,
  })

  const outboundMinutes = outbound.durationInMinutes as number | undefined
  const inboundMinutes = inbound?.durationInMinutes as number | undefined
  const totalDurationMinutes =
    (outboundMinutes ?? 0) + (inboundMinutes ?? 0) || undefined

  return {
    id: itineraryId,
    skyscannerItineraryId: itineraryId,
    origin,
    destination,
    departureDate: params.departDate,
    returnDate: params.returnDate,
    price,
    currency: DEFAULT_CURRENCY,
    airline: (carrier.name as string) ?? 'Unknown',
    airlineLogo: carrier.logoUrl as string | undefined,
    duration: formatDuration(outboundMinutes),
    stops: legStops(outbound, outboundSegments.length),
    returnDuration: inbound ? formatDuration(inboundMinutes) : undefined,
    returnStops: inbound ? legStops(inbound, returnSegments?.length ?? 0) : undefined,
    totalDurationMinutes,
    cabinClass: params.cabinClass,
    deepLink: extractItineraryDeepLink(it, searchUrl),
    segments: outboundSegments,
    returnSegments,
  }
}

function mapOffers(raw: unknown[], params: FlightsSkySearchParams): FlightOffer[] {
  return raw
    .slice(0, 20)
    .map((it) => mapItineraryToOffer(it as Record<string, unknown>, params))
}

async function pollIncomplete(sessionId: string): Promise<SearchPayload | null> {
  let last: SearchPayload | null = null
  for (let i = 0; i < POLL_ATTEMPTS; i++) {
    await new Promise((r) => setTimeout(r, POLL_DELAY_MS))
    try {
      const json = await fetchFlightsSky(
        '/web/flights/search-incomplete',
        { sessionId },
        POLL_TIMEOUT_MS
      )
      if (!json?.status) break
      last = unwrapSearchPayload(json)
      if (extractContextStatus(last) === 'complete') return last
      const results = extractItineraries(last)
      if (results.length > 0) return last
    } catch {
      break
    }
  }
  return last
}

export interface FlightsSkySearchParams {
  originPlaceId: string
  destinationPlaceId: string
  originIata: string
  destinationIata: string
  departDate: string
  returnDate?: string
  adults: number
  children?: number
  cabinClass: string
}

export async function searchFlightsFlightsSky(
  params: FlightsSkySearchParams
): Promise<FlightOffer[]> {
  const baseParams: Record<string, string> = {
    placeIdFrom: params.originPlaceId,
    placeIdTo: params.destinationPlaceId,
    departDate: params.departDate,
    adults: String(params.adults),
    cabinClass: CABIN_MAP[params.cabinClass] ?? 'economy',
    currency: DEFAULT_CURRENCY,
    market: DEFAULT_MARKET,
    locale: DEFAULT_LOCALE,
  }
  if (params.children && params.children > 0) {
    baseParams.children = String(params.children)
  }
  if (params.returnDate) baseParams.returnDate = params.returnDate

  const path = params.returnDate
    ? '/web/flights/search-roundtrip'
    : '/web/flights/search-one-way'

  const json = await fetchFlightsSky(path, baseParams, SEARCH_TIMEOUT_MS)

  if (json?.message && String(json.message).toLowerCase().includes('not subscribed')) {
    throw new Error(json.message)
  }

  if (json?.status === false) {
    throw new Error(apiErrorText(json))
  }

  if (!json?.status) {
    throw new Error('Neveljaven odgovor Flights Scraper Sky API-ja')
  }

  let payload = unwrapSearchPayload(json)

  let raw = extractItineraries(payload)
  if (raw.length > 0) return mapOffers(raw, params)

  const sessionId = extractSessionId(payload)
  if (sessionId && extractContextStatus(payload) === 'incomplete') {
    const polled = await pollIncomplete(sessionId)
    if (polled) {
      raw = extractItineraries(polled)
      if (raw.length > 0) return mapOffers(raw, params)
    }
  }

  return []
}

export function flightsSkyErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (lower.includes('timeout') || lower.includes('aborted')) {
    return 'RapidAPI ni odgovoril pravočasno. Poskusi znova čez minuto.'
  }
  if (lower.includes('not subscribed')) {
    return 'Na RapidAPI ni aktivne naročnine na Flights Scraper Sky.'
  }
  if (lower.includes('blocked') || lower.includes('403') || lower.includes('captcha') || lower.includes('forbidden')) {
    return 'Skyscanner trenutno blokira scraper (403). Preveri iskanje na RapidAPI nadzorni plošči ali poskusi znova čez nekaj minut.'
  }
  if (lower.includes('proxy') || lower.includes('502') || lower.includes('bad gateway')) {
    return 'Strežnik Flights Scraper Sky je začasno preobremenjen. Poskusi čez minuto.'
  }
  if (lower.includes('rate limit')) {
    return 'Preveč poizvedb na minuto. Počakaj in poskusi znova.'
  }
  if (lower.includes('departdate') || lower.includes('invalid')) {
    return msg.length > 120 ? 'Neveljavni parametri iskanja (datum ali letališče).' : msg
  }
  return 'Iskanje letov preko RapidAPI ni uspelo. Poskusi znova.'
}
