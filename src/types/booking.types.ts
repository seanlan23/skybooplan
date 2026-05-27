/** Destinacija iz DataCrawler searchDestination (mesto, ne letališče) */
export interface BookingDestination {
  destId: string
  searchType: string
  /** Polna oznaka za prikaz, npr. "Tuzla, Bosnia and Herzegovina" */
  label: string
  name: string
  cityName: string
  country: string
  destType: string
}

export interface PassengerFormData {
  givenName: string
  familyName: string
  bornOn: string
  gender: 'male' | 'female'
  title: 'mr' | 'mrs' | 'ms' | 'miss'
  passportNumber: string
  passportIssuingCountry: string
  passportExpiresOn: string
}

export interface BookingContact {
  email: string
  phone: string
}

export interface PackageQuoteResponse {
  success: boolean
  error?: string
  quoteId?: string
  reference?: string
  message?: string
}
