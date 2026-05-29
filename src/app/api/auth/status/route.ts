import { NextRequest, NextResponse } from 'next/server'
import {
  buildGoogleOAuthRedirectUri,
  getCanonicalAppUrl,
  getGoogleOAuthRedirectUri,
  getGoogleOAuthRedirectUrisForConsole,
  getRequestUrl,
  resolveOriginFromRequest,
} from '@/lib/safeUrl'
import { getAuthConfigIssues, isAuthConfigured } from '@/lib/authConfig'

export const dynamic = 'force-dynamic'

/** GET /api/auth/status — diagnostika (brez izpostavljanja secretov). */
export async function GET(req: NextRequest) {
  try {
    const requestUrl = getRequestUrl(req)
    const issues = getAuthConfigIssues()
    const configured = isAuthConfigured()
    const canonicalAppUrl = getCanonicalAppUrl()
    const requestOrigin = resolveOriginFromRequest(req)
    const googleRedirectFixed = getGoogleOAuthRedirectUri()
    const googleRedirectFromRequest = requestOrigin
      ? buildGoogleOAuthRedirectUri(requestOrigin)
      : null

    return NextResponse.json({
      ok: configured,
      environment: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV ?? null,
      nextAuthUrl: process.env.NEXTAUTH_URL ?? null,
      nextPublicAppUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
      canonicalAppUrl,
      requestOrigin,
      requestPath: requestUrl?.pathname ?? null,
      requestHost: requestUrl?.host ?? null,
      /** Fiksni redirect_uri v GoogleProvider (produkcija) */
      googleRedirectUriConfigured: googleRedirectFixed,
      /** Dinamičen redirect_uri iz hosta zahteve (samo diagnostika) */
      googleRedirectUriFromRequest: googleRedirectFromRequest,
      googleRedirectUriCanonical: buildGoogleOAuthRedirectUri(),
      googleRedirectUrisForConsole: getGoogleOAuthRedirectUrisForConsole(),
      nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET?.trim(),
      googleOAuthSet:
        !!process.env.GOOGLE_CLIENT_ID?.trim() &&
        !!process.env.GOOGLE_CLIENT_SECRET?.trim(),
      upstashRedisSet:
        !!process.env.UPSTASH_REDIS_REST_URL?.trim() &&
        !!process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
      issues,
      note:
        'Google OAuth vedno uporablja googleRedirectUriConfigured. V Google Console mora biti ta URI med Authorized redirect URIs.',
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Neznana napaka'
    return NextResponse.json(
      {
        ok: false,
        error: 'AuthStatusError',
        message,
      },
      { status: 500 }
    )
  }
}
