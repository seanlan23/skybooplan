import { format, parseISO } from 'date-fns'
import { sl } from 'date-fns/locale'
import type { SelectedFlightForAI } from '@/types/selectedFlight.types'

function formatDateTime(iso: string) {
  try {
    return format(parseISO(iso), "EEEE, d. MMMM yyyy 'ob' HH:mm", { locale: sl })
  } catch {
    return iso
  }
}

function arrivalHour(iso: string): number | null {
  try {
    return parseISO(iso).getHours()
  } catch {
    return null
  }
}

export function buildFlightContextForAI(flight: SelectedFlightForAI): string {
  const arriveHour = arrivalHour(flight.outboundArrivalAt)
  const lateArrival = arriveHour != null && arriveHour >= 20
  const moderateLate = arriveHour != null && arriveHour >= 17 && arriveHour < 20

  let arrivalNote =
    'Prvi dan programa naj vključuje polne aktivnosti, če je prihod zgodaj dopoldan ali dopoldne.'
  if (lateArrival) {
    arrivalNote =
      'PRIHOD JE PO 20:00 — dan 1 itinerarija mora vsebovati IZKLJUČNO prihod, prevoz do nastanitve, lahko lahek večerji in počitek. Brez ogledov, muzejev ali zahtevnih aktivnosti. Polni program (razgledovanje, izleti) začneš šele na dan 2.'
  } else if (moderateLate) {
    arrivalNote =
      'Prihod je med 17:00 in 20:00 — dan 1 naj bo lahek: prihod, nastanitev, kratek sprehod ali večerja v bližini. Zahtevnejše aktivnosti načrtuj od dne 2.'
  }

  const lines = [
    '=== PODATKI O IZBRANEM LETU (obvezno upoštevaj) ===',
    `Letovalec: ${flight.airline}`,
    `Odhod iz ${flight.origin}: ${formatDateTime(flight.outboundDepartureAt)}`,
    `PRIHOD na destinacijo (${flight.destination}): ${formatDateTime(flight.outboundArrivalAt)}`,
  ]

  if (flight.isRoundTrip && flight.returnDepartureAt && flight.returnArrivalAt) {
    lines.push(
      `Odhod nazaj iz ${flight.destination}: ${formatDateTime(flight.returnDepartureAt)}`,
      `Prihod domov (${flight.origin}): ${formatDateTime(flight.returnArrivalAt)}`
    )
    lines.push(
      'Zadnji dan itinerarija upoštevaj čas odhoda nazaj — brez aktivnosti, ki bi zamujale na letališče.'
    )
  }

  lines.push('', `PRAVILO ZA PRVI DAN: ${arrivalNote}`)

  if (flight.timeline?.length) {
    lines.push(
      '',
      'Časovna premica (odhod → prestopi → pristanek):',
      ...flight.timeline.map((p) => {
        const base = `- ${p.label} ${p.iata}: ${formatDateTime(p.at)}`
        if (p.kind === 'stopover' && p.connectionDepartureAt) {
          return `${base}, nadaljevanje ${formatDateTime(p.connectionDepartureAt)}`
        }
        return base
      }),
      `Skupno trajanje potovanja do destinacije: ${flight.totalDurationLabel}`
    )
  }

  return lines.join('\n')
}

export function formatFlightTimeForPrompt(iso: string) {
  return formatDateTime(iso)
}
