import type { FlightSegment } from '@/types/flight.types'

export type FlightTimelinePointKind = 'departure' | 'stopover' | 'arrival'

export interface FlightTimelinePoint {
  kind: FlightTimelinePointKind
  iata: string
  label: string
  at: string
  /** Pri prestopu: čas odhoda na naslednji segment */
  connectionDepartureAt?: string
  layoverMinutes?: number
}

/** Let izbran za sinhronizacijo z AI načrtovalcem poti */
export interface SelectedFlightForAI {
  offerId: string
  airline: string
  origin: string
  destination: string
  price: number
  currency: string
  isRoundTrip: boolean
  outboundDepartureAt: string
  outboundArrivalAt: string
  returnDepartureAt?: string
  returnArrivalAt?: string
  originLabel: string
  destinationLabel: string
  travelNights: number
  /** Časovna premica odhoda (od LJU do končne destinacije) */
  timeline: FlightTimelinePoint[]
  totalDurationMinutes: number
  totalDurationLabel: string
  outboundSegments: FlightSegment[]
}
