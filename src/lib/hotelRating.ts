/** Pretvori oceno gostov na Booking.com lestvico 1–10. */
export function normalizeBookingGuestRating(raw: unknown): number {
  const n = parseFloat(String(raw ?? '0'))
  if (!Number.isFinite(n) || n <= 0) return 0
  const onTenScale = n <= 5 ? n * 2 : n
  return Math.round(Math.min(10, onTenScale) * 10) / 10
}

/** Ena decimalna mesta (npr. 8.6). */
export function formatBookingGuestRating(score: number): string {
  if (!Number.isFinite(score) || score <= 0) return '0.0'
  return normalizeBookingGuestRating(score).toFixed(1)
}
