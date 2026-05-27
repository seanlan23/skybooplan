import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { saveQuoteRequest } from '@/lib/quoteStorage'
import type { PackageQuoteResponse } from '@/types/booking.types'
import type { FlightOffer } from '@/types/flight.types'

const passengerSchema = z.object({
  givenName: z.string().min(1).max(80),
  familyName: z.string().min(1).max(80),
  bornOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  gender: z.enum(['male', 'female']),
  title: z.enum(['mr', 'mrs', 'ms', 'miss']),
  passportNumber: z.string().min(3).max(32),
  passportIssuingCountry: z.string().length(2),
  passportExpiresOn: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

const offerSchema = z.object({
  id: z.string().min(1),
  origin: z.string().length(3),
  destination: z.string().length(3),
  departureDate: z.string(),
  returnDate: z.string().optional(),
  price: z.number(),
  currency: z.string(),
  airline: z.string(),
  duration: z.string(),
  stops: z.number(),
  cabinClass: z.string(),
  segments: z.array(z.unknown()),
  returnSegments: z.array(z.unknown()).optional(),
})

const quoteSchema = z.object({
  offer: offerSchema,
  passengers: z.array(passengerSchema).min(1).max(9),
  contact: z.object({
    email: z.string().email(),
    phone: z.string().min(8).max(20),
  }),
  tripType: z.enum(['one_way', 'return']),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = quoteSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Neveljavni podatki obrazca.' } satisfies PackageQuoteResponse,
        { status: 400 }
      )
    }

    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shramba predračunov (Redis) ni nastavljena.',
        } satisfies PackageQuoteResponse,
        { status: 500 }
      )
    }

    const { offer, passengers, contact, tripType } = parsed.data

    const saved = await saveQuoteRequest({
      tripType,
      offer: offer as FlightOffer,
      passengers,
      contact,
    })

    return NextResponse.json({
      success: true,
      quoteId: saved.id,
      reference: saved.reference,
      message:
        'Zahteva za predračun je shranjena. Stranki lahko pošljete ponudbo na podlagi referenčne številke.',
    } satisfies PackageQuoteResponse)
  } catch (err) {
    console.error('[flights/book quote]', err)
    return NextResponse.json(
      {
        success: false,
        error: 'Shranjevanje zahteve ni uspelo. Poskusi znova.',
      } satisfies PackageQuoteResponse,
      { status: 500 }
    )
  }
}
