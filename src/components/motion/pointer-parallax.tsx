'use client'

import { useRef, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type PointerParallaxProps = {
  children: ReactNode
  className?: string
  maxTranslate?: number
  maxRotate?: number
  hoverScale?: number
}

/**
 * Parallax wrapper that separates measurement from animation.
 *
 * Architecture:
 * - STATIC OUTER DIV (ref={measurementRef}) — measured for pointer coordinates
 * - INNER motion.div — translated/rotated subtly, contains the visual content
 *
 * The outer frame is never transformed by parallax, preventing measurement feedback loops.
 * getBoundingClientRect() is cached on mouseenter, reused for all mousemove events.
 */
export function PointerParallax({
  children,
  className = '',
  maxTranslate = 6,
  maxRotate = 0.3,
  hoverScale = 1.015,
}: PointerParallaxProps) {
  const measurementRef = useRef<HTMLDivElement>(null)
  const cachedRect = useRef<DOMRect | null>(null)
  const prefersReduced = useReducedMotion()

  // MotionValues — no React state for coordinates
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 200, damping: 25 })
  const springY = useSpring(mouseY, { stiffness: 200, damping: 25 })

  const translateX = useTransform(springX, [-0.5, 0.5], [-maxTranslate, maxTranslate])
  const translateY = useTransform(springY, [-0.5, 0.5], [-maxTranslate, maxTranslate])

  // Subtle rotation — start conservative, may remove entirely if imagery looks better without
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxRotate, -maxRotate])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxRotate, maxRotate])

  // Cache bounds on mouseenter — measure once, reuse for all moves
  const handleMouseEnter = useCallback(() => {
    if (measurementRef.current) {
      cachedRect.current = measurementRef.current.getBoundingClientRect()
    }
  }, [])

  // Use cached bounds for all mousemove calculations
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = cachedRect.current
    if (!rect) return

    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    cachedRect.current = null
  }, [mouseX, mouseY])

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <div
      ref={measurementRef}
      className={className}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ overflow: 'hidden' }}
    >
      <motion.div
        style={{
          x: translateX,
          y: translateY,
          rotateX,
          rotateY,
          transformPerspective: 1200,
        }}
        whileHover={{ scale: hoverScale }}
        transition={{ scale: { duration: 0.4, ease: 'easeOut' } }}
      >
        {children}
      </motion.div>
    </div>
  )
}
