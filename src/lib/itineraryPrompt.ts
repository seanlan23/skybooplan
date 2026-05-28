import { extractBookingCity } from '@/lib/bookingLocation'
import { buildTripDurationRequirement } from '@/lib/itineraryCompleteness'
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
OUTPUT — return ONLY valid JSON (no text before or after):
{
  "days": [
    {
      "dayNumber": 1,
      "title": "Arrival and first walk in Manila",
      "date": "2026-06-01",
      "location": "Manila, Philippines",
      "transportFromPrevious": {
        "type": "flight",
        "duration": "~14h",
        "cost": "cca. 650 €",
        "description": "Flight from origin to MNL, Terminal 3"
      },
      "morning": [
        { "name": "Place name", "description": "What to do", "price": "cca. 10 €" }
      ],
      "afternoon": [
        { "name": "Place name", "description": "What to do", "price": "Free" }
      ],
      "evening": {
        "restaurant": "Restaurant name",
        "cuisine": "Filipino",
        "pricePerPerson": "cca. 25 €"
      },
      "travelHack": "Practical tip for this day",
      "dailyBudget": 85,
      "suggestions": [
        { "name": "Optional extra", "description": "Short note", "price": "15 €" }
      ]
    }
  ],
  "tripSummary": {
    "totalCostEstimate": "Total approx. X–Y € for activities (excluding flights/accommodation)",
    "generalTips": ["Tip 1", "Tip 2"],
    "rainyDayPlan": "Rainy day backup plan"
  }
}

JSON rules:
- transportFromPrevious.type MUST be one of: "flight" | "ferry" | "car" | "bus" | "none" (use "none" on day 1 if no inter-city move that day).
- morning / afternoon: 2–3 items each with name, description, price (in €).
- suggestions: optional extras; price field in €.
- tripSummary is required.
- Number of "days" entries = exactly ${'{travelDays}'} days for this trip.
`

/** @deprecated — uporabi buildItinerarySystemPrompt */
export const ITINERARY_SYSTEM_PROMPT = buildItinerarySystemPrompt({
  currentDestination: 'Destinacija',
  checkInDate: '—',
  checkOutDate: '—',
  passengerCount: 2,
  travelNights: 3,
})

function paceFromTravelType(travelType: string): string {
  const t = travelType.toLowerCase()
  if (/intenziv|intensive|aktivn|busy|fast/i.test(t)) {
    return 'Intensive: max activities, 3–4 locations total for 2 weeks'
  }
  if (/sproščen|relaxed|easy|slow/i.test(t)) {
    return 'Relaxed: fewer activities, longer stays, 2–3 locations for 2 weeks'
  }
  if (/miren|calm|peace|minimal/i.test(t)) {
    return 'Calm: 1–2 locations, deep exploration, lots of free time'
  }
  return 'Balanced: mix of sights and rest; adjust location count to trip length'
}

export function buildItinerarySystemPrompt(input: ItineraryPlannerInput): string {
  const passengerType = input.passengerType?.trim() || 'general'
  const travelType = input.travelType?.trim() || 'balanced'
  const dailyBudget = input.dailyBudget?.trim() || 'optimized'
  const specialRequests = input.specialRequests?.trim() || 'none'
  const travelDays = input.travelNights + 1
  const pace = paceFromTravelType(travelType)

  const schema = JSON_OUTPUT_SCHEMA.replace('{travelDays}', String(travelDays))
  const durationBlock = buildTripDurationRequirement(input.travelNights, travelDays)

  return `You are an expert travel planner with deep knowledge of geography, local transport, and travel logistics.

${durationBlock}

CORE RULES — follow strictly:
1. LOGICAL ROUTE PLANNING:
   - Never make the traveler go back to a place they already visited
   - Plan the route geographically — move in one direction (e.g. north to south, or circular loop)
   - Group nearby locations together to minimize travel time
   - Example for Philippines: Manila → Batangas → Puerto Galera → Coron → El Nido → Cebu → Siargao (logical flow, no backtracking)
2. TRANSPORT LOGIC:
   - Mainland to mainland (short distance <100km): bus or car
   - Mainland to island OR island to island: ferry or boat
   - Long distance (>300km) or isolated islands: domestic flight
   - Always mention approximate travel time and cost in euros
   - Always mention departure terminal/port when relevant
3. DAILY STRUCTURE — every day must have:
   - Morning activities (2-3 specific places with entry costs in €)
   - Afternoon activities (2-3 specific places with entry costs in €)
   - Evening: 1 restaurant recommendation with price per person in €
   - Transport to next location (if moving that day): method + duration + cost
   - 1 practical Travel Hack tip
   - Total estimated daily budget in €
4. GEOGRAPHY AWARENESS:
   - Know which destinations are islands vs mainland
   - Know which areas are rainy/dry season for travel dates
   - Suggest destinations based on weather for the travel month
   - For beach destinations: specify best beach for swimming vs scenery
5. ACCOMMODATION PLACEMENT:
   - Each night, traveler sleeps in the next day's starting location
   - Never plan overnight travel unless it's a night ferry/bus (and only if it saves time efficiently)
6. RESPONSE FORMAT — strict JSON-like structure:
   Each day must include:
   - dayNumber (integer)
   - title (string, e.g. "Prihod in sprehod po Manili")
   - date (formatted date)
   - location (city + country, e.g. "Manila, Filipini")
   - transportFromPrevious (object: type, duration, cost, description)
     type must be one of: "flight" | "ferry" | "car" | "bus" | "none"
   - morning (array of activities)
   - afternoon (array of activities)
   - evening (object: restaurant, cuisine, pricePerPerson)
   - travelHack (string)
   - dailyBudget (number in €)
   - suggestions (array of: name, description, price)
7. PACE ADAPTATION:
   - Intensive: max activities, 3-4 locations total for 2 weeks
   - Relaxed: fewer activities, longer stays, 2-3 locations for 2 weeks
   - Calm: 1-2 locations, deep exploration, lots of free time
   - For this trip, apply: ${pace}
8. LANGUAGE: Always respond in the same language as the user's "Your wishes" input. If wishes are in Slovenian → respond in Slovenian. If in English → respond in English.

TRIP CONTEXT (from search form):
- Destination region: ${input.currentDestination}
- Dates: ${input.checkInDate} to ${input.checkOutDate} (${input.travelNights} nights = ${travelDays} days)
- Travelers: ${input.passengerCount} (${passengerType})
- Travel style / pace hint: ${travelType}
- Daily activity budget per person (excl. flights & hotels): ${dailyBudget} €
- Special wishes: ${specialRequests}

${schema}`
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

  const durationBlock = buildTripDurationRequirement(travelNights, totalDays)

  return [
    durationBlock,
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
