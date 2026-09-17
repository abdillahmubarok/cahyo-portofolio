'use client'

import { motion, useMotionValue, useSpring } from 'motion/react'
import { useEffect, useState } from 'react'
import { useMotionProfile } from './use-motion-profile'

export function CustomCursor() {
  const profile = useMotionProfile()
  const x = useMotionValue(-100)
  const y = useMotionValue(-100)
  const opacity = useMotionValue(0)
  const springX = useSpring(x, { stiffness: 500, damping: 40 })
  const springY = useSpring(y, { stiffness: 500, damping: 40 })
  const [hovering, setHovering] = useState(false)

  useEffect(() => {
    if (profile !== 'full') return
    const move = (event: PointerEvent) => {
      // Hybrid devices can switch input without changing their media queries.
      if (event.pointerType !== 'mouse') { opacity.set(0); return }
      x.set(event.clientX)
      y.set(event.clientY)
      opacity.set(1)
    }
    const over = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse') { opacity.set(0); return }
      setHovering(event.target instanceof Element && !!event.target.closest('[data-cursor-hover]'))
    }
    const out = (event: PointerEvent) => {
      setHovering(event.relatedTarget instanceof Element && !!event.relatedTarget.closest('[data-cursor-hover]'))
      if (!event.relatedTarget) opacity.set(0)
    }
    const hide = () => opacity.set(0)
    document.addEventListener('pointermove', move, { passive: true })
    document.addEventListener('pointerdown', move, { passive: true })
    document.addEventListener('pointerover', over, { passive: true })
    document.addEventListener('pointerout', out, { passive: true })
    window.addEventListener('blur', hide)
    document.addEventListener('visibilitychange', hide)
    return () => {
      document.removeEventListener('pointermove', move)
      document.removeEventListener('pointerdown', move)
      document.removeEventListener('pointerover', over)
      document.removeEventListener('pointerout', out)
      window.removeEventListener('blur', hide)
      document.removeEventListener('visibilitychange', hide)
      opacity.set(0)
    }
  }, [profile, x, y, opacity])

  if (profile !== 'full') return null
  return (
    <motion.div aria-hidden="true" className="custom-cursor" style={{ x: springX, y: springY, opacity }}>
      <div style={{ transform: 'translate(-50%, -50%)' }}>
        <motion.div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/80 bg-foreground/90 text-white shadow-sm"
          animate={{ scale: hovering ? 1 : 0.125 }} transition={{ duration: 0.18 }}>
          <motion.span className="text-[10px] uppercase tracking-widest" animate={{ opacity: hovering ? 1 : 0 }}>Lihat</motion.span>
        </motion.div>
      </div>
    </motion.div>
  )
}
