import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/integrations/supabase/middleware';

const CANONICAL_HOST = 'www.skybooplan.com';

export async function middleware(req: NextRequest) {
  if (process.env.NODE_ENV === 'production') {
    const host = req.headers.get('host') ?? '';
    if (host === 'skybooplan.com') {
      const url = req.nextUrl.clone();
      url.host = CANONICAL_HOST;
      return NextResponse.redirect(url, 308);
    }
  }

  return updateSession(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'],
};
