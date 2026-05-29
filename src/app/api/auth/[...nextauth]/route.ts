import NextAuth from 'next-auth'
import { NextResponse } from 'next/server'
import { assertAuthEnvConfigured, authOptions } from '@/lib/auth'
import {
  applyRequestOriginToAuthEnv,
  getGoogleOAuthRedirectUri,
  patchAuthRequestForNextAuth,
} from '@/lib/safeUrl'

export const dynamic = 'force-dynamic'

function createHandler() {
  assertAuthEnvConfigured()
  return NextAuth(authOptions)
}

let handler: ReturnType<typeof NextAuth> | null = null

function getHandler() {
  if (!handler) {
    handler = createHandler()
  }
  return handler
}

async function handleAuth(
  req: Request,
  context: { params: { nextauth: string[] } }
) {
  const origin = applyRequestOriginToAuthEnv(req)
  const authReq = patchAuthRequestForNextAuth(req)

  try {
    return await getHandler()(authReq, context)
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'NextAuth konfiguracija nepopolna'
    console.error('[auth]', message, {
      requestOrigin: origin,
      googleRedirectUri: getGoogleOAuthRedirectUri(),
    })

    return NextResponse.json(
      {
        error: 'AuthConfigurationError',
        message,
        hint: 'Preveri /api/auth/status in Environment Variables na Vercel.',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  req: Request,
  context: { params: { nextauth: string[] } }
) {
  return handleAuth(req, context)
}

export async function POST(
  req: Request,
  context: { params: { nextauth: string[] } }
) {
  return handleAuth(req, context)
}
