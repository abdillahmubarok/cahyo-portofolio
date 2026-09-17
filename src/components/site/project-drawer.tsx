'use client'

import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from 'react'
import { Drawer } from '@base-ui/react/drawer'
import { X } from 'lucide-react'
import { useMediaQuery } from '@/components/motion/use-media-query'
import { DrawerProjectContent } from './drawer-project-content'
import type { ProjectWithMedia } from '@/lib/types'
import './project-drawer.css'

type ProjectDrawerProps = {
  projects: ProjectWithMedia[]
  selectedSlug: string | null
  onClose: () => void
  onSelectProject: (slug: string) => void
  returnFocusRef: RefObject<HTMLElement | null>
}

/**
 * Responsive project drawer using Base UI Drawer primitive.
 *
 * Mobile (<768px): Bottom sheet with snap points [0.48, 0.94], swipeDirection="down"
 * Desktop (≥768px): Right project canvas (75vw, max-width 1200px), swipeDirection="right"
 *
 * Base UI owns all positioning, swipe, and transition behavior.
 * Motion is only used inside DrawerProjectContent for subtle reveals.
 */
export function ProjectDrawer({
  projects,
  selectedSlug,
  onClose,
  onSelectProject,
  returnFocusRef,
}: ProjectDrawerProps) {
  const isDesktop = useMediaQuery('(min-width: 768px)')
  const isOpen = selectedSlug !== null
  const contentRef = useRef<HTMLDivElement>(null)
  const [snapPoint, setSnapPoint] = useState<Drawer.Root.SnapPoint | null>(0.48)

  // Find the selected project
  const selectedProject = useMemo(() => {
    if (!selectedSlug) return null
    return projects.find(p => p.slug === selectedSlug) ?? null
  }, [selectedSlug, projects])

  // Compute adjacent projects for prev/next navigation
  const adjacentProjects = useMemo(() => {
    if (!selectedProject) return undefined
    const idx = projects.findIndex(p => p.id === selectedProject.id)
    if (idx === -1) return undefined

    const prev = idx > 0
      ? { title: projects[idx - 1].title, slug: projects[idx - 1].slug, category: projects[idx - 1].category }
      : null
    const next = idx < projects.length - 1
      ? { title: projects[idx + 1].title, slug: projects[idx + 1].slug, category: projects[idx + 1].category }
      : null

    return { prev, next }
  }, [selectedProject, projects])

  // Scroll drawer content to top when switching projects
  useEffect(() => {
    if (selectedSlug && contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }, [selectedSlug])

  const handleOpenChange = useCallback((open: boolean) => {
    if (!open) {
      onClose()
    }
  }, [onClose])

  // If project slug doesn't match any project, don't render
  if (isOpen && !selectedProject) return null

  return (
    <Drawer.Root
      open={isOpen}
      onOpenChange={handleOpenChange}
      onOpenChangeComplete={(open) => { if (!open) setSnapPoint(0.48) }}
      modal
      swipeDirection={isDesktop ? 'right' : 'down'}
      snapPoints={isDesktop ? undefined : [0.48, 0.94]}
      snapPoint={isDesktop ? undefined : snapPoint}
      onSnapPointChange={setSnapPoint}
    >
      <Drawer.Portal>
        <Drawer.Backdrop className="drawer-backdrop" />
        <Drawer.Viewport className="drawer-viewport">
          <Drawer.Popup className="drawer-popup" finalFocus={returnFocusRef}>
            {/* Mobile drag handle */}
            {!isDesktop && (
              <div className="drawer-handle">
                <button type="button" data-base-ui-swipe-ignore
                  aria-label={snapPoint === 0.94 ? 'Perkecil panel proyek' : 'Perluas panel proyek'}
                  aria-expanded={snapPoint === 0.94}
                  onClick={() => setSnapPoint(snapPoint === 0.94 ? 0.48 : 0.94)} />
              </div>
            )}

            <Drawer.Close className="drawer-close-btn" aria-label="Tutup proyek">
              <X size={18} />
            </Drawer.Close>

            <Drawer.Content className="drawer-content" ref={contentRef} data-base-ui-swipe-ignore tabIndex={0} aria-label="Konten proyek">
              {selectedProject && (
                <>
                  <Drawer.Title className="sr-only">
                    {selectedProject.title}
                  </Drawer.Title>
                  <Drawer.Description className="sr-only">
                    Detail proyek arsitektur: {selectedProject.title}
                  </Drawer.Description>

                  <DrawerProjectContent
                    key={selectedProject.slug}
                    project={selectedProject}
                    onNavigateProject={onSelectProject}
                    adjacentProjects={adjacentProjects}
                  />
                </>
              )}
            </Drawer.Content>
          </Drawer.Popup>
        </Drawer.Viewport>
      </Drawer.Portal>
    </Drawer.Root>
  )
}
