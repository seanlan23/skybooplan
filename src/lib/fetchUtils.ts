/** Ali je napaka posledica preklica fetch (AbortController). */
export function isAbortError(error: unknown): boolean {
  if (error instanceof DOMException && error.name === 'AbortError') return true
  if (error instanceof Error && error.name === 'AbortError') return true
  return false
}
