'use client'

import { useSyncExternalStore } from 'react'

/**
 * Hydration-safe media query hook using useSyncExternalStore.
 * Returns false during SSR and on first client render to avoid hydration mismatch.
 * Resolves to the actual value after hydration.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (callback) => {
      const mql = window.matchMedia(query)
      mql.addEventListener('change', callback)
      return () => mql.removeEventListener('change', callback)
    },
    () => window.matchMedia(query).matches,
    () => false // Server snapshot — always false to avoid hydration mismatch
  )
}
