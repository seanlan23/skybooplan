/** Tempo potovanja za AI načrtovalec (zavihek AI). */
export type AiTravelTempo = 'intensive' | 'relaxed' | 'calm'

export const AI_TRAVEL_TEMPO_OPTIONS: {
  value: AiTravelTempo
  label: string
  promptLabel: string
}[] = [
  { value: 'intensive', label: 'Intenzivno', promptLabel: 'Intenzivno (več aktivnosti na dan)' },
  { value: 'relaxed', label: 'Sproščeno', promptLabel: 'Sproščeno (uravnotežen ritem)' },
  { value: 'calm', label: 'Umirjeno', promptLabel: 'Umirjeno (počasen tempo, več prostega časa)' },
]

export const VALID_AI_TRAVEL_TEMPO = new Set<AiTravelTempo>(
  AI_TRAVEL_TEMPO_OPTIONS.map((o) => o.value)
)

export const MIN_AI_WISHES_LENGTH = 6

export const AI_WISHES_PLACEHOLDER =
  'Napišite nekaj besed o vaših željah (npr. potovanje z otroki, radi imamo naravo, brez nočnih voženj...)'

export const DEFAULT_AI_TRAVEL_TEMPO: AiTravelTempo = 'relaxed'

export function isAiPlannerPrefsValid(
  tempo: AiTravelTempo | null | undefined,
  wishes: string
): boolean {
  return !!tempo && wishes.trim().length >= MIN_AI_WISHES_LENGTH
}

export function aiTravelTempoToPromptLabel(tempo: AiTravelTempo): string {
  return AI_TRAVEL_TEMPO_OPTIONS.find((o) => o.value === tempo)?.promptLabel ?? tempo
}
