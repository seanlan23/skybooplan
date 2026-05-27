/** Shared width for results grid (aligned entry blocks). */
export const CONTENT_MAX = 'max-w-[1200px]'

/** Enaka širina za iskalnik + mrežo (AI planer + leti) */
export const CONTENT_CONTAINER = `${CONTENT_MAX} mx-auto w-full px-4 md:px-6`

export const SEARCH_BAR_CONTAINER = CONTENT_CONTAINER

/** AI planer ~43%, kartice letov ~57% (kartice −15 % glede na prejšnjih 67 %) */
export const PLANNER_RESULTS_GRID = 'lg:grid-cols-[43fr_57fr]'

/** Najprej prikazanih kartic letov; ostalo prek «Prikaži več» */
export const FLIGHT_CARDS_INITIAL_VISIBLE = 5
