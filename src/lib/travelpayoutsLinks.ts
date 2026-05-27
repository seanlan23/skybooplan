import {
  getSkyscannerProgramId,
  getTravelpayoutsMarker,
} from '@/config/travelpayouts'
import { buildSkyscannerFlightsUrl } from '@/lib/skyscannerUrl'

export { getSkyscannerProgramId, getTravelpayoutsMarker } from '@/config/travelpayouts'

/**
 * Ovije ciljni URL v Travelpayouts affiliate (tp.media).
 * Brez programa `p` vrne navaden Skyscanner URL — deluje pred launchom.
 */
export function wrapTravelpayoutsAffiliateUrl(destinationUrl: string): string {
  const program = getSkyscannerProgramId()
  if (!program) return destinationUrl

  const q = new URLSearchParams({
    marker: getTravelpayoutsMarker(),
    p: program,
    u: destinationUrl,
  })
  return `https://tp.media/r?${q.toString()}`
}

export function buildAffiliateSkyscannerFlightsUrl(params: {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  adults?: number
  cabinClass?: string
}): string {
  return wrapTravelpayoutsAffiliateUrl(buildSkyscannerFlightsUrl(params))
}
