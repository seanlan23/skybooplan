import { NextRequest, NextResponse } from 'next/server'
import { runHotelsSearch } from '@/lib/hotelsSearch'

/** @deprecated Uporabi /api/hotels — ohranjen za združljivost */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    return runHotelsSearch(body)
  } catch (err) {
    console.error('Accommodations error:', err)
    return NextResponse.json(
      { error: 'Iskanje hotelov ni uspelo.', results: [] },
      { status: 500 }
    )
  }
}
