import { extractBookingCity } from '@/lib/bookingLocation'
import { normalizeItineraryDays } from '@/lib/normalizeItinerary'
import type { ItineraryDay, ItineraryTripSummary } from '@/types/itinerary.types'

export interface ItineraryPlannerInput {
  currentDestination: string
  checkInDate: string
  checkOutDate: string
  passengerCount: number
  passengerType?: string
  travelType?: string
  dailyBudget?: string
  specialRequests?: string
  travelNights: number
}

const JSON_OUTPUT_SCHEMA = `
OBVEZNA IZHODNA OBLIKA — vrni IZKLJUČNO veljavni JSON (brez besedila pred ali za njim):
{
  "days": [
    {
      "day": 1,
      "location": "Mesto, Država",
      "title": "Dan 1: Prihod in prvi vtisi",
      "description": "Markdown za dan: ### ⏰ Dopoldan\\n...\\n### 🌤 Popoldan\\n...\\n### 🌙 Večer\\n...\\n**Prevoz:** ...\\n**Hrana:** kosilo ... večerja ...\\n**💡 Travel Hack:** ...",
      "suggestions": [
        {
          "name": "Konkretna aktivnost",
          "description": "Kaj početi, 1–2 stavka.",
          "priceLabel": "cca. 15 €"
        }
      ]
    }
  ],
  "tripSummary": {
    "totalCostEstimate": "Skupaj približno X–Y € za vstopnine in aktivnosti (brez letov/nastanitve)",
    "generalTips": ["Nasvet 1", "Nasvet 2", "Nasvet 3"],
    "rainyDayPlan": "Predlog rezervnega/deževnega dneva"
  }
}

Pravila za JSON:
- Polje "description" mora vsebovati celotno strukturo dneva v Markdown (dopoldan / popoldan / večer, prevoz, hrana, travel hack) z zmerno uporabo emoji.
- Vsak dan: 3–5 "suggestions" z realnimi cenami v € (priceLabel).
- "tripSummary" je obvezen na koncu celotnega odgovora.
- Število elementov v "days" = točno število dni potovanja (nočitve + 1).
`

/** @deprecated — uporabi buildItinerarySystemPrompt */
export const ITINERARY_SYSTEM_PROMPT = buildItinerarySystemPrompt({
  currentDestination: 'Destinacija',
  checkInDate: '—',
  checkOutDate: '—',
  passengerCount: 2,
  travelNights: 3,
})

export function buildItinerarySystemPrompt(input: ItineraryPlannerInput): string {
  const passengerType = input.passengerType?.trim() || 'splošno'
  const travelType = input.travelType?.trim() || 'uravnoteženo (hrana, kultura, znamenitosti)'
  const dailyBudget = input.dailyBudget?.trim() || 'optimizirano'
  const specialRequests = input.specialRequests?.trim() || 'brez'

  return `Ti si Skybooplan AI — vrhunski, izkušen in praktičen potovalni planer za popotnike po celem svetu. Tvoj stil je prijazen, realističen, dobro organiziran in navdihujoč, brez nepotrebnega bleščanja in dolgih uvodov.

Prejel boš naslednje dinamične podatke o potovanju:
- Destinacija: ${input.currentDestination}
- Datumi: od ${input.checkInDate} do ${input.checkOutDate}
- Število oseb in tip: ${input.passengerCount} (${passengerType})
- Tip potovanja: ${travelType}
- Proračun na osebo (brez letov in nastanitve): ${dailyBudget} €
- Posebne želje / omejitve: ${specialRequests}

Tvoja naloga:
Ustvari podroben, a pregleden day-by-day itinerar za celotno obdobje potovanja (${input.travelNights} nočitev = ${input.travelNights + 1} dni).

Za vsak dan moraš vključiti (v polju "description" kot Markdown):
1. Naslov dneva (že v polju "title", npr. Dan 3: Raziskovanje starega jedra in lokalna kulinarika)
2. Okvirni časovni načrt:
   - Dopoldan:
   - Popoldan:
   - Večer:
3. Glavne aktivnosti z ocenjenimi časi in približnimi stroški vstopnin/aktivnosti v EUR (tudi v "suggestions").
4. Predlog prevoza med lokacijami (hoja, avtobus, taksi, trajekt, metro...).
5. Predlog za hrano (1–2 konkretna predloga za kosilo in večerjo z okvirno ceno).
6. En kratek praktični nasvet (Travel Hack) za ta dan.

Dodatne zahteve:
- Uravnoteži aktivnosti: mešanica znamenitosti, sprostitve, hrane in lokalne izkušnje.
- Vključi vsaj 1–2 manj znana mesta ali "skrita bisera" (hidden gems) na tej destinaciji.
- Upoštevaj realne čase hoje/prevozov in morebitno utrujenost po letu na prvi dan.
- Na koncu v "tripSummary": povzetek skupnih približnih stroškov aktivnosti, 3–4 splošna priporočila (kaj vzeti s seboj, vstopnice vnaprej...), predlog za en "rezervni dan" (Rainy Day/Rest Day).

Odgovor v JSON mora biti v lepi slovenščini, z zmerno uporabo emoji v "description", z Markdown naslovi (##, ###) znotraj besedila polja.

${JSON_OUTPUT_SCHEMA}

PRAVILA PO TRAJANJU (najvišja prioriteta):

A) KRATKO POTOVANJE (4 dni ali manj):
- VSI dnevi: ISTO "location" = izbrana destinacija.
- PREPOVEDANO menjati mesto; brez izletov v oddaljena mesta (1+ h vožnje).
- Aktivnosti v mestu + okolica (max 20–30 min vožnje).
- Dan 1 ob poznem prihodu lahek program.

B) SREDNJE POTOVANJE (5–7 dni):
- Eno glavno bazno mesto; največ 1 bližnji izlet (do ~45 min).

C) DALJŠE POTOVANJE (8+ dni):
- Menjava lokacij vsakih 2–3 dni, logičen vrstni red; zadnjih 4–5 dni lahko ob morju.

POSEBNOST — TUZLA: lokalno (Pannonica, Trg slobode, Modrac) — NE Sarajevo, Mostar, Blagaj za kratko bivanje.`
}

const TUZLA_HINT = `Za Tuzlo uporabi izključno lokalne predloge: Pannonica (Panonska jezera), Trg slobode, Soni trg, ćevapi/pita, Slana Banja, jezero Modrac v bližini — NE Sarajevo, Mostar, Blagaj.`

function isTuzlaDestination(destination: string): boolean {
  return destination.toLowerCase().includes('tuzla')
}

export function normalizeTripSummary(raw: unknown): ItineraryTripSummary | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  const totalCostEstimate =
    typeof o.totalCostEstimate === 'string' ? o.totalCostEstimate.trim() : undefined
  const rainyDayPlan =
    typeof o.rainyDayPlan === 'string' ? o.rainyDayPlan.trim() : undefined
  let generalTips: string[] | undefined
  if (Array.isArray(o.generalTips)) {
    generalTips = o.generalTips
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.trim())
  }
  if (!totalCostEstimate && !rainyDayPlan && !generalTips?.length) return null
  return { totalCostEstimate, generalTips, rainyDayPlan }
}

/** AI JSON → dnevi + povzetek */
export function parseItineraryResponse(parsed: {
  days?: unknown[]
  tripSummary?: unknown
}): { days: ItineraryDay[]; tripSummary: ItineraryTripSummary | null } {
  return {
    days: normalizeItineraryDays(parsed.days ?? []),
    tripSummary: normalizeTripSummary(parsed.tripSummary),
  }
}

export function buildItineraryUserMessage(
  destination: string,
  travelNights: number,
  totalDays: number,
  extraContext: string,
  plannerInput?: ItineraryPlannerInput
): string {
  const dest = destination.trim()
  const shortTrip = totalDays <= 4
  const mediumTrip = totalDays >= 5 && totalDays <= 7
  const tuzla = isTuzlaDestination(dest)

  let goals: string
  if (shortTrip) {
    goals = [
      `NAČRTOVALNI CILJ (KRATKO BIVANJE, ${totalDays} dni):`,
      `Vsi dnevi na ISTI lokaciji: ${dest}.`,
      'Brez menjave mesta. Brez izletov v oddaljena mesta (1+ h vožnje).',
      'Aktivnosti samo v mestu in neposredni okolici (max 20–30 min vožnje).',
      '3–5 suggestions na dan z realnimi cenami v €.',
      tuzla ? TUZLA_HINT : '',
    ]
      .filter(Boolean)
      .join('\n')
  } else if (mediumTrip) {
    goals = [
      `NAČRTOVALNI CILJ (${totalDays} dni):`,
      `Glavna baza: ${dest}. Največ en bližnji izlet (do ~45 min).`,
      tuzla ? TUZLA_HINT : '',
    ]
      .filter(Boolean)
      .join('\n')
  } else {
    goals = [
      `NAČRTOVALNI CILJ (${totalDays} dni):`,
      `Začni v regiji ${dest}; dinamičen itinerar z menjavo lokacij vsakih 2–3 dni.`,
      tuzla ? TUZLA_HINT : '',
    ]
      .filter(Boolean)
      .join('\n')
  }

  const locationRule = shortTrip
    ? `Vsa polja "location" morajo biti točno: "${dest}" (enako za vsak dan).`
    : `Prvi dnevi naj se osredotočijo na ${dest}; location vedno "Mesto, Država".`

  const plannerBlock = plannerInput
    ? [
        '=== PODATKI IZ ISKALNIKA (že v sistemnem navodilu) ===',
        `Destinacija: ${plannerInput.currentDestination}`,
        `Datumi: ${plannerInput.checkInDate} – ${plannerInput.checkOutDate}`,
        `Potniki: ${plannerInput.passengerCount} (${plannerInput.passengerType ?? 'splošno'})`,
      ].join('\n')
    : ''

  return [
    `Ustvari ${totalDays}-dnevni itinerarij (${travelNights} nočitev) za: ${dest}.`,
    locationRule,
    goals,
    plannerBlock,
    extraContext,
  ]
    .filter(Boolean)
    .join('\n\n')
}

export function buildHotelsOnlyPackage(
  destination: string,
  travelNights: number,
  totalDays: number,
  arrivalFormatted: string
): string {
  const shortTrip = totalDays <= 4
  const city = extractBookingCity(destination)

  return [
    '=== SAMO NAMESTITVE (brez leta) ===',
    `Destinacija (obvezna baza): ${destination.trim()}`,
    `Število nočitev: ${travelNights} (ustvari točno ${totalDays} dni v JSON, day 1 … day ${totalDays})`,
    `Dan prihoda / začetek bivanja: ${arrivalFormatted}`,
    shortTrip
      ? `KRATKO POTOVANJE: vse aktivnosti v ${city} in okolici (max 20–30 min vožnje). Ne predlagaj drugih mest v državi.`
      : 'Upoštevaj pravila trajanja iz sistemskega navodila.',
    isTuzlaDestination(destination) ? TUZLA_HINT : '',
  ]
    .filter(Boolean)
    .join('\n')
}

export function enforceShortTripItinerary(
  days: ItineraryDay[],
  destinationLabel: string,
  totalDays: number
): ItineraryDay[] {
  if (totalDays > 4 || !days.length) return days
  const loc = destinationLabel.trim()
  return days.map((d) => ({ ...d, location: loc }))
}

export function buildFlightPackage(
  destination: string,
  travelNights: number,
  totalDays: number,
  origin: string,
  destinationIata: string,
  departFormatted: string,
  arriveFormatted: string
): string {
  const shortTrip = totalDays <= 4

  return [
    '=== PAKET ZA NAČRTOVANJE (obvezno upoštevaj) ===',
    `Vstopna / ciljna regija: ${destination.trim()}`,
    `Število nočitev: ${travelNights} (ustvari točno ${totalDays} dni v JSON, day 1 … day ${totalDays})`,
    `Ura odhoda (let iz ${origin}): ${departFormatted}`,
    `Ura prihoda na destinacijo (${destinationIata}): ${arriveFormatted}`,
    shortTrip
      ? `KRATKO POTOVANJE: ostani v ${destination.trim()} in neposredni okolici. Brez izletov v oddaljena mesta.`
      : 'Za daljša potovanja (8+ dni) lahko več destinacij; sicer glej pravila trajanja.',
    isTuzlaDestination(destination) ? TUZLA_HINT : '',
  ].join('\n')
}
