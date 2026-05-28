'use client'

import dynamic from 'next/dynamic'
import type { ComponentProps } from 'react'

const MapViewLazy = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div
      className="flex w-full items-center justify-center rounded-xl border border-slate-200 bg-slate-100"
      style={{ minHeight: 400 }}
    >
      <span className="text-sm text-slate-500">Nalagam zemljevid…</span>
    </div>
  ),
})

export type MapViewDynamicProps = ComponentProps<typeof MapViewLazy>

export function MapViewDynamic(props: MapViewDynamicProps) {
  return <MapViewLazy {...props} />
}
