import type { Locale } from '@/i18n/config'

export type ItineraryServerLabels = {
  morning: string
  afternoon: string
  evening: string
  dinner: string
  perPerson: string
  transport: string
  transportFlight: string
  transportFerry: string
  transportBus: string
  transportCar: string
  travelHack: string
  dailyBudget: string
}

const SL: ItineraryServerLabels = {
  morning: 'Dopoldan',
  afternoon: 'Popoldan',
  evening: 'Večer',
  dinner: 'Večerja',
  perPerson: '/osebo',
  transport: 'Prevoz',
  transportFlight: 'Let',
  transportFerry: 'Trajekt',
  transportBus: 'Avtobus',
  transportCar: 'Avto',
  travelHack: 'Travel Hack',
  dailyBudget: 'Dnevni proračun',
}

const EN: ItineraryServerLabels = {
  morning: 'Morning',
  afternoon: 'Afternoon',
  evening: 'Evening',
  dinner: 'Dinner',
  perPerson: '/person',
  transport: 'Transport',
  transportFlight: 'Flight',
  transportFerry: 'Ferry',
  transportBus: 'Bus',
  transportCar: 'Car',
  travelHack: 'Travel Hack',
  dailyBudget: 'Daily budget',
}

const DE: ItineraryServerLabels = {
  morning: 'Vormittag',
  afternoon: 'Nachmittag',
  evening: 'Abend',
  dinner: 'Abendessen',
  perPerson: '/Person',
  transport: 'Transport',
  transportFlight: 'Flug',
  transportFerry: 'Fähre',
  transportBus: 'Bus',
  transportCar: 'Auto',
  travelHack: 'Travel Hack',
  dailyBudget: 'Tagesbudget',
}

const HR: ItineraryServerLabels = {
  morning: 'Jutro',
  afternoon: 'Poslijepodne',
  evening: 'Večer',
  dinner: 'Večera',
  perPerson: '/osobi',
  transport: 'Prijevoz',
  transportFlight: 'Let',
  transportFerry: 'Trajekt',
  transportBus: 'Autobus',
  transportCar: 'Auto',
  travelHack: 'Travel Hack',
  dailyBudget: 'Dnevni proračun',
}

const LABELS: Partial<Record<Locale, ItineraryServerLabels>> = {
  sl: SL,
  en: EN,
  de: DE,
  hr: HR,
}

export function getItineraryServerLabels(locale?: string): ItineraryServerLabels {
  if (locale && locale in LABELS) {
    return LABELS[locale as Locale] ?? SL
  }
  return SL
}
