'use client'

import { useCallback, useLayoutEffect, useRef, useState } from 'react'

/** Privzeta višina ≈ 5 kartic + zavihki (px) */
export const DEFAULT_FLIGHTS_BLOCK_HEIGHT = 720

/**
 * Višina bloka z leti (do 5. kartice) — za fiksno višino AI planerja.
 * `remeasureKey` spremeni se → ponovno merjenje.
 */
export function useFlightResultsColumnHeight(remeasureKey: string | number = '') {
  const [height, setHeight] = useState(DEFAULT_FLIGHTS_BLOCK_HEIGHT)
  const nodeRef = useRef<HTMLDivElement | null>(null)
  const observerRef = useRef<ResizeObserver | null>(null)

  const measure = useCallback(() => {
    const el = nodeRef.current
    if (!el) return
    const next = Math.round(el.getBoundingClientRect().height)
    if (next > 80) setHeight(next)
  }, [])

  const ref = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      nodeRef.current = node
      if (!node) return

      measure()
      observerRef.current = new ResizeObserver(measure)
      observerRef.current.observe(node)
    },
    [measure]
  )

  useLayoutEffect(() => {
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [measure, remeasureKey])

  return { ref, height }
}
