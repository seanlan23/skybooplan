import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { assertAuthEnvConfigured, authOptions } from '@/lib/auth'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

let handler: ReturnType<typeof NextAuth> | null = null
function getHandler() {
  if (!handler) {
    assertAuthEnvConfigured()
    handler = NextAuth(authOptions)
  }
  return handler
}

async function handle(req: Request, context: { params: { nextauth: string[] } }) {
  try {
    return await getHandler()(req, context)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'NextAuth konfiguracija nepopolna'
    console.error('[auth] handler error:', message)
    return NextResponse.json(
      { error: 'AuthConfigurationError', message, hint: 'Glej /api/auth/status' },
      { status: 500 }
    )
  }
}

export async function GET(req: Request, ctx: { params: { nextauth: string[] } }) {
  return handle(req, ctx)
}
export async function POST(req: Request, ctx: { params: { nextauth: string[] } }) {
  return handle(req, ctx)
}
