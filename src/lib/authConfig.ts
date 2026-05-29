import {
  DEFAULT_PRODUCTION_URL,
  ensureAuthEnvDefaults,
  isValidAbsoluteUrl,
  resolveAppBaseUrl,
  resolveNextAuthUrl,
} from '@/lib/safeUrl'

export type AuthConfigIssue = {
  key: string
  message: string
  required: boolean
}

export function getAuthConfigIssues(): AuthConfigIssue[] {
  const issues: AuthConfigIssue[] = []

  if (!process.env.NEXTAUTH_SECRET?.trim()) {
    issues.push({
      key: 'NEXTAUTH_SECRET',
      message: 'Manjka — generiraj z: openssl rand -base64 32',
      required: true,
    })
  }

  const url = process.env.NEXTAUTH_URL?.trim()
  if (!isValidAbsoluteUrl(url)) {
    issues.push({
      key: 'NEXTAUTH_URL',
      message: `Manjka ali neveljavna — uporabi ${DEFAULT_PRODUCTION_URL} (brez končne /)`,
      required: true,
    })
  } else if (url!.endsWith('/')) {
    issues.push({
      key: 'NEXTAUTH_URL',
      message: 'Ne sme imeti končne poševnice (/)',
      required: true,
    })
  } else if (process.env.NODE_ENV === 'production' && !url!.startsWith('https://')) {
    issues.push({
      key: 'NEXTAUTH_URL',
      message: 'V produkciji mora biti https://',
      required: true,
    })
  }

  const googleId = process.env.GOOGLE_CLIENT_ID?.trim()
  const googleSecret = process.env.GOOGLE_CLIENT_SECRET?.trim()
  if (!googleId || !googleSecret) {
    issues.push({
      key: 'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET',
      message: 'Manjka — Google prijava ne bo delovala',
      required: false,
    })
  }

  const hasRedis =
    !!process.env.UPSTASH_REDIS_REST_URL?.trim() &&
    !!process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (process.env.NODE_ENV === 'production' && !hasRedis) {
    issues.push({
      key: 'UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN',
      message:
        'Manjka — email/geslo računi se na Vercel ne bodo shranili (serverless pomnilnik)',
      required: false,
    })
  }

  return issues
}

export function assertAuthEnvConfigured(): void {
  ensureAuthEnvDefaults()
  const blocking = getAuthConfigIssues().filter((i) => i.required)
  if (blocking.length === 0) return

  const list = blocking.map((i) => `${i.key}: ${i.message}`).join('; ')
  throw new Error(`NextAuth konfiguracija nepopolna — ${list}`)
}

export function isAuthConfigured(): boolean {
  ensureAuthEnvDefaults()
  return getAuthConfigIssues().filter((i) => i.required).length === 0
}

export function suggestedNextAuthUrl(): string {
  return resolveNextAuthUrl()
}

export { ensureAuthEnvDefaults, resolveAppBaseUrl, resolveNextAuthUrl }
