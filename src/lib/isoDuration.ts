/** ISO 8601 trajanje (npr. PT2H30M, P1DT16H55M) → minute */
export function isoDurationToMinutes(iso?: string): number {
  if (!iso?.startsWith('P')) return 0

  const match = iso.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?)?$/i)
  if (!match) return 0

  const days = parseInt(match[1] ?? '0', 10)
  const hours = parseInt(match[2] ?? '0', 10)
  const minutes = parseInt(match[3] ?? '0', 10)
  return days * 24 * 60 + hours * 60 + minutes
}

/** Človeško berljivo trajanje za kartice (npr. 1d 16h 55m) */
export function formatIsoDurationHuman(iso?: string): string {
  if (!iso) return '—'
  if (!iso.startsWith('P')) return iso

  const total = isoDurationToMinutes(iso)
  if (!total) return '—'

  const days = Math.floor(total / (24 * 60))
  const rem = total % (24 * 60)
  const hours = Math.floor(rem / 60)
  const mins = rem % 60

  if (days > 0) {
    const parts = [`${days}d`]
    if (hours > 0) parts.push(`${hours}h`)
    if (mins > 0) parts.push(`${mins}m`)
    return parts.join(' ')
  }

  if (hours > 0 && mins > 0) return `${hours}h ${mins}m`
  if (hours > 0) return `${hours}h`
  return `${mins}m`
}

export function formatMinutesHuman(totalMinutes: number): string {
  if (!totalMinutes || totalMinutes <= 0) return '—'
  return formatIsoDurationHuman(
    totalMinutes >= 24 * 60
      ? `P${Math.floor(totalMinutes / (24 * 60))}DT${Math.floor((totalMinutes % (24 * 60)) / 60)}H${totalMinutes % 60}M`
      : `PT${Math.floor(totalMinutes / 60)}H${totalMinutes % 60}M`
  )
}
