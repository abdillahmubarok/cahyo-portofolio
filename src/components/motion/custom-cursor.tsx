'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState, useSyncExternalStore } from 'react'

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

export function CustomCursor() {
  const hasFinePointer = useSyncExternalStore(
    subscribePointer,
    getPointerSnapshot,
    getServerPointerSnapshot
  )

  const cursorX = useMotionValue(-100)
  const cursorY = useMotionValue(-100)
  const springX = useSpring(cursorX, { stiffness: 500, damping: 40 })
  const springY = useSpring(cursorY, { stiffness: 500, damping: 40 })

  const [isHovering, setIsHovering] = useState(false)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!hasFinePointer) return

    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReduced) return

    const handleMove = (e: MouseEvent) => {
      cursorX.set(e.clientX)
      cursorY.set(e.clientY)
      if (!isVisible) setIsVisible(true)
    }

    const handleEnter = () => setIsVisible(true)
    const handleLeave = () => setIsVisible(false)

    // Detect hoverable elements
    const handleOverProject = () => setIsHovering(true)
    const handleOutProject = () => setIsHovering(false)

    document.addEventListener('mousemove', handleMove)
    document.addEventListener('mouseenter', handleEnter)
    document.addEventListener('mouseleave', handleLeave)

    // Use MutationObserver to handle dynamic project cards
    const setupListeners = () => {
      document.querySelectorAll('[data-cursor-hover]').forEach(el => {
        el.addEventListener('mouseenter', handleOverProject)
        el.addEventListener('mouseleave', handleOutProject)
      })
    }
    setupListeners()

    const observer = new MutationObserver(setupListeners)
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', handleMove)
      document.removeEventListener('mouseenter', handleEnter)
      document.removeEventListener('mouseleave', handleLeave)
      document.querySelectorAll('[data-cursor-hover]').forEach(el => {
        el.removeEventListener('mouseenter', handleOverProject)
        el.removeEventListener('mouseleave', handleOutProject)
      })
      observer.disconnect()
    }
  }, [hasFinePointer, cursorX, cursorY, isVisible])

  if (!hasFinePointer) return null

  return (
    <motion.div
      className="custom-cursor"
      style={{ x: springX, y: springY }}
      animate={{
        width: isHovering ? 80 : 8,
        height: isHovering ? 80 : 8,
        opacity: isVisible ? 1 : 0,
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
