'use client'
import { Radar } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'

export function RadiusSelector() {
  const { radiusKm, setRadius } = useSearchStore()

  return (
    <div className="w-36 shrink-0">
      <label className="block text-xs font-semibold text-slate-500 mb-1 px-1">
        Radij {radiusKm > 0 ? `(${radiusKm} km)` : ''}
      </label>
      <div className="flex items-center gap-2 px-3 py-2.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
        <Radar className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="range"
          min={0}
          max={700}
          step={50}
          value={radiusKm}
          onChange={(e) => setRadius(parseInt(e.target.value))}
          className="w-full accent-sky-500 cursor-pointer"
          aria-label="Radij iskanja v km"
        />
      </div>
      {radiusKm > 0 && (
        <p className="text-xs text-sky-600 mt-0.5 px-1">±{radiusKm} km od izhodišča</p>
      )}
    </div>
  )
}
