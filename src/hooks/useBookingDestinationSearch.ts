'use client'

import { useEffect, useRef, useState } from 'react'
import type { BookingDestination } from '@/types/booking.types'

export function useBookingDestinationSearch() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<BookingDestination[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (query.length < 2) {
      setResults([])
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      if (abortRef.current) abortRef.current.abort()
      const controller = new AbortController()
      abortRef.current = controller
      setIsLoading(true)

      try {
        const res = await fetch(
          `/api/hotels/destinations?q=${encodeURIComponent(query)}`,
          { signal: controller.signal }
        )
        const data = await res.json()
        setResults(Array.isArray(data.destinations) ? data.destinations : [])
      } catch {
        if (!controller.signal.aborted) setResults([])
      } finally {
        setIsLoading(false)
      }
    }, 250)

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [query])

  return { query, setQuery, results, isLoading }
}
