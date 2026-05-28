import { create } from 'zustand'
import type { AiTravelTempo } from '@/lib/aiPlannerTempo'
import type { PlannerTravelStyle } from '@/lib/plannerPreferences'
import type { ItineraryDay, ItineraryTripSummary } from '@/types/itinerary.types'

export interface HotelsOnlyContext {
  destinationLabel: string
  arrivalAt: string
  travelNights: number
  checkIn: Date
  checkOut: Date
}

export interface ItineraryCompletenessWarning {
  expectedDays: number
  generatedDays: number
}

interface PlannerState {
  itinerary: ItineraryDay[]
  tripSummary: ItineraryTripSummary | null
  itineraryCompleteness: ItineraryCompletenessWarning | null
  isGenerating: boolean
  generatingProgress: number
  activeLocation: string | null
  customLocations: string[]
  mode: 'ai' | 'custom'
  hotelsOnlyContext: HotelsOnlyContext | null
  /** Proračun na osebo (€), brez letov in nastanitve — vnos uporabnika */
  dailyBudgetPerPerson: string
  travelStyle: PlannerTravelStyle
  /** Tempo za zavihek AI (Intenzivno / Sproščeno / Umirjeno) */
  travelTempo: AiTravelTempo
  specialRequestsText: string
  // Actions
  setItinerary: (days: ItineraryDay[]) => void
  setTripSummary: (summary: ItineraryTripSummary | null) => void
  setItineraryCompleteness: (warning: ItineraryCompletenessWarning | null) => void
  setIsGenerating: (v: boolean) => void
  setProgress: (v: number) => void
  setActiveLocation: (loc: string | null) => void
  addCustomLocation: (loc: string) => void
  removeCustomLocation: (loc: string) => void
  reorderCustomLocations: (from: number, to: number) => void
  setMode: (mode: 'ai' | 'custom') => void
  setHotelsOnlyContext: (ctx: HotelsOnlyContext | null) => void
  setDailyBudgetPerPerson: (value: string) => void
  setTravelStyle: (style: PlannerTravelStyle) => void
  setTravelTempo: (tempo: AiTravelTempo) => void
  setSpecialRequestsText: (value: string) => void
  reset: () => void
}

export const usePlannerStore = create<PlannerState>((set) => ({
  itinerary: [],
  tripSummary: null,
  itineraryCompleteness: null,
  isGenerating: false,
  generatingProgress: 0,
  activeLocation: null,
  customLocations: [],
  mode: 'ai',
  hotelsOnlyContext: null,
  dailyBudgetPerPerson: '',
  travelStyle: 'balanced',
  travelTempo: 'relaxed',
  specialRequestsText: '',

  setItinerary: (days) => set({ itinerary: days }),
  setTripSummary: (tripSummary) => set({ tripSummary }),
  setItineraryCompleteness: (itineraryCompleteness) => set({ itineraryCompleteness }),
  setIsGenerating: (v) => set({ isGenerating: v }),
  setProgress: (v) => set({ generatingProgress: v }),
  setActiveLocation: (loc) => set({ activeLocation: loc }),
  addCustomLocation: (loc) =>
    set((s) => ({
      customLocations: s.customLocations.includes(loc)
        ? s.customLocations
        : [...s.customLocations, loc],
    })),
  removeCustomLocation: (loc) =>
    set((s) => ({ customLocations: s.customLocations.filter((l) => l !== loc) })),
  reorderCustomLocations: (from, to) =>
    set((s) => {
      const arr = [...s.customLocations]
      const [item] = arr.splice(from, 1)
      arr.splice(to, 0, item)
      return { customLocations: arr }
    }),
  setMode: (mode) => set({ mode }),
  setHotelsOnlyContext: (ctx) => set({ hotelsOnlyContext: ctx }),
  setDailyBudgetPerPerson: (dailyBudgetPerPerson) => set({ dailyBudgetPerPerson }),
  setTravelStyle: (travelStyle) => set({ travelStyle }),
  setTravelTempo: (travelTempo) => set({ travelTempo }),
  setSpecialRequestsText: (specialRequestsText) => set({ specialRequestsText }),
  reset: () =>
    set({
      itinerary: [],
      tripSummary: null,
      itineraryCompleteness: null,
      isGenerating: false,
      generatingProgress: 0,
      activeLocation: null,
      customLocations: [],
      mode: 'ai',
      hotelsOnlyContext: null,
      dailyBudgetPerPerson: '',
      travelStyle: 'balanced',
      travelTempo: 'relaxed',
      specialRequestsText: '',
    }),
}))
