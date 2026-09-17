'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useRef, useState, useSyncExternalStore } from 'react'

// ─── Pointer capability detection (hydration-safe) ───

function subscribePointer(callback: () => void) {
  const mq = window.matchMedia('(pointer: fine)')
  mq.addEventListener('change', callback)
  return () => mq.removeEventListener('change', callback)
}

function getPointerSnapshot() {
  return window.matchMedia('(pointer: fine)').matches
}

function getServerPointerSnapshot() {
  return false
}

// ─── Component ───

export function CustomCursor() {
  const hasFinePointer = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getServerPointerSnapshot
  )

  // Position tracked entirely via MotionValues — no React state, no re-renders
  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { stiffness: 500, damping: 40 })
  const springY = useSpring(cursorY, { stiffness: 500, damping: 40 })

  // Hover state — only boolean, set via event delegation
  const [isHovering, setIsHovering] = useState(false)

  // Visibility tracked via ref to avoid useEffect re-runs
  const isVisibleRef = useRef(false)
  const [, forceVisibility] = useState(0)

  useEffect(() => {
    if (!hasFinePointer) return

    // One-time reduced motion check at init
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    let visible = false

    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!visible) {
        visible = true
        isVisibleRef.current = true
        forceVisibility(v => v + 1)
      }
    }

    const handleEnter = () => {
      visible = true
      isVisibleRef.current = true
      forceVisibility(v => v + 1)
    }

    const handleLeave = () => {
      visible = false
      isVisibleRef.current = false
      forceVisibility(v => v + 1)
    }

    // ─── Event delegation for hover detection ───
    // Single mouseover/mouseout listener on document, no MutationObserver
    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (target.closest?.('[data-cursor-hover]')) {
        setIsHovering(true)
      }
    }

    const handleMouseOut = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const related = e.relatedTarget as HTMLElement | null
      // Only unhover if we've actually left the [data-cursor-hover] boundary
      if (
        target.closest?.('[data-cursor-hover]') &&
        (!related || !related.closest?.('[data-cursor-hover]'))
      ) {
        setIsHovering(false)
      }
    }

    document.addEventListener('mousemove', handleMove, { passive: true })
    document.addEventListener('mouseenter', handleEnter)
    document.addEventListener('mouseleave', handleLeave)
    document.addEventListener('mouseover', handleMouseOver, { passive: true })
    document.addEventListener('mouseout', handleMouseOut, { passive: true })

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseenter', handleEnter)
      document.removeEventListener('mouseleave', handleLeave)
      document.removeEventListener('mouseover', handleMouseOver)
      document.removeEventListener('mouseout', handleMouseOut)
    }
  }, [hasFinePointer, cursorX, cursorY])

  if (!hasFinePointer) return null

  return (
    <motion.div
      className="custom-cursor"
      style={{ x: springX, y: springY }}
      animate={{
        width: isHovering ? 80 : 8,
        height: isHovering ? 80 : 8,
        opacity: isVisibleRef.current ? 1 : 0,
        translateX: isHovering ? -40 : -4,
        translateY: isHovering ? -40 : -4,
      }}
      transition={{ duration: 0.2 }}
    >
      <div
        className="flex items-center justify-center rounded-full bg-white"
        style={{
          width: '100%',
          height: '100%',
        }}
      >
        {isHovering && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-[11px] font-medium tracking-[0.1em] uppercase text-black"
          >
            Lihat
          </motion.span>
        )}
      </div>
    </motion.div>
  )
}
