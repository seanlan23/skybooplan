import type { Messages } from './messages/types'

function getNested(tree: Messages, path: string): string | undefined {
  const parts = path.split('.')
  let current: unknown = tree
  for (const part of parts) {
    if (typeof current !== 'object' || current == null || !(part in current)) {
      return undefined
    }
    current = (current as Record<string, unknown>)[part]
  }
  return typeof current === 'string' ? current : undefined
}

export function interpolate(
  template: string,
  params?: Record<string, string | number>
): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, key: string) => {
    const value = params[key]
    return value === undefined ? `{${key}}` : String(value)
  })
}

export function translate(
  tree: Messages,
  key: string,
  params?: Record<string, string | number>
): string {
  const raw = getNested(tree, key) ?? key
  return interpolate(raw, params)
}
