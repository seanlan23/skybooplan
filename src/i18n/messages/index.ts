import type { Locale } from '../config'
import type { Messages } from './types'
import { sl } from './sl'
import { en } from './en'
import { de } from './de'
import { es } from './es'
import { fr } from './fr'
import { it } from './it'
import { hr } from './hr'
import { pt } from './pt'
import { nl } from './nl'
import { pl } from './pl'
import { tr } from './tr'
import { zh } from './zh'
import { ar } from './ar'
import { ru } from './ru'
import { ja } from './ja'

export const messages: Record<Locale, Messages> = {
  sl,
  en,
  de,
  es,
  fr,
  it,
  hr,
  pt,
  nl,
  pl,
  tr,
  zh,
  ar,
  ru,
  ja,
}
export type { Messages } from './types'
