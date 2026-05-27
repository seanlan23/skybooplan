export interface Airport {
  /** IATA koda letališča ali metro območja (npr. LHR ali LON) */
  iata: string
  name: string
  city: string
  country: string
  lat?: number
  lon?: number
  /** Prikaz v UI, npr. «London (Vsa letališča)» */
  displayName?: string
  /** Celotno mesto / vsa letališča — za API uporabi iata (metro kodo) */
  isAllAirports?: boolean
  metroCode?: string
  /** IATA koda mesta (Duffel iata_city_code), samo pri posameznih letališčih */
  iataCityCode?: string
  /** Skyscanner PlaceId (Flights Scraper Sky) — obvezen za zanesljivo iskanje */
  skyscannerPlaceId?: string
}

export interface FlightSegment {
  departure: { iataCode: string; at: string }
  arrival: { iataCode: string; at: string }
  carrierCode: string
  flightNumber: string
  duration: string
  aircraft?: string
}

export interface FlightOffer {
  id: string
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  price: number
  currency: string
  airline: string
  airlineLogo?: string
  duration: string
  /** Skupno trajanje (odhod + povratek) v minutah — za razvrščanje */
  totalDurationMinutes?: number
  stops: number
  returnDuration?: string
  returnStops?: number
  cabinClass: string
  seatsAvailable?: number
  /** Skupni ocenjeni CO₂e (kg) — Duffel total_emissions_kg */
  totalEmissionsKg?: number
  /** % manj od mediane trenutnih rezultatov iskanja (če >= 5) */
  co2SavingsPercent?: number
  deepLink?: string
  /** Skyscanner itinerary id — za selectedoutbound v URL-ju */
  skyscannerItineraryId?: string
  segments: FlightSegment[]
  returnSegments?: FlightSegment[]
}
