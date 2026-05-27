'use client'

import { FlightsPlanGridSection } from '@/components/layout/FlightsPlanGridSection'
import { useSearchStore } from '@/store/useSearchStore'

export function FlightsPlanGridGate() {
  const isHotelsOnly = useSearchStore((s) => s.searchMode === 'hotels_only')
  if (isHotelsOnly) return null
  return <FlightsPlanGridSection />
}
