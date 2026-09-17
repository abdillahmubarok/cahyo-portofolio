'use client'

import { useState, useCallback, useEffect, useMemo, useRef } from 'react'
import { ProjectCard } from './project-card'
import { ProjectFilter } from './project-filter'
import { ProjectDrawer } from './project-drawer'
import { RevealText, FadeIn } from '@/components/motion/reveal'
import type { ProjectWithMedia } from '@/lib/types'

type PortfolioSectionProps = {
  projects: ProjectWithMedia[]
}

/**
 * Client island that orchestrates:
 * - Category filtering
 * - Project card grid
 * - Project drawer with URL state management
 * - History push/pop for drawer open/close
 */
export function PortfolioSection({ projects }: PortfolioSectionProps) {
  const [activeCategory, setActiveCategory] = useState('Semua')
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null)
  const returnFocusRef = useRef<HTMLElement | null>(null)

  // Extract unique categories from actual data
  const categories = useMemo(() => {
    const cats = new Set<string>()
    projects.forEach(p => {
      if (p.category && p.category.trim()) cats.add(p.category)
    })
    return Array.from(cats).sort()
  }, [projects])

  // Filter projects by active category
  const filteredProjects = useMemo(() => {
    if (activeCategory === 'Semua') return projects
    return projects.filter(p => p.category === activeCategory)
  }, [projects, activeCategory])

  // ─── URL State Machine ───

  // On mount: check for ?project=slug (deep link)
  useEffect(() => {
    const slugParam = new URL(window.location.href).searchParams.get('project')
    if (slugParam) {
      const exists = projects.some(p => p.slug === slugParam)
      if (exists) {
        // Synchronize external URL state after hydration; cards remain in SSR HTML.
        const frame = requestAnimationFrame(() => setSelectedSlug(slugParam))
        return () => cancelAnimationFrame(frame)
        // Deep link — mark that we did NOT push this entry
      } else {
        // Invalid slug — silently remove
        const url = new URL(window.location.href)
        url.searchParams.delete('project')
        window.history.replaceState(window.history.state, '', url.toString())
      }
    }
  }, [projects])

  // Listen for popstate (Back/Forward)
  useEffect(() => {
    const handlePopState = () => {
      const url = new URL(window.location.href)
      const slugParam = url.searchParams.get('project')
      if (slugParam) {
        const exists = projects.some(p => p.slug === slugParam)
        setSelectedSlug(exists ? slugParam : null)
      } else {
        setSelectedSlug(null)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [projects])

  // Open project drawer
  const handleOpenProject = useCallback((slug: string, trigger: HTMLButtonElement) => {
    returnFocusRef.current = trigger
    setSelectedSlug(slug)

    // Push a new history entry with marker
    const url = new URL(window.location.href)
    url.searchParams.set('project', slug)
    // Preserve hash
    url.hash = '#projects'
    window.history.pushState({ ...window.history.state, cahyoPortfolio: { ...window.history.state?.cahyoPortfolio, drawer: true, slug } }, '', url.toString())
  }, [])

  // Close project drawer
  const handleCloseDrawer = useCallback(() => {
    // Check if the current entry was pushed by us
    const state = window.history.state
    if (state?.cahyoPortfolio?.drawer) {
      // Pop our entry — Back button semantics
      window.history.back()
    } else {
      setSelectedSlug(null)
      // Deep link case — we didn't push, so replace instead of going back
      const url = new URL(window.location.href)
      url.searchParams.delete('project')
      if (!url.hash) url.hash = '#projects'
      window.history.replaceState({ ...state, cahyoPortfolio: { ...state?.cahyoPortfolio, drawer: false, slug: null } }, '', url.toString())
    }
  }, [])

  // Navigate to adjacent project inside drawer (replaceState, no new back entry)
  const handleNavigateProject = useCallback((slug: string) => {
    setSelectedSlug(slug)

    const url = new URL(window.location.href)
    url.searchParams.set('project', slug)
    if (!url.hash) url.hash = '#projects'
    const state = window.history.state
    window.history.replaceState({ ...state, cahyoPortfolio: { ...state?.cahyoPortfolio, drawer: state?.cahyoPortfolio?.drawer === true, slug } }, '', url.toString())
  }, [])

  return (
    <section id="projects" className="section-gap">
      <div className="container-site">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 md:mb-14">
          <RevealText>
            <span className="text-label block mb-3">Portofolio</span>
            <h2 className="heading-xl">Karya Kami</h2>
          </RevealText>

          <FadeIn>
            <ProjectFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </FadeIn>
        </div>

        {/* Project Grid */}
        <div className="masonry-grid">
          {filteredProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              expanded={selectedSlug === project.slug}
              onOpenProject={handleOpenProject}
            />
          ))}
        </div>

        {filteredProjects.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted">Belum ada proyek dalam kategori ini.</p>
          </div>
        )}
      </div>

      {/* Project Drawer — renders in portal */}
        <ProjectDrawer
          projects={projects}
          selectedSlug={selectedSlug}
          onClose={handleCloseDrawer}
          onSelectProject={handleNavigateProject}
          returnFocusRef={returnFocusRef}
        />
    </section>
  )
}
