'use client'

import { useRef, useCallback, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useMotionProfile } from './use-motion-profile'
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
  const profile = useMotionProfile()

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
  const handleMouseEnter = useCallback((event: React.PointerEvent) => {
    if (event.pointerType === 'mouse' && measurementRef.current) {
      cachedRect.current = measurementRef.current.getBoundingClientRect()
    }
  }, [])

  // Use cached bounds for all mousemove calculations
  const handleMouseMove = useCallback((e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    const rect = cachedRect.current
    if (!rect) return

    const x = Math.max(-0.5, Math.min(0.5, (e.clientX - rect.left) / rect.width - 0.5))
    const y = Math.max(-0.5, Math.min(0.5, (e.clientY - rect.top) / rect.height - 0.5))
    mouseX.set(x)
    mouseY.set(y)
  }, [mouseX, mouseY])

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0)
    mouseY.set(0)
    cachedRect.current = null
  }, [mouseX, mouseY])

  useEffect(() => {
    // Invalidate stale bounds without reading layout during scrolling/movement.
    window.addEventListener('scroll', handleMouseLeave, true)
    window.addEventListener('resize', handleMouseLeave)
    handleMouseLeave()
    return () => {
      window.removeEventListener('scroll', handleMouseLeave, true)
      window.removeEventListener('resize', handleMouseLeave)
    }
  }, [profile, handleMouseLeave])

  if (profile !== 'full') {
    return <div className={className} data-parallax="off">{children}</div>
  }

  return (
    <div
      ref={measurementRef}
      data-parallax="full"
      className={className}
      onPointerEnter={handleMouseEnter}
      onPointerMove={handleMouseMove}
      onPointerLeave={handleMouseLeave}
      onPointerCancel={handleMouseLeave}
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
