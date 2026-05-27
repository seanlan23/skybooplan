export interface ActivitySuggestion {
  /** Ime aktivnosti / znamenitosti */
  name: string
  /** Kratek, uporaben opis (kaj videti, početi) */
  description: string
  /** Cena v evrih, npr. "cca. 10 €", "Brezplačno", "15–25 €" */
  priceLabel: string
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
  /** Strukturirani predlogi z opisom in ceno (novo) */
  suggestions: ActivitySuggestion[]
  /** @deprecated — samo za združljivost; normalizira se v suggestions */
  activities?: string[]
  estimatedDate?: Date
}
