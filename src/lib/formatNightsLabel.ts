import type { TranslateFn } from '@/i18n/LocaleProvider'

export function formatNightsLabel(n: number, t: TranslateFn): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return t('planner.nightsOne', { n })
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return t('planner.nightsFew', { n })
  }
  return t('planner.nightsMany', { n })
}
