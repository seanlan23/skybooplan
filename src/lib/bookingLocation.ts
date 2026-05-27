/** Čiščenje lokacije za Booking / prikaz hotelov — brez letališč in IATA kod */

const IATA_CODE = '[A-Z]{3}'

/** Oklepaji z IATA: (HKT), (BKK) */
const PAREN_IATA = new RegExp(`\\s*\\(\\s*${IATA_CODE}\\s*\\)`, 'gi')
/** Oklepaji z besedilom + IATA: (Phuket HKT) */
const PAREN_ANY_IATA = new RegExp(`\\s*\\([^)]*\\b${IATA_CODE}\\b[^)]*\\)`, 'gi')
/** Zaklepaji: [HKT] */
const BRACKET_IATA = new RegExp(`\\s*\\[\\s*${IATA_CODE}\\s*\\]`, 'gi')
/** Na koncu: " – HKT" ali " HKT" */
const TRAILING_IATA = new RegExp(`(?:\\s*[-–—]\\s*|\\s+)${IATA_CODE}\\s*$`, 'i')

const AIRPORT_PHRASE_PATTERNS = [
  /\s+mednarodno\s+letališče/gi,
  /\s+letališče/gi,
  /\s+international\s+airport/gi,
  /\s+regional\s+airport/gi,
  /\s+airport/gi,
  /\s+airfield/gi,
  /\s+air\s+base/gi,
]

/** Angleška imena držav → slovenska (prikaz na karticah) */
const COUNTRY_DISPLAY_SL: Record<string, string> = {
  Thailand: 'Tajska',
  Slovenia: 'Slovenija',
  Croatia: 'Hrvaška',
  Italy: 'Italija',
  Austria: 'Avstrija',
  Germany: 'Nemčija',
  France: 'Francija',
  Spain: 'Španija',
  Portugal: 'Portugalska',
  Greece: 'Grčija',
  Turkey: 'Turčija',
  'United Kingdom': 'Združeno kraljestvo',
  UK: 'Združeno kraljestvo',
  Netherlands: 'Nizozemska',
  Belgium: 'Belgija',
  Switzerland: 'Švica',
  Poland: 'Poljska',
  'Czech Republic': 'Češka',
  Czechia: 'Češka',
  Hungary: 'Madžarska',
  Serbia: 'Srbija',
  Japan: 'Japonska',
  Indonesia: 'Indonezija',
  Vietnam: 'Vietnam',
  Philippines: 'Filipini',
  Malaysia: 'Malezija',
  Singapore: 'Singapur',
  UAE: 'ZAE',
  'United Arab Emirates': 'ZAE',
  USA: 'ZDA',
  'United States': 'ZDA',
  Australia: 'Avstralija',
  'New Zealand': 'Nova Zelandija',
  India: 'Indija',
  China: 'Kitajska',
  'South Korea': 'Južna Koreja',
  Egypt: 'Egipt',
  Morocco: 'Maroko',
  Mexico: 'Mehika',
  Brazil: 'Brazilija',
  Argentina: 'Argentina',
  Colombia: 'Kolumbija',
  Peru: 'Peru',
  Chile: 'Čile',
  Norway: 'Norveška',
  Sweden: 'Švedska',
  Denmark: 'Danska',
  Finland: 'Finska',
  Ireland: 'Irska',
  Iceland: 'Islandija',
  Romania: 'Romunija',
  Bulgaria: 'Bolgarija',
  Bosnia: 'Bosna in Hercegovina',
  'North Macedonia': 'Severna Makedonija',
  Albania: 'Albanija',
  Montenegro: 'Črna gora',
  Latvia: 'Latvija',
  Lithuania: 'Litva',
  Estonia: 'Estonija',
  Russia: 'Rusija',
  Ukraine: 'Ukrajina',
  Georgia: 'Gruzija',
  Armenia: 'Armenija',
  Azerbaijan: 'Azerbajdžan',
  Qatar: 'Katar',
  'Saudi Arabia': 'Saudova Arabija',
  Israel: 'Izrael',
  Jordan: 'Jordanija',
  'Sri Lanka': 'Šrilanka',
  Cambodia: 'Kambodža',
  Laos: 'Laos',
  Myanmar: 'Mjanmar',
  Taiwan: 'Tajvan',
  'Hong Kong': 'Hongkong',
  Maldives: 'Maldivi',
  Nepal: 'Nepal',
  Pakistan: 'Pakistan',
  Bangladesh: 'Bangladeš',
}

const COUNTRY_ISO_SL: Record<string, string> = {
  TH: 'Tajska',
  SI: 'Slovenija',
  HR: 'Hrvaška',
  IT: 'Italija',
  AT: 'Avstrija',
  DE: 'Nemčija',
  FR: 'Francija',
  ES: 'Španija',
  PT: 'Portugalska',
  GR: 'Grčija',
  TR: 'Turčija',
  GB: 'Združeno kraljestvo',
  NL: 'Nizozemska',
  BE: 'Belgija',
  CH: 'Švica',
  PL: 'Poljska',
  CZ: 'Češka',
  HU: 'Madžarska',
  RS: 'Srbija',
  JP: 'Japonska',
  ID: 'Indonezija',
  VN: 'Vietnam',
  PH: 'Filipini',
  MY: 'Malezija',
  SG: 'Singapur',
  AE: 'ZAE',
  US: 'ZDA',
  AU: 'Avstralija',
  NZ: 'Nova Zelandija',
  IN: 'Indija',
  CN: 'Kitajska',
  KR: 'Južna Koreja',
  EG: 'Egipt',
  MA: 'Maroko',
  MX: 'Mehika',
  BR: 'Brazilija',
  AR: 'Argentina',
  CO: 'Kolumbija',
  PE: 'Peru',
  CL: 'Čile',
  NO: 'Norveška',
  SE: 'Švedska',
  DK: 'Danska',
  FI: 'Finska',
  IE: 'Irska',
  IS: 'Islandija',
  RO: 'Romunija',
  BG: 'Bolgarija',
  BA: 'Bosna in Hercegovina',
  MK: 'Severna Makedonija',
  AL: 'Albanija',
  ME: 'Črna gora',
  LV: 'Latvija',
  LT: 'Litva',
  EE: 'Estonija',
  RU: 'Rusija',
  UA: 'Ukrajina',
  GE: 'Gruzija',
  QA: 'Katar',
  SA: 'Saudova Arabija',
  IL: 'Izrael',
  JO: 'Jordanija',
  LK: 'Šrilanka',
  KH: 'Kambodža',
  LA: 'Laos',
  MM: 'Mjanmar',
  TW: 'Tajvan',
  HK: 'Hongkong',
  MV: 'Maldivi',
  NP: 'Nepal',
}

/**
 * Čiščenje za DataCrawler Booking API (query / searchDestination).
 * Samo ime mesta — brez letališč in IATA v oklepajih.
 */
export function cleanCityForBookingApi(destinationName: string): string {
  let cleanCity = destinationName.trim()
  if (!cleanCity) return cleanCity

  const firstPart = cleanCity.split(',')[0]?.trim() ?? cleanCity
  cleanCity = firstPart

  cleanCity = cleanCity.replace(/\s*\(.*?\)\s*/g, '')
  cleanCity = cleanCity.replace(/(International\s+)?Airport/gi, '').trim()
  cleanCity = cleanCity.replace(/Letališče/gi, '').trim()

  return cleanCity.replace(/\s{2,}/g, ' ').trim()
}

export function stripAirportFromLocation(text: string): string {
  return cleanCityForBookingApi(text)
}

/** Celoten niz "Mesto, Država" brez letališča */
export function sanitizeHotelLocation(location: string): string {
  const trimmed = location.trim()
  if (!trimmed) return trimmed

  const parts = trimmed.split(',').map((p) => stripAirportFromLocation(p.trim())).filter(Boolean)
  if (parts.length === 0) return stripAirportFromLocation(trimmed)
  return parts.join(', ')
}

/** Samo ime mesta za Booking API query */
export function extractBookingCity(location: string): string {
  const city = cleanCityForBookingApi(location)
  return city.replace(/\s+(city|mesto|območje)$/i, '').trim()
}

export function localizeCountryName(country: string): string {
  const c = country.trim()
  if (!c) return c
  if (COUNTRY_DISPLAY_SL[c]) return COUNTRY_DISPLAY_SL[c]
  if (c.length === 2) return COUNTRY_ISO_SL[c.toUpperCase()] ?? c
  return c
}

/** Prikaz na karticah: "Phuket, Tajska" */
export function formatHotelDisplayLocation(location: string, countryHint?: string): string {
  const sanitized = sanitizeHotelLocation(location)
  const parts = sanitized.split(',').map((p) => p.trim()).filter(Boolean)
  const city = parts[0] ?? sanitized

  let country = countryHint?.trim()
  if (!country && parts.length > 1) {
    country = parts.slice(1).join(', ')
  }
  if (!country) return city

  return `${city}, ${localizeCountryName(country)}`
}

export function normalizeLocationKey(location: string): string {
  return extractBookingCity(location).toLowerCase()
}

/** Iz Duffel/letališča → "Mesto, Država" za hotele */
export function hotelLocationFromAirport(city: string, country: string): string {
  const cleanCity = stripAirportFromLocation(city)
  if (!cleanCity) return country ? localizeCountryName(country) : ''
  if (!country) return cleanCity
  return formatHotelDisplayLocation(`${cleanCity}, ${country}`)
}
