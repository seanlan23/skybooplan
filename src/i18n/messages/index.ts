import type { Locale } from '../config'
import type { Messages } from './types'
import { mergeMessages } from '../mergeMessages'
import { sl } from './sl'
import { en } from './en'
import { de as dePartial } from './de'
import { es as esPartial } from './es'
import { fr as frPartial } from './fr'
import { it as itPartial } from './it'
import { hr as hrPartial } from './hr'
import { pt as ptPartial } from './pt'
import { nl as nlPartial } from './nl'
import { pl as plPartial } from './pl'
import { tr as trPartial } from './tr'
import { zh as zhPartial } from './zh'
import { ar as arPartial } from './ar'
import { ru as ruPartial } from './ru'
import { ja as jaPartial } from './ja'

export const messages: Record<Locale, Messages> = {
  sl,
  en,
  de: mergeMessages(en, dePartial),
  es: mergeMessages(en, esPartial),
  fr: mergeMessages(en, frPartial),
  it: mergeMessages(en, itPartial),
  hr: mergeMessages(en, hrPartial),
  pt: mergeMessages(en, ptPartial),
  nl: mergeMessages(en, nlPartial),
  pl: mergeMessages(en, plPartial),
  tr: mergeMessages(en, trPartial),
  zh: mergeMessages(en, zhPartial),
  ar: mergeMessages(en, arPartial),
  ru: mergeMessages(en, ruPartial),
  ja: mergeMessages(en, jaPartial),
}
export type { Messages } from './types'
