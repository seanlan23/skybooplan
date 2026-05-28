import greatCircle from '@turf/great-circle'
import distance from '@turf/distance'
import { lineString, point } from '@turf/helpers'
import midpoint from '@turf/midpoint'
import type { Feature, LineString } from 'geojson'
import type { ItineraryTransportType, TransportFromPrevious } from '@/types/itinerary.types'

export type TransportType = 'flight' | 'ferry' | 'car' | 'bus'

export interface RoutePoint {
  coords: [number, number]
  cityName: string
  kind: 'departure' | 'day' | 'destination'
  transportFromPrevious?: TransportFromPrevious | null
}

export interface RouteSegment {
  id: string
  from: RoutePoint
  to: RoutePoint
  transport: TransportType
  distanceKm: number
  coordinates: [number, number][]
  midpoint: [number, number]
  emoji: string
  tooltip: string
}

export interface ItineraryDayRouteInput {
  dayNumber: number
  coords: [number, number]
  cityName: string
  transportFromPrevious?: TransportFromPrevious | null
}

const ISLANDS = [
  'Palawan',
  'Cebu',
  'Boracay',
  'Siargao',
  'Bohol',
  'Phuket',
  'Koh Samui',
  'Bali',
  'Lombok',
  'Gili',
  'Phu Quoc',
  'Con Dao',
  'Langkawi',
  'Penang',
  'Puerto Galera',
  'Coron',
  'El Nido',
]

const TRANSPORT_EMOJI: Record<TransportType, string> = {
  flight: '✈️',
  ferry: '⛴️',
  car: '🚗',
  bus: '🚌',
}

const TRANSPORT_LABEL: Record<TransportType, string> = {
  flight: 'Letalo',
  ferry: 'Trajekt',
  car: 'Avto',
  bus: 'Avtobus',
}

const SPEED_KMH: Record<TransportType, number> = {
  flight: 800,
  ferry: 30,
  car: 60,
  bus: 70,
}

export function isIslandCity(cityName: string): boolean {
  const lower = cityName.toLowerCase()
  return ISLANDS.some((island) => lower.includes(island.toLowerCase()))
}

export function isIslandRoute(cityA: string, cityB: string): boolean {
  const a = isIslandCity(cityA)
  const b = isIslandCity(cityB)
  return (a && !b) || (!a && b) || (a && b)
}

export function segmentDistanceKm(
  from: [number, number],
  to: [number, number]
): number {
  return distance(point(from), point(to), { units: 'kilometers' })
}

export function parseAiTransportType(
  type?: string | null
): TransportType | 'none' | null {
  const t = type?.toLowerCase().trim()
  if (t === 'flight') return 'flight'
  if (t === 'ferry') return 'ferry'
  if (t === 'car') return 'car'
  if (t === 'bus') return 'bus'
  if (t === 'none') return 'none'
  return null
}

export function resolveTransportType(
  from: RoutePoint,
  to: RoutePoint,
  distanceKm: number
): TransportType {
  if (from.kind === 'departure') return 'flight'
  if (distanceKm > 300) return 'flight'
  if (isIslandRoute(from.cityName, to.cityName)) return 'ferry'
  if (distanceKm < 100) return 'bus'
  return 'car'
}

function extractLineCoords(
  from: [number, number],
  to: [number, number],
  transport: TransportType
): [number, number][] {
  if (transport === 'car' || transport === 'bus') {
    return [from, to]
  }

  const npoints = transport === 'flight' ? 64 : 28
  const gc = greatCircle(from, to, { npoints })
  if (!gc) return [from, to]

  const geom = gc.geometry
  if (geom.type === 'LineString') {
    return geom.coordinates as [number, number][]
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.flat() as [number, number][]
  }
  return [from, to]
}

export function midpointOnLine(coords: [number, number][]): [number, number] {
  if (coords.length < 2) return coords[0] ?? [0, 0]
  const midIdx = Math.floor((coords.length - 1) / 2)
  const a = coords[midIdx]
  const b = coords[midIdx + 1] ?? a
  const mp = midpoint(point(a), point(b))
  return mp.geometry.coordinates as [number, number]
}

export function formatTravelTooltip(transport: TransportType, distanceKm: number): string {
  const hours = distanceKm / SPEED_KMH[transport]
  const label = TRANSPORT_LABEL[transport]
  if (hours < 1) {
    return `${label} ~${Math.max(15, Math.round(hours * 60))} min`
  }
  const rounded = hours < 10 ? Math.round(hours * 10) / 10 : Math.round(hours)
  return `${label} ~${rounded}h`
}

function transportTooltipFromAi(
  ai: TransportFromPrevious | null | undefined,
  transport: TransportType,
  distanceKm: number
): string {
  if (ai?.description?.trim()) return ai.description.trim()
  const parts: string[] = [TRANSPORT_LABEL[transport]]
  if (ai?.duration?.trim()) parts.push(ai.duration.trim())
  if (ai?.cost?.trim()) parts.push(ai.cost.trim())
  if (parts.length > 1) return parts.join(' · ')
  return formatTravelTooltip(transport, distanceKm)
}

export function buildRouteSegment(
  id: string,
  from: RoutePoint,
  to: RoutePoint
): RouteSegment | null {
  const parsed = parseAiTransportType(to.transportFromPrevious?.type)
  if (parsed === 'none') return null

  const distanceKm = segmentDistanceKm(from.coords, to.coords)
  const transport = parsed ?? resolveTransportType(from, to, distanceKm)
  const coordinates = extractLineCoords(from.coords, to.coords, transport)

  return {
    id,
    from,
    to,
    transport,
    distanceKm,
    coordinates,
    midpoint: midpointOnLine(coordinates),
    emoji: TRANSPORT_EMOJI[transport],
    tooltip: transportTooltipFromAi(to.transportFromPrevious, transport, distanceKm),
  }
}

/** Zaporedni segmenti: odhod → dnevi (po številu) → opcijsko destinacija. */
export function buildItineraryRouteSegments(
  departure: RoutePoint,
  days: ItineraryDayRouteInput[],
  destination?: RoutePoint | null
): RouteSegment[] {
  const sorted = [...days].sort((a, b) => a.dayNumber - b.dayNumber)
  const chain: RoutePoint[] = [departure]

  for (const d of sorted) {
    chain.push({
      coords: d.coords,
      cityName: d.cityName,
      kind: 'day',
      transportFromPrevious: d.transportFromPrevious,
    })
  }

  if (
    destination &&
    (chain.length === 1 ||
      chain[chain.length - 1]!.coords[0] !== destination.coords[0] ||
      chain[chain.length - 1]!.coords[1] !== destination.coords[1])
  ) {
    chain.push(destination)
  }

  const segments: RouteSegment[] = []
  for (let i = 0; i < chain.length - 1; i++) {
    const to = chain[i + 1]!
    const seg = buildRouteSegment(`seg-${i}`, chain[i]!, to)
    if (seg) segments.push(seg)
  }
  return segments
}

export function segmentsToGeoJson(
  segments: RouteSegment[]
): Feature<LineString>[] {
  return segments.map((seg) =>
    lineString(seg.coordinates, {
      transport: seg.transport,
      segmentId: seg.id,
    })
  )
}

/** Map itinerary transport type to map layer type (excludes "none"). */
export function mapTransportTypeForMap(
  type?: ItineraryTransportType | string | null
): TransportType | null {
  const parsed = parseAiTransportType(type)
  if (!parsed || parsed === 'none') return null
  return parsed
}
