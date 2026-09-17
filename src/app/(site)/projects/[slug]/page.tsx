import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, ArrowLeft } from 'lucide-react'
import { getProjectBySlug, getAdjacentProjects, getPublishedProjectSlugs } from '@/lib/queries'
import { getStorageUrl } from '@/lib/utils'
import { RevealText, FadeIn, ImageReveal } from '@/components/motion/reveal'
import { ProjectGallery } from '@/components/site/project-gallery'

export const dynamicParams = true
export const revalidate = 60

type Props = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) return { title: 'Proyek Tidak Ditemukan' }

  const cover = project.project_media?.find(m => m.is_cover) ?? project.project_media?.[0]
  const imageUrl = cover ? getStorageUrl(cover.storage_path) : undefined

  return {
    title: project.title,
    description: project.summary || `Proyek arsitektur: ${project.title}`,
    openGraph: {
      title: project.title,
      description: project.summary || undefined,
      images: imageUrl ? [{ url: imageUrl }] : undefined,
    },
  }
}

export async function generateStaticParams() {
  try {
    const slugs = await getPublishedProjectSlugs()
    return slugs.map(slug => ({ slug }))
  } catch {
    return []
  }
}

export default async function ProjectDetailPage({ params }: Props) {
  const { slug } = await params
  const project = await getProjectBySlug(slug)
  if (!project) notFound()

  const { prev: prevProject, next: nextProject } = await getAdjacentProjects(slug, project.sort_order)

  // Primary cover image (with fallback to first media if is_cover not set)
  const cover = project.project_media?.find(m => m.is_cover) ?? project.project_media?.[0] ?? null

  // Gallery displays all non-cover images without duplication
  const galleryImages = cover
    ? (project.project_media?.filter(m => m.id !== cover.id) ?? [])
    : (project.project_media ?? [])

  // Facts grid: strictly omits null or empty values
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
    <article className="section-gap">
      <div className="container-site">
        {/* Back Link & Header */}
        <div className="mb-10 md:mb-16">
          <FadeIn>
            <Link
              href="/projects"
              className="inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors mb-8 group"
            >
              <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
              Kembali ke Proyek
            </Link>
          </FadeIn>

          <RevealText>
            {project.category && (
              <span className="text-label block mb-3">{project.category}</span>
            )}
            <h1 className="heading-display">{project.title}</h1>
            {subtitleMeta && (
              <span className="text-xs text-muted tracking-widest uppercase block mt-3 font-mono">
                {subtitleMeta}
              </span>
            )}
          </RevealText>

          {project.summary && (
            <FadeIn delay={0.2}>
              <p className="text-body-lg mt-6 max-w-2xl">{project.summary}</p>
            </FadeIn>
          )}
        </div>

        {/* Cover Hero Image */}
        {cover ? (
          <ImageReveal className="mb-12 md:mb-20">
            <div className="relative overflow-hidden bg-surface">
              <Image
                src={getStorageUrl(cover.storage_path)}
                alt={cover.alt_text || `${project.title} — cover proyek`}
                width={cover.width || 1600}
                height={cover.height || 900}
                className="w-full h-auto block"
                sizes="100vw"
                priority
              />
            </div>
            {cover.caption && (
              <p className="text-xs text-muted mt-2 tracking-wide font-mono">
                {cover.caption}
              </p>
            )}
          </ImageReveal>
        ) : (
          <div className="mb-12 md:mb-20 p-8 border border-dashed border-border text-center bg-surface/30">
            <p className="text-xs text-muted font-mono uppercase tracking-widest">
              Dokumentasi visual proyek sedang dalam proses kurasi
            </p>
          </div>
        )}

        {/* Architectural Facts Grid */}
        {facts.length > 0 && (
          <FadeIn className="mb-12 md:mb-20">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-8 py-8 border-t border-b border-border">
              {facts.map(fact => (
                <div key={fact.label}>
                  <span className="text-label block mb-2">{fact.label}</span>
                  <p className="text-sm md:text-base font-light text-foreground/90">{fact.value}</p>
                </div>
              ))}
            </div>
          </FadeIn>
        )}

        {/* Challenge & Response (Problem & Solution) */}
        {(project.problem || project.solution) && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 md:gap-16 mb-12 md:mb-20">
            {project.problem && (
              <FadeIn className={project.solution ? 'md:col-span-6' : 'md:col-span-12 max-w-3xl'}>
                <span className="text-label block mb-3">Tantangan Desain</span>
                <p className="text-body whitespace-pre-line leading-relaxed">{project.problem}</p>
              </FadeIn>
            )}
            {project.solution && (
              <FadeIn delay={0.1} className={project.problem ? 'md:col-span-6' : 'md:col-span-12 max-w-3xl'}>
                <span className="text-label block mb-3">Pendekatan Desain</span>
                <p className="text-body whitespace-pre-line leading-relaxed">{project.solution}</p>
              </FadeIn>
            )}
          </div>
        )}

        {/* Project Overview (Description) */}
        {project.description && (
          <FadeIn className="mb-12 md:mb-20 max-w-3xl">
            <span className="text-label block mb-3">Deskripsi Proyek</span>
            <p className="text-body-lg whitespace-pre-line leading-relaxed text-foreground/90">
              {project.description}
            </p>
          </FadeIn>
        )}

        {/* Complete Project Media Gallery */}
        {galleryImages.length > 0 && (
          <div className="mb-16 md:mb-24">
            <FadeIn className="mb-8">
              <span className="text-label block">Dokumentasi Visual ({galleryImages.length} Foto)</span>
            </FadeIn>
            <ProjectGallery images={galleryImages} projectTitle={project.title} />
          </div>
        )}

        {/* Adjacent Navigation (Prev / Next Project) */}
        {(prevProject || nextProject) && (
          <div className="border-t border-border pt-12 md:pt-16 mt-16">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center justify-between">
              {/* Previous */}
              <div>
                {prevProject ? (
                  <FadeIn>
                    <span className="text-label block mb-2">Proyek Sebelumnya</span>
                    <Link
                      href={`/projects/${prevProject.slug}`}
                      className="group inline-flex items-center gap-3"
                    >
                      <ArrowLeft size={20} className="text-muted group-hover:text-accent group-hover:-translate-x-1 transition-all shrink-0" />
                      {prevProject.coverUrl && (
                        <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-surface hidden sm:block">
                          <Image
                            src={getStorageUrl(prevProject.coverUrl)}
                            alt={prevProject.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div>
                        {prevProject.category && (
                          <span className="text-[10px] text-muted tracking-widest uppercase block">
                            {prevProject.category}
                          </span>
                        )}
                        <h4 className="heading-lg text-lg md:text-xl group-hover:text-accent transition-colors">
                          {prevProject.title}
                        </h4>
                      </div>
                    </Link>
                  </FadeIn>
                ) : <div />}
              </div>

              {/* Next */}
              <div className="md:text-right">
                {nextProject && (
                  <FadeIn delay={0.1}>
                    <span className="text-label block mb-2">Proyek Selanjutnya</span>
                    <Link
                      href={`/projects/${nextProject.slug}`}
                      className="group inline-flex items-center gap-3 md:flex-row-reverse"
                    >
                      <ArrowRight size={20} className="text-muted group-hover:text-accent group-hover:translate-x-1 transition-all shrink-0" />
                      {nextProject.coverUrl && (
                        <div className="relative w-12 h-12 shrink-0 overflow-hidden bg-surface hidden sm:block">
                          <Image
                            src={getStorageUrl(nextProject.coverUrl)}
                            alt={nextProject.title}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="48px"
                          />
                        </div>
                      )}
                      <div>
                        {nextProject.category && (
                          <span className="text-[10px] text-muted tracking-widest uppercase block">
                            {nextProject.category}
                          </span>
                        )}
                        <h4 className="heading-lg text-lg md:text-xl group-hover:text-accent transition-colors">
                          {nextProject.title}
                        </h4>
                      </div>
                    </Link>
                  </FadeIn>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </article>
  )
}
