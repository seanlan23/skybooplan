import { NextResponse } from 'next/server'
import {
  buildGoogleOAuthRedirectUri,
  getCanonicalAppUrl,
  getGoogleOAuthRedirectUrisForConsole,
  resolveOriginFromRequest,
} from '@/lib/safeUrl'
import { getAuthConfigIssues, isAuthConfigured } from '@/lib/authConfig'

export const dynamic = 'force-dynamic'

/** GET /api/auth/status — diagnostika (brez izpostavljanja secretov). */
export async function GET(req: Request) {
  const issues = getAuthConfigIssues()
  const configured = isAuthConfigured()
  const canonicalAppUrl = getCanonicalAppUrl()
  const requestOrigin = resolveOriginFromRequest(req)
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
    /** Točen redirect_uri, ki ga NextAuth pošlje Google-u iz TE zahteve */
    googleRedirectUriUsedNow: googleRedirectFromRequest,
    /** Kanonični redirect_uri (NEXTAUTH_URL) */
    googleRedirectUriCanonical: buildGoogleOAuthRedirectUri(),
    /** Vse URI-je dodaj v Google Cloud Console → Authorized redirect URIs */
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
      'NEXTAUTH_URL na Vercelu je samo fallback ob buildu. Ob prijavi se redirect_uri gradi iz hosta zahteve (www ali brez www). googleRedirectUriUsedNow mora biti v Google Console.',
  })
}
