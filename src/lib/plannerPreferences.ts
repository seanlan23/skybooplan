/** Stil / prednost potovanja za AI planer */
export type PlannerTravelStyle =
  | 'balanced'
  | 'low_budget'
  | 'luxury'
  | 'food'
  | 'adventure'

export const PLANNER_TRAVEL_STYLE_OPTIONS: {
  value: PlannerTravelStyle
  label: string
  promptLabel: string
}[] = [
  {
    value: 'balanced',
    label: 'Uravnoteženo (Znamenitosti & sprostitev)',
    promptLabel: 'Uravnoteženo (Znamenitosti & sprostitev)',
  },
  {
    value: 'low_budget',
    label: 'Nizkocenoven (Low-budget)',
    promptLabel: 'Nizkocenoven (Low-budget)',
  },
  {
    value: 'luxury',
    label: 'Luksuzen / Premium',
    promptLabel: 'Luksuzen / Premium',
  },
  {
    value: 'food',
    label: 'Gastronomski (Hrana & vino)',
    promptLabel: 'Gastronomski (Hrana & vino)',
  },
  {
    value: 'adventure',
    label: 'Avanturističen / Aktiven',
    promptLabel: 'Avanturističen / Aktiven',
  },
]

export function travelStyleToPromptLabel(style: PlannerTravelStyle): string {
  const found = PLANNER_TRAVEL_STYLE_OPTIONS.find((o) => o.value === style)
  return found?.promptLabel ?? PLANNER_TRAVEL_STYLE_OPTIONS[0].promptLabel
}

export function resolveDailyBudgetForPrompt(budgetInput: string): string {
  const trimmed = budgetInput.trim()
  if (!trimmed) return 'optimizirano'
  const n = Number(trimmed)
  if (Number.isFinite(n) && n > 0) return String(Math.round(n))
  return trimmed
}
