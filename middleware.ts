import { NextResponse, type NextRequest } from 'next/server'

const CANONICAL_HOST = 'www.skybooplan.com'

export function middleware(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') return NextResponse.next()
  const host = req.headers.get('host') ?? ''
  if (host === 'skybooplan.com') {
    const url = req.nextUrl.clone()
    url.host = CANONICAL_HOST
    return NextResponse.redirect(url, 308)
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
