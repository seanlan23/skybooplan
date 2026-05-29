export const DEFAULT_PRODUCTION_URL = 'https://www.skybooplan.com'
export const DEFAULT_LOCAL_URL = 'http://localhost:3000'
export const NEXTAUTH_BASE_PATH = '/api/auth'
export const GOOGLE_OAUTH_CALLBACK_PATH = `${NEXTAUTH_BASE_PATH}/callback/google`
export const DEFAULT_PRODUCTION_GOOGLE_REDIRECT_URI = `${DEFAULT_PRODUCTION_URL}${GOOGLE_OAUTH_CALLBACK_PATH}`

/** Vercel preview URL-ji (npr. skybooplan-xxx.vercel.app) niso veljavni za Google OAuth. */
export function isVercelPreviewHost(value: string): boolean {
  return value.includes('.vercel.app')
}

/** Preveri, ali je niz veljaven absolutni http(s) URL. */
export function isValidAbsoluteUrl(value: string | undefined | null): boolean {
  if (!value?.trim()) return false
  try {
    const parsed = new URL(value.trim())
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/** Poskusi popraviti URL (doda https://, odstrani / na koncu). */
export function coalesceAbsoluteUrl(value: string | undefined | null): string | null {
  const trimmed = value?.trim()
  if (!trimmed) return null

  const candidates = trimmed.startsWith('http') ? [trimmed] : [`https://${trimmed}`, `http://${trimmed}`]
  for (const candidate of candidates) {
    if (isValidAbsoluteUrl(candidate)) {
      return normalizeBaseUrl(candidate)
    }
  }
  return null
}

/** Odstrani končno poševnico. */
export function normalizeBaseUrl(value: string): string {
  return value.trim().replace(/\/+$/, '')
}

/** Varno ustvari URL — vrne null namesto izjeme. */
export function safeNewUrl(input: string | undefined | null, base?: string): URL | null {
  const trimmed = input?.trim()
  if (!trimmed) return null
  try {
    return base ? new URL(trimmed, base) : new URL(trimmed)
  } catch {
    return null
  }
}

/** Varno preberi URL iz Next.js / Fetch Request (podpira relativni req.url). */
export function getRequestUrl(req: Request): URL | null {
  try {
    const raw = req.url?.trim()
    if (!raw) return null

    if (raw.startsWith('http://') || raw.startsWith('https://')) {
      return new URL(raw)
    }

    const host =
      req.headers.get('x-forwarded-host')?.split(',')[0]?.trim() ||
      req.headers.get('host')?.split(',')[0]?.trim()
    if (!host) return null

    const proto = req.headers.get('x-forwarded-proto')?.split(',')[0]?.trim() || 'https'
    return new URL(raw, `${proto}://${host}`)
  } catch {
    return null
  }
}

/**
 * redirect_uri, ki ga Google Provider vedno pošlje Google-u.
 * V produkciji vedno www.skybooplan.com — nikoli Vercel preview URL.
 */
export function getGoogleOAuthRedirectUri(): string {
  const fromEnv = process.env.GOOGLE_OAUTH_REDIRECT_URI?.trim()
  if (fromEnv?.includes('/callback/')) {
    return fromEnv
  }

  if (process.env.NODE_ENV === 'development') {
    return `${DEFAULT_LOCAL_URL}${GOOGLE_OAUTH_CALLBACK_PATH}`
  }

  return DEFAULT_PRODUCTION_GOOGLE_REDIRECT_URI
}

/** Priporočen NEXTAUTH_URL — brez Vercel preview URL-jev v produkciji. */
export function resolveNextAuthUrl(): string {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NODE_ENV === 'production' ? undefined : (
      process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined
    ),
    process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL,
  ]

  for (const candidate of candidates) {
    const resolved = coalesceAbsoluteUrl(candidate)
    if (resolved && !isVercelPreviewHost(resolved)) {
      return resolved
    }
  }

  return process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL
}

/** Priporočen app base URL (NEXT_PUBLIC_APP_URL). */
export function resolveAppBaseUrl(): string {
  return resolveNextAuthUrl()
}

/** Kanonični URL aplikacije (produkcija → www.skybooplan.com). */
export function getCanonicalAppUrl(): string {
  ensureAuthEnvDefaults()
  return resolveNextAuthUrl()
}

/** Google OAuth redirect URI iz izbranega origin-a. */
export function buildGoogleOAuthRedirectUri(origin?: string): string {
  if (process.env.NODE_ENV === 'production' && !origin) {
    return getGoogleOAuthRedirectUri()
  }
  const base = coalesceAbsoluteUrl(origin) ?? getCanonicalAppUrl()
  if (isVercelPreviewHost(base)) {
    return getGoogleOAuthRedirectUri()
  }
  return `${base}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

/** Seznam redirect URI-jev za Google Cloud Console. */
export function getGoogleOAuthRedirectUrisForConsole(): string[] {
  return [
    DEFAULT_PRODUCTION_GOOGLE_REDIRECT_URI,
    `https://skybooplan.com${GOOGLE_OAUTH_CALLBACK_PATH}`,
    `${DEFAULT_LOCAL_URL}${GOOGLE_OAUTH_CALLBACK_PATH}`,
  ]
}

/** Origin iz HTTP zahteve (samo diagnostika — ne za OAuth v produkciji). */
export function resolveOriginFromRequest(req: Request): string | null {
  const requestUrl = getRequestUrl(req)
  if (requestUrl?.host) {
    const fromUrl = coalesceAbsoluteUrl(`${requestUrl.protocol}//${requestUrl.host}`)
    if (fromUrl) return fromUrl
  }

  const headers = req.headers
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || headers.get('host')?.split(',')[0]?.trim()
  if (!host) return null

  const protoHeader = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = protoHeader === 'http' ? 'http' : 'https'
  return coalesceAbsoluteUrl(`${protocol}://${host}`)
}

/** V produkciji vedno prava domena — nikoli *.vercel.app. */
export function ensureProductionAuthUrl(): string {
  const canonical = coalesceAbsoluteUrl(process.env.NEXTAUTH_URL)
  const url =
    canonical && !isVercelPreviewHost(canonical) ? canonical : DEFAULT_PRODUCTION_URL
  process.env.NEXTAUTH_URL = url
  return url
}

/** Pripravi auth request — produkcija uporablja fiksno domeno. */
export function applyRequestOriginToAuthEnv(req: Request): string {
  if (process.env.NODE_ENV === 'production') {
    return ensureProductionAuthUrl()
  }

  const origin = resolveOriginFromRequest(req)
  if (origin && !isVercelPreviewHost(origin)) {
    process.env.NEXTAUTH_URL = origin
    return origin
  }

  ensureAuthEnvDefaults()
  return process.env.NEXTAUTH_URL ?? DEFAULT_LOCAL_URL
}

/** Popravi headerje, da NextAuth callback ujema produkcijsko domeno. */
export function patchAuthRequestForNextAuth(req: Request): Request {
  const origin =
    process.env.NODE_ENV === 'production'
      ? ensureProductionAuthUrl()
      : applyRequestOriginToAuthEnv(req)

  const parsed = safeNewUrl(origin)
  if (!parsed) return req

  const headers = new Headers(req.headers)
  headers.set('x-forwarded-host', parsed.host)
  headers.set('host', parsed.host)
  headers.set('x-forwarded-proto', parsed.protocol === 'http:' ? 'http' : 'https')

  const init: RequestInit & { duplex?: 'half' } = {
    method: req.method,
    headers,
    redirect: req.redirect,
  }

  if (req.method !== 'GET' && req.method !== 'HEAD' && req.body) {
    init.body = req.body
    init.duplex = 'half'
  }

  const requestUrl = getRequestUrl(req)
  const targetUrl = requestUrl
    ? `${parsed.origin}${requestUrl.pathname}${requestUrl.search}`
    : req.url

  return new Request(targetUrl, init)
}

/** Nastavi NEXTAUTH_URL samo če manjka (build/SSR). */
export function ensureAuthEnvDefaults(): void {
  if (coalesceAbsoluteUrl(process.env.NEXTAUTH_URL) && !isVercelPreviewHost(process.env.NEXTAUTH_URL!)) {
    return
  }
  process.env.NEXTAUTH_URL = resolveNextAuthUrl()
}

ensureAuthEnvDefaults()
