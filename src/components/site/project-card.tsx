'use client'

import Link from 'next/link'
import Image from 'next/image'
import { PointerParallax } from '@/components/motion/pointer-parallax'
import type { ProjectWithCover } from '@/lib/types'
import { getStorageUrl } from '@/lib/utils'

type ProjectCardProps = {
  project: ProjectWithCover
  index?: number
}

export function ProjectCard({ project, index = 0 }: ProjectCardProps) {
  const cover = project.cover
  const imageUrl = cover ? getStorageUrl(cover.storage_path) : null

  return (
    <Link
      href={`/projects/${project.slug}`}
      className="masonry-item block group"
      data-cursor-hover
    >
      <PointerParallax maxTranslate={6} maxRotate={0.8} scale={1.02}>
        <div className="relative overflow-hidden bg-surface">
          {imageUrl && cover ? (
            <Image
              src={imageUrl}
              alt={cover.alt_text || project.title}
              width={cover.width || 800}
              height={cover.height || 600}
              className="w-full h-auto block transition-transform duration-700 group-hover:scale-[1.03]"
              sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
              loading={index < 3 ? 'eager' : 'lazy'}
              priority={index < 2}
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
    </Link>
  )
}
