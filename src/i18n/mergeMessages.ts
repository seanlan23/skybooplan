import type { DeepPartialMessages, Messages } from './messages/types'

/** Deep-merge partial locale overrides onto English base messages. */
export function mergeMessages(base: Messages, override: DeepPartialMessages): Messages {
  const out: Record<string, unknown> = { ...base }

  for (const key of Object.keys(override) as (keyof Messages)[]) {
    const baseSection = base[key]
    const overrideSection = override[key]
    if (overrideSection && typeof overrideSection === 'object') {
      out[key as string] = { ...baseSection, ...overrideSection }
    }
  }

  return out as Messages
}

export type { DeepPartialMessages } from './messages/types'
