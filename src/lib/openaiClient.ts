import OpenAI from 'openai'

let cachedClient: OpenAI | null = null

/** Resolves API key at request time (never at module import). */
export function resolveOpenAIApiKey(): string {
  return (
    process.env.OPENAI_API_KEY?.trim() ||
    process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim() ||
    ''
  )
}

/**
 * Lazy OpenAI client — safe for `next build` (no throw on import).
 * Uses a placeholder key only when no env key exists so module evaluation cannot crash the build.
 */
export function getOpenAIClient(): OpenAI {
  if (cachedClient) return cachedClient

  const apiKey = resolveOpenAIApiKey() || 'dummy-key-for-build'
  cachedClient = new OpenAI({ apiKey })
  return cachedClient
}

/** Call at the start of route handlers before real API usage. */
export function assertOpenAIConfigured(): void {
  if (!resolveOpenAIApiKey()) {
    throw new Error('OPENAI_API_KEY environment variable is missing or empty')
  }
}
