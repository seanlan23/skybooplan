'use client'
import { Moon } from 'lucide-react'
import { useSearchStore } from '@/store/useSearchStore'
import { cn } from '@/lib/utils'

export function NightsInput() {
  const { nights, setNights } = useSearchStore()

  return (
    <div className="w-32 shrink-0">
      <label className="block text-xs font-semibold text-slate-500 mb-1 px-1">Nočitve</label>
      <div className="flex items-center gap-1.5 px-3 py-2.5 bg-white border border-slate-200 rounded-2xl hover:border-slate-300 transition-colors focus-within:border-sky-400 focus-within:ring-2 focus-within:ring-sky-100">
        <Moon className="w-4 h-4 text-slate-400 shrink-0" />
        <input
          type="number"
          min={1}
          max={60}
          value={nights ?? ''}
          onChange={(e) => setNights(e.target.value ? parseInt(e.target.value) : null)}
          placeholder="7"
          className="w-full outline-none text-sm text-slate-800 placeholder:text-slate-400 bg-transparent font-medium"
          aria-label="Število nočitev"
        />
      </div>
    </div>
  )
}
