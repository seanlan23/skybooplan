import { createAllAirportsOption, organizeAirportSuggestions } from '@/lib/airportSuggestions'
import { formatIsoDurationHuman, isoDurationToMinutes } from '@/lib/isoDuration'
import { stripAirportFromLocation } from '@/lib/bookingLocation'
import type { Airport, FlightOffer, FlightSegment } from '@/types/flight.types'

const DUFFEL_API = 'https://api.duffel.com'
const DUFFEL_VERSION = 'v2'

function getToken() {
  const token = process.env.DUFFEL_ACCESS_TOKEN
  if (!token) throw new Error('DUFFEL_ACCESS_TOKEN manjka v .env.local')
  return token
}

/** Test ključ (duffel_test_…) vrača umetne ponudbe — npr. «Duffel Airways», nerealni direktni leti. */
export function isDuffelTestToken(): boolean {
  const token = process.env.DUFFEL_ACCESS_TOKEN ?? ''
  return token.startsWith('duffel_test_')
}

function duffelHeaders() {
  return {
    Authorization: `Bearer ${getToken()}`,
    'Duffel-Version': DUFFEL_VERSION,
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }
}

async function duffelFetch<T>(
  path: string,
  options: { method?: string; body?: unknown; timeoutMs?: number } = {}
): Promise<T> {
  const { method = 'GET', body, timeoutMs = 30_000 } = options

  let res: Response
  try {
    res = await fetch(`${DUFFEL_API}${path}`, {
      method,
      headers: duffelHeaders(),
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(timeoutMs),
    })
  } catch (err) {
    throw new Error(duffelNetworkErrorMessage(err))
  }

  let json: unknown
  try {
    json = await res.json()
  } catch {
    throw new Error(`Duffel API je vrnil neveljaven odgovor (HTTP ${res.status}).`)
  }

  if (!res.ok) {
    const errors = (json as { errors?: { title?: string; message?: string }[] }).errors
    const msg = errors?.map((e) => e.message ?? e.title).filter(Boolean).join('; ')
    throw new Error(msg || `Duffel API ${res.status}`)
  }
  return json as T
}

function duffelNetworkErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()
  if (lower.includes('timeout') || lower.includes('aborted')) {
    return 'Duffel API ni odgovoril pravočasno'
  }
  if (lower.includes('fetch failed') || lower.includes('econnrefused') || lower.includes('network')) {
    return 'Povezava z Duffel API ni uspela — preveri internet ali poskusi čez minuto'
  }
  return msg || 'Neznana napaka pri povezavi z Duffel'
}

const CABIN_MAP: Record<string, string> = {
  economy: 'economy',
  premium_economy: 'premium_economy',
  business: 'business',
  first: 'first',
}

const parseIsoDurationMinutes = isoDurationToMinutes
const formatIsoDuration = formatIsoDurationHuman

type DuffelPlace = {
  type?: 'airport' | 'city' | string
  iata_code?: string
  name?: string
  city_name?: string
  iata_city_code?: string
  iata_country_code?: string
  latitude?: number
  longitude?: number
  city?: {
    name?: string
    iata_code?: string
    iata_country_code?: string
  }
}

function mapDuffelPlace(p: DuffelPlace): Airport | null {
  const country = p.iata_country_code ?? p.city?.iata_country_code ?? ''
  const cityName =
    stripAirportFromLocation(p.city_name ?? '') ||
    stripAirportFromLocation(p.city?.name ?? '') ||
    stripAirportFromLocation(p.name ?? '')

  if (p.type === 'city') {
    const metroCode = (p.iata_code ?? p.city?.iata_code ?? '').toUpperCase()
    if (metroCode.length !== 3) return null
    const city = cityName || metroCode
    return createAllAirportsOption({
      metroCode,
      city,
      country,
      lat: p.latitude,
      lon: p.longitude,
    })
  }

  const iata = (p.iata_code ?? '').toUpperCase()
  if (iata.length !== 3) return null

  const metroCode = (p.iata_city_code ?? p.city?.iata_code ?? '').toUpperCase()
  const city =
    cityName ||
    stripAirportFromLocation(p.name ?? '') ||
    iata

  return {
    iata,
    name: p.name ?? iata,
    city,
    country,
    lat: p.latitude,
    lon: p.longitude,
    iataCityCode: metroCode && metroCode !== iata ? metroCode : undefined,
  }
}

type DuffelSegment = {
  departing_at?: string
  arriving_at?: string
  duration?: string
  marketing_carrier?: { name?: string; iata_code?: string; logo_symbol_url?: string }
  marketing_carrier_flight_number?: string
  operating_carrier?: { name?: string; iata_code?: string; logo_symbol_url?: string }
  origin?: DuffelPlace
  destination?: DuffelPlace
  stops?: unknown[]
}

type DuffelSlice = {
  duration?: string
  segments?: DuffelSegment[]
}

type DuffelOffer = {
  id: string
  total_amount: string
  total_currency: string
  total_emissions_kg?: string | null
  owner?: { name?: string; logo_symbol_url?: string }
  slices?: DuffelSlice[]
}

export async function searchAirportsDuffel(query: string): Promise<Airport[]> {
  const json = await duffelFetch<{ data: DuffelPlace[] }>(
    `/places/suggestions?query=${encodeURIComponent(query)}`,
    { timeoutMs: 8_000 }
  )

  const mapped = (json.data ?? [])
    .map(mapDuffelPlace)
    .filter((a): a is Airport => a != null)

  return organizeAirportSuggestions(mapped, query, 10)
}

function mapSegment(seg: DuffelSegment): FlightSegment {
  const carrier = seg.marketing_carrier ?? seg.operating_carrier
  return {
    departure: {
      iataCode: seg.origin?.iata_code ?? '',
      at: seg.departing_at ?? '',
    },
    arrival: {
      iataCode: seg.destination?.iata_code ?? '',
      at: seg.arriving_at ?? '',
    },
    carrierCode: carrier?.iata_code ?? '',
    flightNumber: seg.marketing_carrier_flight_number ?? '',
    duration: formatIsoDuration(seg.duration),
  }
}

function countStops(segments: DuffelSegment[]) {
  if (segments.length <= 1) return 0
  return segments.length - 1 + segments.reduce((n, s) => n + (s.stops?.length ?? 0), 0)
}

function mapDuffelOffer(
  offer: DuffelOffer,
  params: DuffelSearchParams
): FlightOffer {
  const outbound = offer.slices?.[0]
  const inbound = offer.slices?.[1]
  const outSegs = outbound?.segments ?? []
  const inSegs = inbound?.segments ?? []
  const first = outSegs[0]
  const lastOut = outSegs[outSegs.length - 1] ?? first
  const carrier = first?.marketing_carrier ?? first?.operating_carrier
  const outboundMinutes = parseIsoDurationMinutes(outbound?.duration)
  const returnMinutes =
    inSegs.length > 0 ? parseIsoDurationMinutes(inbound?.duration) : 0

  return {
    id: offer.id,
    origin: first?.origin?.iata_code ?? params.origin,
    destination: lastOut?.destination?.iata_code ?? params.destination,
    departureDate: params.departDate,
    returnDate: params.returnDate,
    price: Math.round(parseFloat(offer.total_amount)),
    currency: offer.total_currency,
    airline: offer.owner?.name ?? carrier?.name ?? 'Unknown',
    airlineLogo: carrier?.logo_symbol_url ?? offer.owner?.logo_symbol_url,
    duration: formatIsoDuration(outbound?.duration),
    totalDurationMinutes: outboundMinutes + returnMinutes,
    stops: countStops(outSegs),
    returnDuration: inSegs.length > 0 ? formatIsoDuration(inbound?.duration) : undefined,
    returnStops: inSegs.length > 0 ? countStops(inSegs) : undefined,
    cabinClass: params.cabinClass,
    totalEmissionsKg: parseEmissionsKg(offer.total_emissions_kg),
    segments: outSegs.map(mapSegment),
    returnSegments: inSegs.length > 0 ? inSegs.map(mapSegment) : undefined,
  }
}

function parseEmissionsKg(value: string | null | undefined): number | undefined {
  if (value == null || value === '') return undefined
  const n = parseFloat(value)
  return Number.isFinite(n) && n > 0 ? Math.round(n) : undefined
}

export interface DuffelSearchParams {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  adults: number
  children?: number
  cabinClass: string
}

export async function searchFlightsDuffel(params: DuffelSearchParams): Promise<FlightOffer[]> {
  const passengers: { type?: string; age?: number }[] = []
  for (let i = 0; i < params.adults; i++) passengers.push({ type: 'adult' })
  for (let i = 0; i < (params.children ?? 0); i++) passengers.push({ type: 'child' })

  const slices: { origin: string; destination: string; departure_date: string }[] = [
    {
      origin: params.origin.toUpperCase(),
      destination: params.destination.toUpperCase(),
      departure_date: params.departDate,
    },
  ]
  if (params.returnDate) {
    slices.push({
      origin: params.destination.toUpperCase(),
      destination: params.origin.toUpperCase(),
      departure_date: params.returnDate,
    })
  }

  const json = await duffelFetch<{ data: { offers?: DuffelOffer[] } }>(
    '/air/offer_requests?return_offers=true&supplier_timeout=25000',
    {
      method: 'POST',
      timeoutMs: 50_000,
      body: {
        data: {
          slices,
          passengers,
          cabin_class: CABIN_MAP[params.cabinClass] ?? 'economy',
        },
      },
    }
  )

  const offers = json.data?.offers ?? []
  return offers
    .map((o) => mapDuffelOffer(o, params))
    .sort((a, b) => a.price - b.price)
    .slice(0, 20)
}

type DuffelOfferPassenger = {
  id: string
  type?: string
}

type DuffelOfferDetail = DuffelOffer & {
  passengers?: DuffelOfferPassenger[]
}

export interface DuffelBookPassengerInput {
  duffelPassengerId: string
  title: string
  gender: 'm' | 'f'
  givenName: string
  familyName: string
  bornOn: string
  email: string
  phoneNumber: string
  passportNumber: string
  passportIssuingCountry: string
  passportExpiresOn: string
}

export interface DuffelCreateOrderParams {
  offerId: string
  passengers: DuffelBookPassengerInput[]
  payments: { type: string; currency: string; amount: string }[]
}

export interface DuffelOrderResult {
  orderId: string
  bookingReference: string | null
  totalAmount: string
  totalCurrency: string
  testMode: boolean
}

export async function getDuffelOffer(offerId: string): Promise<DuffelOfferDetail> {
  const json = await duffelFetch<{ data: DuffelOfferDetail }>(
    `/air/offers/${encodeURIComponent(offerId)}`,
    { timeoutMs: 15_000 }
  )
  return json.data
}

export async function createDuffelOrder(params: DuffelCreateOrderParams): Promise<DuffelOrderResult> {
  const offer = await getDuffelOffer(params.offerId)
  const offerPassengers = offer.passengers ?? []

  if (offerPassengers.length !== params.passengers.length) {
    throw new Error(
      `Število potnikov (${params.passengers.length}) se ne ujema s ponudbo (${offerPassengers.length}).`
    )
  }

  const json = await duffelFetch<{ data: { id: string; booking_reference?: string; total_amount: string; total_currency: string } }>(
    '/air/orders',
    {
      method: 'POST',
      timeoutMs: 45_000,
      body: {
        data: {
          type: 'instant',
          selected_offers: [params.offerId],
          payments: params.payments,
          passengers: params.passengers.map((p, i) => ({
            id: offerPassengers[i].id,
            title: p.title,
            gender: p.gender,
            given_name: p.givenName,
            family_name: p.familyName,
            born_on: p.bornOn,
            email: p.email,
            phone_number: p.phoneNumber,
            identity_documents: [
              {
                type: 'passport',
                unique_identifier: p.passportNumber,
                issuing_country_code: p.passportIssuingCountry.toUpperCase(),
                expires_on: p.passportExpiresOn,
              },
            ],
          })),
        },
      },
    }
  )

  const order = json.data
  const token = getToken()

  return {
    orderId: order.id,
    bookingReference: order.booking_reference ?? null,
    totalAmount: order.total_amount,
    totalCurrency: order.total_currency,
    testMode: token.startsWith('duffel_test_'),
  }
}

export function duffelErrorMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  const lower = msg.toLowerCase()

  if (lower.includes('timeout') || lower.includes('aborted') || lower.includes('pravočasno')) {
    return 'Iskanje traja dlje kot običajno. Poskusi znova čez minuto.'
  }
  if (
    lower.includes('fetch failed') ||
    lower.includes('povezava z duffel') ||
    lower.includes('econnrefused') ||
    lower.includes('network')
  ) {
    return 'Duffel trenutno ni dosegljiv. Preveri internet, ponovno zaženi dev strežnik (npm run dev) in poskusi znova.'
  }
  if (lower.includes('invalid') || lower.includes('not found')) {
    return 'Neveljavno letališče ali datum. Preveri vnos.'
  }
  if (lower.includes('balance') || lower.includes('insufficient')) {
    return 'Duffel račun nima dovolj sredstev za iskanje v live načinu. Preveri Balance v Duffel dashboardu.'
  }
  return msg.length > 120 ? 'Iskanje letov preko Duffel ni uspelo. Poskusi znova.' : msg
}
