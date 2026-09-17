'use client'

import { useSyncExternalStore } from 'react'

export type NetworkProfile = 'normal' | 'save-data'

// navigator.connection is optional and not universally supported
type NetworkInformation = {
  saveData?: boolean
  effectiveType?: string
}

declare global {
  interface Navigator {
    connection?: NetworkInformation
  }
}

function subscribeNetwork(callback: () => void) {
  const conn = navigator.connection
  if (conn && 'addEventListener' in conn) {
    (conn as EventTarget).addEventListener('change', callback)
    return () => (conn as EventTarget).removeEventListener('change', callback)
  }
  return () => {}
}

function getNetworkSnapshot(): NetworkProfile {
  const conn = navigator.connection
  if (!conn) return 'normal'

  if (conn.saveData) return 'save-data'
  if (conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
    return 'save-data'
  }

  return 'normal'
}

function getServerNetworkSnapshot(): NetworkProfile {
  return 'normal'
}

/**
 * Determines the network/data loading profile.
 * Independent of motion/interaction capability.
 *
 * NORMAL:    Default — standard image loading and prefetch
 * SAVE_DATA: navigator.connection.saveData or slow effectiveType —
 *            skip gallery preload, defer non-critical images
 *
 * Works correctly when navigator.connection is unavailable (defaults to 'normal').
 */
export function useNetworkProfile(): NetworkProfile {
  return useSyncExternalStore(
    subscribeNetwork,
    getNetworkSnapshot,
    getServerNetworkSnapshot
  )
}
