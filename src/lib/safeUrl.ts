export const DEFAULT_PRODUCTION_URL = 'https://skybooplan.com'
export const DEFAULT_LOCAL_URL = 'http://localhost:3000'
export const NEXTAUTH_BASE_PATH = '/api/auth'
export const GOOGLE_OAUTH_CALLBACK_PATH = `${NEXTAUTH_BASE_PATH}/callback/google`

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

/** Priporočen NEXTAUTH_URL z fallbackom (produkcija → skybooplan.com). */
export function resolveNextAuthUrl(): string {
  const candidates = [
    process.env.NEXTAUTH_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL,
  ]

  for (const candidate of candidates) {
    const resolved = coalesceAbsoluteUrl(candidate)
    if (resolved) return resolved
  }

  return DEFAULT_PRODUCTION_URL
}

/** Priporočen app base URL (NEXT_PUBLIC_APP_URL). */
export function resolveAppBaseUrl(): string {
  const candidates = [
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.NEXTAUTH_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
    process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL,
  ]

  for (const candidate of candidates) {
    const resolved = coalesceAbsoluteUrl(candidate)
    if (resolved) return resolved
  }

  return process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL
}

/** Kanonični URL aplikacije (NEXTAUTH_URL → NEXT_PUBLIC_APP_URL → fallback). */
export function getCanonicalAppUrl(): string {
  ensureAuthEnvDefaults()
  return resolveNextAuthUrl()
}

/** Google OAuth redirect URI, ki ga NextAuth pošlje v Google. */
export function buildGoogleOAuthRedirectUri(origin?: string): string {
  const base = coalesceAbsoluteUrl(origin) ?? getCanonicalAppUrl()
  return `${base}${GOOGLE_OAUTH_CALLBACK_PATH}`
}

/** Seznam redirect URI-jev za Google Cloud Console. */
export function getGoogleOAuthRedirectUrisForConsole(): string[] {
  const canonical = getCanonicalAppUrl()
  const parsed = safeNewUrl(canonical)
  if (!parsed) return [buildGoogleOAuthRedirectUri()]

  const hosts = new Set<string>([parsed.host])
  if (parsed.host.startsWith('www.')) {
    hosts.add(parsed.host.slice(4))
  } else if (!parsed.host.includes('localhost') && !parsed.host.includes('127.0.0.1')) {
    hosts.add(`www.${parsed.host}`)
  }

  const vercelHost = process.env.VERCEL_URL?.trim()
  if (vercelHost) hosts.add(vercelHost)

  return Array.from(hosts).map(
    (host) => `${parsed.protocol}//${host}${GOOGLE_OAUTH_CALLBACK_PATH}`
  )
}

/**
 * Origin iz HTTP zahteve (enako logiko uporablja NextAuth na Vercelu).
 * NextAuth na Vercelu ignorira NEXTAUTH_URL in uporabi x-forwarded-host.
 */
export function resolveOriginFromRequest(req: Request): string | null {
  const headers = req.headers
  const forwardedHost = headers.get('x-forwarded-host')?.split(',')[0]?.trim()
  const host = forwardedHost || headers.get('host')?.split(',')[0]?.trim()
  if (!host) return null

  const protoHeader = headers.get('x-forwarded-proto')?.split(',')[0]?.trim()
  const protocol = protoHeader === 'http' ? 'http' : 'https'
  return coalesceAbsoluteUrl(`${protocol}://${host}`)
}

/**
 * Nastavi veljavne URL env vrednosti pred NextAuth SSR/build.
 * Prazna ali neveljavna NEXTAUTH_URL povzroči "TypeError: Invalid URL" med prerenderingom.
 * NEXT_PUBLIC_APP_URL ne mutiramo — webpack jo inline-a v client bundle.
 */
export function ensureAuthEnvDefaults(): void {
  const nextAuth = coalesceAbsoluteUrl(process.env.NEXTAUTH_URL) ?? resolveNextAuthUrl()
  process.env.NEXTAUTH_URL = nextAuth
}

// Ob importu modula — varnost med build/SSR (SessionProvider / NextAuth parse-url)
ensureAuthEnvDefaults()
