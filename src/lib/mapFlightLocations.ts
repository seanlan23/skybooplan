import { FALLBACK_AIRPORTS } from '@/data/airports'
import type { Location } from '@/components/map/AnimatedMap'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'
import type { Airport } from '@/types/flight.types'

/** Known IATA → [longitude, latitude] for map rendering */
const IATA_COORDINATES: Record<string, [number, number]> = Object.fromEntries(
  FALLBACK_AIRPORTS.filter((a) => a.lat != null && a.lon != null).map((a) => [
    a.iata,
    [a.lon!, a.lat!] as [number, number],
  ])
)

export function coordinatesForIata(
  iata: string,
  airports?: { iata: string; lat?: number; lon?: number }[]
): [number, number] | null {
  const code = iata.trim().toUpperCase()
  const fromSearch = airports?.find((a) => a.iata === code)
  if (fromSearch?.lon != null && fromSearch.lat != null) {
    return [fromSearch.lon, fromSearch.lat]
  }
  return IATA_COORDINATES[code] ?? null
}

/** Odhod (npr. ZAG) → cilj (npr. BKK) za animirano pot. */
export function locationsFromSelectedFlight(
  flight: SelectedFlightForAI,
  searchAirports?: Airport[]
): Location[] {
  const originCoord = coordinatesForIata(flight.origin, searchAirports)
  const destCoord = coordinatesForIata(flight.destination, searchAirports)

  const locations: Location[] = []

  if (originCoord) {
    locations.push({
      name: flight.originLabel || flight.origin,
      coordinates: originCoord,
    })
  }

  if (destCoord) {
    locations.push({
      name: flight.destinationLabel || flight.destination,
      coordinates: destCoord,
    })
  }

  return locations
}

/** Začetni center na mestu odhoda (Zagreb / LJU …). */
export function departureCenterFromLocations(locations: Location[]): [number, number] | null {
  if (locations.length === 0) return null
  return locations[0].coordinates
}
