/**
 * Travelpayouts — nastavitev affiliate povezav.
 *
 * ZDAJ (pred launchom):
 * - Drive skripta v layout.tsx (marker 532915) — že vključena
 * - Izberi / Skyscanner gumbi delujejo (navaden skyscanner.net z istimi parametri)
 *
 * OB LAUNCHU (skybooplan.com live):
 * 1. Travelpayouts → dodaj / preveri domeno
 * 2. Tools → Create link → Skyscanner → kopiraj parameter p=
 * 3. V .env.local (ali Vercel env): NEXT_PUBLIC_TRAVELPAYOUTS_SKYSCANNER_P=...
 * 4. NEXT_PUBLIC_APP_URL=https://skybooplan.com
 * 5. Redeploy / restart npm run dev
 */

export function getTravelpayoutsMarker(): string {
  return process.env.NEXT_PUBLIC_TRAVELPAYOUTS_MARKER?.trim() || '532915'
}

export function getSkyscannerProgramId(): string | undefined {
  const direct = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SKYSCANNER_P?.trim()
  if (direct) return direct

  const template = process.env.NEXT_PUBLIC_TRAVELPAYOUTS_SKYSCANNER_LINK?.trim()
  if (!template) return undefined

  try {
    return new URL(template).searchParams.get('p') ?? undefined
  } catch {
    return undefined
  }
}

/** true ko je v .env nastavljen program Skyscanner (p=) — provizija na klikih. */
export function isTravelpayoutsAffiliateReady(): boolean {
  return Boolean(getSkyscannerProgramId())
}

export function isLocalDevSite(): boolean {
  const url = process.env.NEXT_PUBLIC_APP_URL?.trim() ?? ''
  return !url || url.includes('localhost') || url.includes('127.0.0.1')
}

/** Kratko obvestilo pod Skyscanner gumbom, dokler ni p= */
export function getTravelpayoutsPendingNote(): string | null {
  if (isTravelpayoutsAffiliateReady()) return null
  if (!isLocalDevSite()) {
    return 'Partnerska povezava Skyscanner še ni nastavljena (dopolni NEXT_PUBLIC_TRAVELPAYOUTS_SKYSCANNER_P).'
  }
  return 'Pred objavitvijo: Skyscanner deluje brez provizije. Po launchu v Travelpayouts dopolni program ID (p=) v .env.'
}
