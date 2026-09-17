import type { Metadata } from 'next'
import { getPublishedProjects } from '@/lib/queries'
import { RevealText, FadeIn } from '@/components/motion/reveal'
import { ProjectsFilter } from '@/components/site/projects-filter'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Proyek',
  description: 'Portofolio proyek arsitektur dan desain interior oleh Cahyo Architecture.',
}

export default async function ProjectsPage() {
  const projects = await getPublishedProjects()

  // Get unique categories
  const categories = Array.from(
    new Set(projects.map(p => p.category).filter(Boolean))
  ) as string[]

  return (
    <section className="section-gap">
      <div className="container-site">
        <div className="mb-12 md:mb-16 max-w-2xl">
          <RevealText>
            <span className="text-label block mb-3">Portofolio</span>
            <h1 className="heading-xl mb-4">Proyek Kami</h1>
          </RevealText>
          <FadeIn delay={0.2}>
            <p className="text-body">
              Koleksi proyek arsitektur dan desain interior yang telah kami kerjakan.
            </p>
          </FadeIn>
        </div>

        <ProjectsFilter projects={projects} categories={categories} />
      </div>
    </section>
  )
}
