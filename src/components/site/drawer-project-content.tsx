'use client'

import Image from 'next/image'
import { motion } from 'motion/react'
import { getStorageUrl } from '@/lib/utils'
import { DrawerProjectGallery } from './drawer-project-gallery'
import type { ProjectWithMedia } from '@/lib/types'

type DrawerProjectContentProps = {
  project: ProjectWithMedia
  onNavigateProject?: (slug: string) => void
  adjacentProjects?: {
    prev: { title: string; slug: string; category?: string | null } | null
    next: { title: string; slug: string; category?: string | null } | null
  }
}

/**
 * Project detail content rendered inside the Drawer.
 * Reuses the same editorial layout from the old project detail page.
 * Motion is used here for subtle content reveals inside the drawer.
 */
export function DrawerProjectContent({
  project,
  onNavigateProject,
  adjacentProjects,
}: DrawerProjectContentProps) {
  // Cover image (with fallback to first media)
  const cover = project.project_media?.find(m => m.is_cover) ?? project.project_media?.[0] ?? null
  const galleryImages = cover
    ? (project.project_media?.filter(m => m.id !== cover.id) ?? [])
    : (project.project_media ?? [])

  // Facts grid: omit null or empty values
  const facts = [
    { label: 'Kategori', value: project.category },
    { label: 'Ukuran', value: project.size_text },
    { label: 'Style / Model', value: project.style_text },
    { label: 'Durasi', value: project.duration_text },
    { label: 'Tahun', value: project.year ? String(project.year) : null },
    { label: 'Lokasi', value: project.location },
    { label: 'Klien', value: project.client_name },
  ].filter((f): f is { label: string; value: string } => Boolean(f.value && f.value.trim() !== ''))

  const subtitleMeta = [project.location, project.year ? String(project.year) : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <div className="px-5 py-6 md:px-10 md:py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="mb-8 md:mb-12 pr-10"
      >
        {project.category && (
          <span className="text-label block mb-2">{project.category}</span>
        )}
        <h2 className="heading-xl">{project.title}</h2>
        {subtitleMeta && (
          <span className="text-xs text-muted tracking-widest uppercase block mt-2 font-mono">
            {subtitleMeta}
          </span>
        )}
        {project.summary && (
          <p className="text-body mt-4 max-w-2xl">{project.summary}</p>
        )}
      </motion.div>

      {/* Cover Image */}
      {cover ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mb-8 md:mb-12"
        >
          <div data-media-id={cover.id} className="relative overflow-hidden bg-surface">
            <Image
              src={getStorageUrl(cover.storage_path)}
              alt={cover.alt_text || `${project.title} — cover`}
              width={cover.width || 1600}
              height={cover.height || 900}
              className="w-full h-auto block"
              sizes="(max-width: 768px) 100vw, 75vw"
              loading="eager"
            />
          </div>
          {cover.caption && (
            <p className="text-xs text-muted mt-2 tracking-wide font-mono">
              {cover.caption}
            </p>
          )}
        </motion.div>
      ) : (
        <div className="mb-8 md:mb-12 p-6 border border-dashed border-border text-center bg-surface/30">
          <p className="text-xs text-muted font-mono uppercase tracking-widest">
            Dokumentasi visual proyek sedang dalam proses kurasi
          </p>
        </div>
      )}

      {/* Facts Grid */}
      {facts.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
          className="mb-8 md:mb-12"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 py-6 border-t border-b border-border">
            {facts.map(fact => (
              <div key={fact.label}>
                <span className="text-label block mb-1">{fact.label}</span>
                <p className="text-sm font-light text-foreground/90">{fact.value}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Challenge & Response */}
      {(project.problem || project.solution) && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 md:mb-12"
        >
          {project.problem && (
            <div>
              <span className="text-label block mb-2">Tantangan Desain</span>
              <p className="text-body whitespace-pre-line leading-relaxed">{project.problem}</p>
            </div>
          )}
          {project.solution && (
            <div>
              <span className="text-label block mb-2">Pendekatan Desain</span>
              <p className="text-body whitespace-pre-line leading-relaxed">{project.solution}</p>
            </div>
          )}
        </motion.div>
      )}

      {/* Description */}
      {project.description && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          className="mb-8 md:mb-12 max-w-3xl"
        >
          <span className="text-label block mb-2">Deskripsi Proyek</span>
          <p className="text-body-lg whitespace-pre-line leading-relaxed text-foreground/90">
            {project.description}
          </p>
        </motion.div>
      )}

      {/* Gallery */}
      {galleryImages.length > 0 && (
        <div className="mb-10 md:mb-14">
          <span className="text-label block mb-6">
            Dokumentasi Visual ({galleryImages.length} Foto)
          </span>
          <DrawerProjectGallery images={galleryImages} title={project.title} />
        </div>
      )}

      {/* Adjacent Navigation — swap project in drawer, don't navigate */}
      {adjacentProjects && (adjacentProjects.prev || adjacentProjects.next) && (
        <div data-testid="adjacent-projects" className="border-t border-border pt-8 mt-8">
          <div className="flex items-center justify-between gap-4">
            {adjacentProjects.prev ? (
              <button
                type="button"
                onClick={() => onNavigateProject?.(adjacentProjects.prev!.slug)}
                className="text-left group"
              >
                <span className="text-label block mb-1">Sebelumnya</span>
                <span className="text-sm font-light group-hover:text-accent transition-colors">
                  {adjacentProjects.prev.title}
                </span>
              </button>
            ) : <div />}

            {adjacentProjects.next && (
              <button
                type="button"
                onClick={() => onNavigateProject?.(adjacentProjects.next!.slug)}
                className="text-right group"
              >
                <span className="text-label block mb-1">Selanjutnya</span>
                <span className="text-sm font-light group-hover:text-accent transition-colors">
                  {adjacentProjects.next.title}
                </span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
