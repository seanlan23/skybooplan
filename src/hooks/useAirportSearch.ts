'use client'
import { useState, useEffect, useRef } from 'react'
import { searchFallbackAirports } from '@/data/airports'
import { mergeAirportLists, organizeAirportSuggestions } from '@/lib/airportSuggestions'
import { useTranslations } from '@/i18n/LocaleProvider'
import type { Airport } from '@/types/flight.types'

export function useAirportSearch() {
  const { t } = useTranslations()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Airport[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    const allAirportsLabel = t('airports.all')
    const local = organizeAirportSuggestions(
      searchFallbackAirports(query, 12, allAirportsLabel),
      query,
      10,
      allAirportsLabel
    )
    setResults(local)

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      const timeoutId = setTimeout(() => controller.abort(), 8_000)
      setIsLoading(true)
      try {
        const res = await fetch(`/api/flights/airports?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        })
        clearTimeout(timeoutId)
        const data = await res.json()
        const remote = Array.isArray(data) ? data : (data.airports ?? data.data ?? [])
        setResults(
          organizeAirportSuggestions(mergeAirportLists(local, remote), query, 10, allAirportsLabel)
        )
      } catch {
        clearTimeout(timeoutId)
        setResults(local)
      } finally {
        setIsLoading(false)
      }
    }, 200)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query, t])

  return { query, setQuery, results, isLoading }
}
