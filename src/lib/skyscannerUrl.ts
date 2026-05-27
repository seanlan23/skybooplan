/** Build Skyscanner search URL (works when RapidAPI scraper is down). */
export function buildSkyscannerFlightsUrl(params: {
  origin: string
  destination: string
  departDate: string
  returnDate?: string
  adults?: number
  cabinClass?: string
}): string {
  const o = params.origin.toLowerCase()
  const d = params.destination.toLowerCase()
  const dep = params.departDate.replace(/-/g, '').slice(2) // YYMMDD
  const path = params.returnDate
    ? `${o}/${d}/${dep}/${params.returnDate.replace(/-/g, '').slice(2)}/`
    : `${o}/${d}/${dep}/`

  const q = new URLSearchParams({
    adultsv2: String(params.adults ?? 1),
    cabinclass: params.cabinClass ?? 'economy',
    rtn: params.returnDate ? '1' : '0',
    preferdirects: 'false',
    outboundaltsenabled: 'false',
    inboundaltsenabled: 'false',
  })

  return `https://www.skyscanner.net/transport/flights/${path}?${q}`
}
