'use client'

import { useRef } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'motion/react'
import type { ReactNode } from 'react'

type PointerParallaxProps = {
  children: ReactNode
  className?: string
  maxTranslate?: number
  maxRotate?: number
  scale?: number
}

export function PointerParallax({
  children,
  className = '',
  maxTranslate = 8,
  maxRotate = 1,
  scale = 1.03,
}: PointerParallaxProps) {
  const ref = useRef<HTMLDivElement>(null)
  const prefersReduced = useReducedMotion()

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 })
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 })

  const translateX = useTransform(springX, [-0.5, 0.5], [-maxTranslate, maxTranslate])
  const translateY = useTransform(springY, [-0.5, 0.5], [-maxTranslate, maxTranslate])
  const rotateX = useTransform(springY, [-0.5, 0.5], [maxRotate, -maxRotate])
  const rotateY = useTransform(springX, [-0.5, 0.5], [-maxRotate, maxRotate])

  const handleMouseMove = (e: React.MouseEvent) => {
    if (prefersReduced || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    mouseX.set(x)
    mouseY.set(y)
  }

  const handleMouseLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  if (prefersReduced) {
    return <div className={className}>{children}</div>
  }

  return (
    <motion.div
      ref={ref}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        x: translateX,
        y: translateY,
        rotateX,
        rotateY,
        transformPerspective: 800,
      }}
      whileHover={{ scale }}
      transition={{ scale: { duration: 0.3, ease: 'easeOut' } }}
    >
      {children}
    </motion.div>
  )
}
