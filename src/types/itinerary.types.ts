export interface ActivitySuggestion {
  /** Ime aktivnosti / znamenitosti */
  name: string
  /** Kratek, uporaben opis (kaj videti, početi) */
  description: string
  /** Cena v evrih, npr. "cca. 10 €", "Brezplačno", "15–25 €" */
  priceLabel: string
}

export type ItineraryTransportType = 'flight' | 'ferry' | 'car' | 'bus' | 'none'

export interface TransportFromPrevious {
  type: ItineraryTransportType
  duration?: string
  cost?: string
  description?: string
}

export interface ItineraryEvening {
  restaurant?: string
  cuisine?: string
  pricePerPerson?: string
}

/** Povzetek na koncu celotnega AI itinerarja */
export interface ItineraryTripSummary {
  totalCostEstimate?: string
  generalTips?: string[]
  rainyDayPlan?: string
}

export interface ItineraryDay {
  day: number
  location: string
  locationLat?: number
  locationLon?: number
  title: string
  description: string
  /** Strukturirani predlogi z opisom in ceno */
  suggestions: ActivitySuggestion[]
  /** @deprecated — samo za združljivost */
  activities?: string[]
  estimatedDate?: Date
  /** AI strukturiran odgovor */
  date?: string
  transportFromPrevious?: TransportFromPrevious
  morning?: ActivitySuggestion[]
  afternoon?: ActivitySuggestion[]
  evening?: ItineraryEvening
  travelHack?: string
  dailyBudget?: number
}
