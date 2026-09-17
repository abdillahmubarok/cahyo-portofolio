'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'motion/react'
import { ProjectCard } from '@/components/site/project-card'
import type { ProjectWithCover } from '@/lib/types'

type Props = {
  projects: ProjectWithCover[]
  categories: string[]
}

export function ProjectsFilter({ projects, categories }: Props) {
  const [active, setActive] = useState<string | null>(null)

  const filtered = active
    ? projects.filter(p => p.category === active)
    : projects

  return (
    <>
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-10 md:mb-14">
          <button
            onClick={() => setActive(null)}
            className={`text-[12px] tracking-[0.1em] uppercase px-4 py-2 border transition-colors ${
              active === null
                ? 'border-foreground text-foreground'
                : 'border-border text-muted hover:border-foreground hover:text-foreground'
            }`}
          >
            Semua
          </button>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActive(cat)}
              className={`text-[12px] tracking-[0.1em] uppercase px-4 py-2 border transition-colors ${
                active === cat
                  ? 'border-foreground text-foreground'
                  : 'border-border text-muted hover:border-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div
          key={active ?? 'all'}
          className="masonry-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {filtered.map((project, i) => (
            <ProjectCard key={project.id} project={project} index={i} />
          ))}
        </motion.div>
      </AnimatePresence>

      {filtered.length === 0 && (
        <div className="text-center py-20">
          <p className="text-muted">Belum ada proyek dalam kategori ini.</p>
        </div>
      )}
    </>
  )
}
