import { cn } from '@/lib/utils'

export type SearchFieldVariant = 'default' | 'skyscanner'

export function fieldShellClass(variant: SearchFieldVariant, focused: boolean, className?: string) {
  if (variant === 'skyscanner') {
    return cn(
      'flex flex-col justify-center h-full min-h-[72px] px-4 py-3 bg-white text-left w-full min-w-0',
      'rounded-xl border border-slate-200 transition-colors duration-150',
      'hover:border-slate-300',
      focused && 'border-sky-400 bg-sky-50/50 ring-2 ring-sky-100',
      className
    )
  }
  return cn(
    'flex flex-wrap gap-1.5 items-center min-h-[46px] px-3 py-2 bg-white border rounded-2xl transition-all duration-200 cursor-text',
    focused ? 'border-sky-400 ring-2 ring-sky-100' : 'border-slate-200 hover:border-slate-300',
    className
  )
}

export function fieldLabelClass(variant: SearchFieldVariant) {
  return variant === 'skyscanner'
    ? 'text-[11px] font-medium text-slate-500 leading-tight mb-0.5'
    : 'block text-xs font-semibold text-slate-500 mb-1 px-1'
}
