import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getCanonicalAppUrl, safeNewUrl } from '@/lib/safeUrl'

/**
 * V produkciji preusmeri na kanonično domeno iz NEXTAUTH_URL.
 * NextAuth na Vercelu za Google OAuth uporablja host iz zahteve (ne NEXTAUTH_URL),
 * zato mora biti ta host enak URI-jem v Google Cloud Console.
 */
export function middleware(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'production') {
    return NextResponse.next()
  }

  const canonical = safeNewUrl(getCanonicalAppUrl())
  if (!canonical) return NextResponse.next()

  const requestHost =
    request.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
    request.headers.get('host')?.split(',')[0]?.trim()

  if (!requestHost || requestHost === canonical.host) {
    return NextResponse.next()
  }

  const redirectUrl = request.nextUrl.clone()
  redirectUrl.protocol = canonical.protocol
  redirectUrl.host = canonical.host

  return NextResponse.redirect(redirectUrl, 308)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
