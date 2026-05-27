import greatCircle from '@turf/great-circle'
import { lineString } from '@turf/helpers'
import type { Feature, LineString } from 'geojson'
import { LngLatBounds } from 'mapbox-gl'

const FLAT = { pitch: 0, bearing: 0 } as const

export const MAP_PRIMARY = '#0ea5e9'
export const FLIGHT_ANIMATION_MS = 3500
export const FIT_PADDING_FLIGHT = { top: 72, bottom: 72, left: 72, right: 72 }
export const FIT_PADDING_MARKERS = 60

/** Velik krog — ukrivljena pot leta (GeoJSON LineString). */
export function buildFlightArc(
  from: [number, number],
  to: [number, number]
): [number, number][] {
  const gc = greatCircle(from, to, { npoints: 128 })
  if (!gc) {
    return [from, to]
  }
  const geom = gc.geometry
  if (geom.type === 'LineString') {
    return geom.coordinates as [number, number][]
  }
  if (geom.type === 'MultiLineString') {
    return geom.coordinates.flat() as [number, number][]
  }
  return [from, to]
}

export function coordAtProgress(
  coords: [number, number][],
  progress: number
): [number, number] {
  if (coords.length === 0) return [0, 0]
  if (coords.length === 1) return coords[0]
  const t = Math.min(1, Math.max(0, progress))
  const total = coords.length - 1
  const scaled = t * total
  const i = Math.min(total - 1, Math.floor(scaled))
  const segT = scaled - i
  const a = coords[i]
  const b = coords[i + 1]
  return [a[0] + (b[0] - a[0]) * segT, a[1] + (b[1] - a[1]) * segT]
}

export function sliceLineToProgress(
  coords: [number, number][],
  progress: number
): [number, number][] {
  if (coords.length < 2) return coords
  const end = coordAtProgress(coords, progress)
  const out: [number, number][] = [coords[0]]
  const total = coords.length - 1
  const scaled = Math.min(1, Math.max(0, progress)) * total
  const completed = Math.min(total, Math.floor(scaled))
  for (let i = 1; i <= completed; i++) {
    out.push(coords[i])
  }
  if (completed < total) {
    out.push(end)
  }
  return out
}

/** Približek države okoli destinacije (pan brez zooma na mesto). */
export function countryBoundsAround(
  center: [number, number],
  padDegrees = 5
): LngLatBounds {
  const [lng, lat] = center
  return new LngLatBounds(
    [lng - padDegrees, lat - padDegrees],
    [lng + padDegrees, lat + padDegrees]
  )
}

export function boundsFromCoords(
  coords: [number, number][],
  padding = FIT_PADDING_MARKERS
): LngLatBounds | null {
  if (coords.length === 0) return null
  const b = new LngLatBounds()
  for (const c of coords) {
    b.extend(c)
  }
  return b
}

export function lineFeature(coords: [number, number][]): Feature<LineString> {
  return lineString(coords.length >= 2 ? coords : [coords[0] ?? [0, 0], coords[0] ?? [0, 0]])
}

export { FLAT }
