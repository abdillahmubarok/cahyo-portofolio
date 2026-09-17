'use client'

import { useMediaQuery } from './use-media-query'

export type MotionProfile = 'full' | 'lite' | 'reduced'

/**
 * Determines the motion/interaction profile based on device capability.
 * Independent of network quality.
 *
 * FULL:    Fine pointer + hover capability + no reduced-motion preference
 * LITE:    Touch/coarse pointer, or no hover capability
 * REDUCED: prefers-reduced-motion: reduce
 */
export function useMotionProfile(): MotionProfile {
  const prefersReduced = useMediaQuery('(prefers-reduced-motion: reduce)')
  const hasFinePointer = useMediaQuery('(pointer: fine)')
  const hasHover = useMediaQuery('(hover: hover)')

  if (prefersReduced) return 'reduced'
  if (hasFinePointer && hasHover) return 'full'
  return 'lite'
}
