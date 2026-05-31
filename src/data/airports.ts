import { organizeAirportSuggestions } from '@/lib/airportSuggestions'
import type { Airport } from '@/types/flight.types'

/** Fallback airports when RapidAPI is unavailable or unsubscribed */
export const FALLBACK_AIRPORTS: Airport[] = [
  { iata: 'LJU', name: 'Ljubljana Jože Pučnik', city: 'Ljubljana', country: 'Slovenia', lat: 46.2237, lon: 14.4576 },
  { iata: 'ZAG', name: 'Zagreb Franjo Tuđman', city: 'Zagreb', country: 'Croatia', lat: 45.7429, lon: 16.0688 },
  { iata: 'VCE', name: 'Venice Marco Polo', city: 'Venice', country: 'Italy', lat: 45.5053, lon: 12.3519 },
  { iata: 'TSF', name: 'Venice Treviso', city: 'Treviso', country: 'Italy', lat: 45.6484, lon: 12.1944 },
  { iata: 'VIE', name: 'Vienna International', city: 'Vienna', country: 'Austria', lat: 48.1103, lon: 16.5697 },
  { iata: 'MUC', name: 'Munich Airport', city: 'Munich', country: 'Germany', lat: 48.3537, lon: 11.775 },
  { iata: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany', lat: 50.0379, lon: 8.5622 },
  { iata: 'BER', name: 'Berlin Brandenburg', city: 'Berlin', country: 'Germany', lat: 52.3667, lon: 13.5033 },
  { iata: 'ZRH', name: 'Zurich Airport', city: 'Zurich', country: 'Switzerland', lat: 47.4647, lon: 8.5492 },
  { iata: 'GVA', name: 'Geneva Airport', city: 'Geneva', country: 'Switzerland', lat: 46.2381, lon: 6.109 },
  { iata: 'MXP', name: 'Milan Malpensa', city: 'Milan', country: 'Italy', lat: 45.6301, lon: 8.7231, iataCityCode: 'MIL' },
  { iata: 'LIN', name: 'Milan Linate', city: 'Milan', country: 'Italy', lat: 45.4451, lon: 9.2767, iataCityCode: 'MIL' },
  { iata: 'FCO', name: 'Rome Fiumicino', city: 'Rome', country: 'Italy', lat: 41.8003, lon: 12.2389 },
  { iata: 'NAP', name: 'Naples International', city: 'Naples', country: 'Italy', lat: 40.886, lon: 14.2908 },
  { iata: 'BUD', name: 'Budapest Ferenc Liszt', city: 'Budapest', country: 'Hungary', lat: 47.4298, lon: 19.2611 },
  { iata: 'PRG', name: 'Václav Havel Prague', city: 'Prague', country: 'Czechia', lat: 50.1008, lon: 14.26 },
  { iata: 'WAW', name: 'Warsaw Chopin', city: 'Warsaw', country: 'Poland', lat: 52.1657, lon: 20.9671 },
  { iata: 'KRK', name: 'Kraków John Paul II', city: 'Kraków', country: 'Poland', lat: 50.0777, lon: 19.7848 },
  { iata: 'BEG', name: 'Belgrade Nikola Tesla', city: 'Belgrade', country: 'Serbia', lat: 44.8184, lon: 20.3091 },
  { iata: 'SJJ', name: 'Sarajevo International', city: 'Sarajevo', country: 'Bosnia', lat: 43.8246, lon: 18.3315 },
  { iata: 'SKP', name: 'Skopje International', city: 'Skopje', country: 'North Macedonia', lat: 41.9616, lon: 21.6214 },
  { iata: 'TIA', name: 'Tirana International', city: 'Tirana', country: 'Albania', lat: 41.4147, lon: 19.7206 },
  { iata: 'ATH', name: 'Athens International', city: 'Athens', country: 'Greece', lat: 37.9364, lon: 23.9445 },
  { iata: 'SKG', name: 'Thessaloniki Airport', city: 'Thessaloniki', country: 'Greece', lat: 40.5197, lon: 22.9709 },
  { iata: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey', lat: 41.2753, lon: 28.7519 },
  { iata: 'SAW', name: 'Istanbul Sabiha Gökçen', city: 'Istanbul', country: 'Turkey', lat: 40.8986, lon: 29.3092 },
  { iata: 'CDG', name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', lat: 49.0097, lon: 2.5479, iataCityCode: 'PAR' },
  { iata: 'ORY', name: 'Paris Orly', city: 'Paris', country: 'France', lat: 48.7233, lon: 2.3794, iataCityCode: 'PAR' },
  { iata: 'LHR', name: 'London Heathrow', city: 'London', country: 'UK', lat: 51.47, lon: -0.4543, iataCityCode: 'LON' },
  { iata: 'LGW', name: 'London Gatwick', city: 'London', country: 'UK', lat: 51.1537, lon: -0.1821, iataCityCode: 'LON' },
  { iata: 'STN', name: 'London Stansted', city: 'London', country: 'UK', lat: 51.886, lon: 0.2389, iataCityCode: 'LON' },
  { iata: 'AMS', name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', lat: 52.3105, lon: 4.7683 },
  { iata: 'BRU', name: 'Brussels Airport', city: 'Brussels', country: 'Belgium', lat: 50.9014, lon: 4.4844 },
  { iata: 'MAD', name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', lat: 40.4983, lon: -3.5676 },
  { iata: 'BCN', name: 'Barcelona El Prat', city: 'Barcelona', country: 'Spain', lat: 41.2974, lon: 2.0833 },
  { iata: 'LIS', name: 'Lisbon Humberto Delgado', city: 'Lisbon', country: 'Portugal', lat: 38.7813, lon: -9.1359 },
  { iata: 'OPO', name: 'Porto Francisco Sá Carneiro', city: 'Porto', country: 'Portugal', lat: 41.2481, lon: -8.6814 },
  { iata: 'CPH', name: 'Copenhagen Airport', city: 'Copenhagen', country: 'Denmark', lat: 55.618, lon: 12.656 },
  { iata: 'ARN', name: 'Stockholm Arlanda', city: 'Stockholm', country: 'Sweden', lat: 59.6519, lon: 17.9186 },
  { iata: 'OSL', name: 'Oslo Gardermoen', city: 'Oslo', country: 'Norway', lat: 60.1939, lon: 11.1004 },
  { iata: 'HEL', name: 'Helsinki-Vantaa', city: 'Helsinki', country: 'Finland', lat: 60.3172, lon: 24.9633 },
  { iata: 'DUB', name: 'Dublin Airport', city: 'Dublin', country: 'Ireland', lat: 53.4273, lon: -6.2436 },
  { iata: 'DXB', name: 'Dubai International', city: 'Dubai', country: 'UAE', lat: 25.2532, lon: 55.3657 },
  { iata: 'DOH', name: 'Hamad International', city: 'Doha', country: 'Qatar', lat: 25.2606, lon: 51.6138 },
  { iata: 'JFK', name: 'New York JFK', city: 'New York', country: 'USA', lat: 40.6413, lon: -73.7781, iataCityCode: 'NYC' },
  { iata: 'EWR', name: 'Newark Liberty', city: 'Newark', country: 'USA', lat: 40.6895, lon: -74.1745, iataCityCode: 'NYC' },
  { iata: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', country: 'USA', lat: 33.9416, lon: -118.4085 },
  { iata: 'MIA', name: 'Miami International', city: 'Miami', country: 'USA', lat: 25.7959, lon: -80.287 },
  { iata: 'YYZ', name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', lat: 43.6777, lon: -79.6248 },
  { iata: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand', lat: 13.69, lon: 100.7501 },
  { iata: 'SIN', name: 'Singapore Changi', city: 'Singapore', country: 'Singapore', lat: 1.3644, lon: 103.9915 },
  { iata: 'HND', name: 'Tokyo Haneda', city: 'Tokyo', country: 'Japan', lat: 35.5494, lon: 139.7798, iataCityCode: 'TYO' },
  { iata: 'NRT', name: 'Tokyo Narita', city: 'Tokyo', country: 'Japan', lat: 35.772, lon: 140.3929, iataCityCode: 'TYO' },
]

export function searchFallbackAirports(
  query: string,
  limit = 12,
  allAirportsLabel = 'All airports'
): Airport[] {
  const q = query.trim().toLowerCase()
  if (q.length < 2) return []

  const matched = FALLBACK_AIRPORTS.filter((a) => {
    const haystack = `${a.iata} ${a.name} ${a.city} ${a.country}`.toLowerCase()
    return haystack.includes(q)
  })

  return organizeAirportSuggestions(matched, query, limit, allAirportsLabel)
}
