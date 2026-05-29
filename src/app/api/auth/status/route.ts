import { NextResponse } from 'next/server'
import { getAuthConfigIssues, isAuthConfigured } from '@/lib/authConfig'

export const dynamic = 'force-dynamic'

/** GET /api/auth/status — diagnostika (brez izpostavljanja secretov). */
export async function GET() {
  const issues = getAuthConfigIssues()
  const configured = isAuthConfigured()

  return NextResponse.json({
    ok: configured,
    environment: process.env.NODE_ENV,
    nextAuthUrlSet: !!process.env.NEXTAUTH_URL?.trim(),
    nextAuthSecretSet: !!process.env.NEXTAUTH_SECRET?.trim(),
    googleOAuthSet:
      !!process.env.GOOGLE_CLIENT_ID?.trim() &&
      !!process.env.GOOGLE_CLIENT_SECRET?.trim(),
    upstashRedisSet:
      !!process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      !!process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
    issues,
    googleRedirectUriProduction: 'https://skybooplan.com/api/auth/callback/google',
    googleRedirectUriLocal: 'http://localhost:3000/api/auth/callback/google',
  })
}
