'use client'

import { MotionConfig } from 'motion/react'
import type { ReactNode } from 'react'

/**
 * Global motion configuration provider.
 * Wraps the site layout to provide consistent motion behavior.
 *
 * reducedMotion="user" respects the user's OS-level prefers-reduced-motion setting.
 */
export function MotionProvider({ children }: { children: ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
      {children}
    </MotionConfig>
  )
}
