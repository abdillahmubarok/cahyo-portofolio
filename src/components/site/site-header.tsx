'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { Menu, X } from 'lucide-react'

const navLinks = [
  { href: '#projects', label: 'Proyek' },
  { href: '#about', label: 'Tentang' },
  { href: '#services', label: 'Layanan' },
  { href: '#contact', label: 'Kontak' },
]

type SiteHeaderProps = {
  studioName?: string | null
}

export function SiteHeader({ studioName }: SiteHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [activeSection, setActiveSection] = useState<string | null>(null)

  // Track active section via IntersectionObserver
  useEffect(() => {
    if (pathname !== '/') return

    const sectionIds = navLinks.map(l => l.href.replace('#', ''))
    const observers: IntersectionObserver[] = []

    sectionIds.forEach(id => {
      const el = document.getElementById(id)
      if (!el) return

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setActiveSection(`#${id}`)
            }
          })
        },
        { rootMargin: '-20% 0px -60% 0px', threshold: 0 }
      )
      observer.observe(el)
      observers.push(observer)
    })

    return () => observers.forEach(o => o.disconnect())
  }, [pathname])

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    // Only smooth-scroll if we're on the homepage
    if (pathname === '/') {
      e.preventDefault()
      const id = href.replace('#', '')
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        // Update URL hash without scroll jump
        window.history.pushState(null, '', href)
      }
      setMobileOpen(false)
    }
    // If not on homepage, the Link will navigate to /#section which triggers redirect
  }, [pathname])

  const isHomepage = pathname === '/'

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-sm border-b border-border/50">
        <div className="container-site flex items-center justify-between h-16 md:h-20">
          <Link
            href="/"
            className="text-sm md:text-base font-medium tracking-[0.15em] uppercase"
          >
            {studioName || 'Cahyo Architecture'}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-8" aria-label="Navigasi utama">
            {navLinks.map(link => (
              <a
                key={link.href}
                href={isHomepage ? link.href : `/${link.href}`}
                onClick={(e) => handleNavClick(e, link.href)}
                className={`text-[13px] tracking-[0.1em] uppercase transition-colors hover:text-foreground ${
                  activeSection === link.href && isHomepage
                    ? 'text-foreground'
                    : 'text-muted'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 -mr-2"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            className="fixed inset-0 z-40 bg-background flex flex-col items-center justify-center md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col items-center gap-8" aria-label="Navigasi mobile">
              {navLinks.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  transition={{ delay: i * 0.05 + 0.1 }}
                >
                  <a
                    href={isHomepage ? link.href : `/${link.href}`}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`heading-lg transition-colors ${
                      activeSection === link.href && isHomepage ? 'text-foreground' : 'text-muted'
                    }`}
                  >
                    {link.label}
                  </a>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-16 md:h-20" />
    </>
  )
}
