export type Coordinates = { lat: number; lng: number };

export type Place = {
  id: string;
  name: string;
  description: string;
  category: 'attraction' | 'hotel' | 'restaurant' | 'activity';
  coordinates: Coordinates;
  images: string[];              // 2-3 URL-jev
  durationMinutes?: number;
  priceEstimateEUR?: number;
};

export type DayPlan = {
  dayNumber: number;
  date: string;                  // ISO
  title: string;
  summary: string;
  places: Place[];
};

export type FlightSuggestion = {
  from: string; to: string;
  airline: string; flightNumber?: string;
  departISO: string; arriveISO: string;
  priceEUR: number; bookingUrl?: string;
};

export type HotelSuggestion = {
  id: string; name: string;
  coordinates: Coordinates;
  images: string[];
  pricePerNightEUR: number;
  rating: number;
  bookingUrl?: string;
};

export type Itinerary = {
  id: string;
  destination: string;
  startDate: string; endDate: string;
  budgetEUR: number;
  days: DayPlan[];
  flights: FlightSuggestion[];
  hotels: HotelSuggestion[];
};
