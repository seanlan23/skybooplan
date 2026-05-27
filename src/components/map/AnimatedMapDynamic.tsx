'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'
import { cn } from '@/lib/utils'

const AnimatedMapLazy = dynamic(() => import('./AnimatedMap'), {
  ssr: false,
  loading: () => (
    <div
      className={cn(
        'w-full rounded-2xl border border-slate-800/80 bg-slate-900',
        'h-[min(56vh,520px)] min-h-[360px]',
        'flex items-center justify-center'
      )}
    >
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="h-8 w-8 rounded-full border-2 border-sky-500/40 border-t-sky-400 animate-spin" />
        <span className="text-sm font-medium">Nalagam zemljevid…</span>
      </div>
    </div>
  ),
})

export type AnimatedMapDynamicProps = ComponentProps<typeof AnimatedMapLazy>

export type { Location, AnimatedMapProps } from './AnimatedMap'
export { DEMO_THAILAND_LOCATIONS } from './AnimatedMap'

/** Next.js-friendly wrapper (no SSR for Mapbox GL). */
export function AnimatedMapDynamic(props: AnimatedMapDynamicProps) {
  return <AnimatedMapLazy {...props} />
}
