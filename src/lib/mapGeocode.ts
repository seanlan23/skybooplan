/** Geokodiranje prek internega API (Mapbox). */
export async function geocodePlace(
  query: string,
  signal?: AbortSignal
): Promise<[number, number] | null> {
  const q = query.trim()
  if (!q) return null

  try {
    const res = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, { signal })
    if (!res.ok) return null
    const data = (await res.json()) as { lng?: number; lat?: number }
    if (typeof data.lng === 'number' && typeof data.lat === 'number') {
      return [data.lng, data.lat]
    }
    return null
  } catch {
    return null
  }
}
