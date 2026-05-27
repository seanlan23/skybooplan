import { redis } from '@/lib/redis'
import type { BookingContact, PassengerFormData } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'
import type { TripType } from '@/store/useSearchStore'

export type QuoteStatus = 'pending_quote'

export interface StoredQuoteRequest {
  id: string
  reference: string
  createdAt: string
  status: QuoteStatus
  tripType: TripType
  offer: FlightOffer
  passengers: PassengerFormData[]
  contact: BookingContact
}

const QUOTE_INDEX_KEY = 'quotes:index'
const QUOTE_TTL_SECONDS = 60 * 60 * 24 * 90 // 90 dni

function generateReference() {
  const part = Date.now().toString(36).toUpperCase().slice(-5)
  return `SB-${part}`
}

export async function saveQuoteRequest(input: {
  tripType: TripType
  offer: FlightOffer
  passengers: PassengerFormData[]
  contact: BookingContact
}): Promise<StoredQuoteRequest> {
  const id = crypto.randomUUID()
  const record: StoredQuoteRequest = {
    id,
    reference: generateReference(),
    createdAt: new Date().toISOString(),
    status: 'pending_quote',
    tripType: input.tripType,
    offer: input.offer,
    passengers: input.passengers,
    contact: input.contact,
  }

  await redis.set(`quote:${id}`, record, { ex: QUOTE_TTL_SECONDS })

  try {
    const existing = (await redis.get<string[]>(QUOTE_INDEX_KEY)) ?? []
    await redis.set(QUOTE_INDEX_KEY, [id, ...existing].slice(0, 500), {
      ex: QUOTE_TTL_SECONDS,
    })
  } catch {
    // Indeks ni kritičen — posamezen zapis je shranjen
  }

  return record
}

export async function getQuoteRequest(id: string): Promise<StoredQuoteRequest | null> {
  try {
    return await redis.get<StoredQuoteRequest>(`quote:${id}`)
  } catch {
    return null
  }
}
