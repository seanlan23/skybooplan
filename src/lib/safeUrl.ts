export const DEFAULT_PRODUCTION_URL = 'https://skybooplan.com'
export const DEFAULT_LOCAL_URL = 'http://localhost:3000'

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
    if (isValidAbsoluteUrl(candidate)) {
      return normalizeBaseUrl(candidate!)
    }
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
    if (isValidAbsoluteUrl(candidate)) {
      return normalizeBaseUrl(candidate!)
    }
  }

  return process.env.NODE_ENV === 'production' ? DEFAULT_PRODUCTION_URL : DEFAULT_LOCAL_URL
}

/**
 * Nastavi veljavne URL env vrednosti pred NextAuth SSR/build.
 * Prazna ali neveljavna NEXTAUTH_URL povzroči "TypeError: Invalid URL" med prerenderingom.
 */
export function ensureAuthEnvDefaults(): void {
  if (!isValidAbsoluteUrl(process.env.NEXTAUTH_URL)) {
    process.env.NEXTAUTH_URL = resolveNextAuthUrl()
  } else {
    process.env.NEXTAUTH_URL = normalizeBaseUrl(process.env.NEXTAUTH_URL!)
  }

  if (!isValidAbsoluteUrl(process.env.NEXT_PUBLIC_APP_URL)) {
    process.env.NEXT_PUBLIC_APP_URL = resolveAppBaseUrl()
  } else {
    process.env.NEXT_PUBLIC_APP_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_APP_URL!)
  }
}

// Ob importu modula — varnost med build/SSR (SessionProvider / NextAuth parse-url)
ensureAuthEnvDefaults()
