'use client'

import Image from 'next/image'
import { PointerParallax } from '@/components/motion/pointer-parallax'
import type { ProjectWithMedia, ProjectWithCover, ProjectMedia } from '@/lib/types'
import { getStorageUrl } from '@/lib/utils'

type ProjectCardProps = {
  project: ProjectWithMedia | ProjectWithCover
  index?: number
  onOpenProject?: (slug: string) => void
}

/**
 * Derives the cover image from either ProjectWithCover or ProjectWithMedia.
 */
function getCover(project: ProjectWithMedia | ProjectWithCover): ProjectMedia | null {
  if ('cover' in project) return project.cover
  if ('project_media' in project && project.project_media?.length > 0) {
    return project.project_media.find(m => m.is_cover) ?? project.project_media[0]
  }
  return null
}

export function ProjectCard({ project, index = 0, onOpenProject }: ProjectCardProps) {
  const cover = getCover(project)
  const imageUrl = cover ? getStorageUrl(cover.storage_path) : null

  const handleClick = () => {
    onOpenProject?.(project.slug)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="masonry-item block group text-left w-full"
      data-cursor-hover
    >
      <PointerParallax maxTranslate={6} maxRotate={0.3} hoverScale={1.015}>
        <div className="relative overflow-hidden bg-surface">
          {imageUrl && cover ? (
            <Image
              src={imageUrl}
              alt={cover.alt_text || project.title}
              width={cover.width || 800}
              height={cover.height || 600}
              className="w-full h-auto block"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <div className="aspect-[4/3] bg-surface flex items-center justify-center">
              <span className="text-label">Belum ada gambar</span>
            </div>
          )}

          {/* Desktop hover overlay */}
          <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/20 transition-all duration-500 hidden md:flex items-end p-6 opacity-0 group-hover:opacity-100">
            <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
              {project.category && (
                <span className="text-[10px] tracking-[0.15em] uppercase text-white/70 block mb-1">
                  {project.category}
                </span>
              )}
              <h3 className="text-white text-lg font-light tracking-tight">
                {project.title}
              </h3>
            </div>
          </div>
        </div>
      </PointerParallax>

      {/* Mobile info (always visible) */}
      <div className="md:hidden mt-3 mb-1">
        <div className="flex items-center gap-3 mb-1">
          {project.category && (
            <span className="text-label">{project.category}</span>
          )}
          {project.year && (
            <span className="text-label">{project.year}</span>
          )}
        </div>
        <h3 className="text-base font-light tracking-tight">{project.title}</h3>
      </div>
    </button>
  )
}
