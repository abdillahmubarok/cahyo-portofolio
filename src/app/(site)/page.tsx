import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { getSiteSettings, getFeaturedProjects, getServices, getPublishedProjects } from '@/lib/queries'
import { ProjectCard } from '@/components/site/project-card'
import { HeroSection } from '@/components/site/hero-section'
import { RevealText, FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/reveal'
import { ServiceIcon } from '@/components/site/service-icon'

export const revalidate = 60

export default async function HomePage() {
  const [settings, featuredProjects, allProjects, services] = await Promise.all([
    getSiteSettings(),
    getFeaturedProjects(),
    getPublishedProjects(),
    getServices(),
  ])

  const displayProjects = featuredProjects.length > 0 ? featuredProjects : allProjects.slice(0, 6)

  return (
    <>
      {/* Hero */}
      <HeroSection settings={settings} />

      {/* Selected Works */}
      {displayProjects.length > 0 && (
        <section className="section-gap">
          <div className="container-site">
            <div className="flex items-end justify-between mb-12 md:mb-16">
              <RevealText>
                <span className="text-label block mb-3">Proyek Terpilih</span>
                <h2 className="heading-xl">Karya Kami</h2>
              </RevealText>
              <FadeIn>
                <Link
                  href="/projects"
                  className="hidden md:inline-flex items-center gap-2 text-sm text-muted hover:text-foreground transition-colors group"
                >
                  Lihat Semua
                  <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </Link>
              </FadeIn>
            </div>

            <div className="masonry-grid">
              {displayProjects.map((project, i) => (
                <ProjectCard key={project.id} project={project} index={i} />
              ))}
            </div>

            <div className="mt-10 text-center md:hidden">
              <Link href="/projects" className="btn btn-outline">
                Lihat Semua Proyek
                <ArrowRight size={14} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Philosophy */}
      <section className="section-gap bg-surface">
        <div className="container-site max-w-3xl mx-auto text-center">
          <RevealText>
            <span className="text-label block mb-6">Filosofi</span>
          </RevealText>
          <RevealText delay={0.1}>
            <p className="heading-lg text-foreground/80 font-light leading-relaxed">
              Kami percaya arsitektur yang baik lahir dari pemahaman mendalam
              tentang kebutuhan manusia, konteks lingkungan, dan
              keseimbangan antara estetika dan fungsionalitas.
            </p>
          </RevealText>
        </div>
      </section>

      {/* Services */}
      {services.length > 0 && (
        <section className="section-gap">
          <div className="container-site">
            <RevealText>
              <span className="text-label block mb-3">Layanan</span>
              <h2 className="heading-xl mb-12 md:mb-16">Apa yang Kami Tawarkan</h2>
            </RevealText>

            <StaggerContainer className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 md:gap-10">
              {services.map(service => (
                <StaggerItem key={service.id}>
                  <div className="group">
                    <div className="mb-4 text-accent">
                      <ServiceIcon name={service.icon_name} />
                    </div>
                    <h3 className="text-lg font-light mb-2">{service.title}</h3>
                    {service.description && (
                      <p className="text-sm text-muted leading-relaxed">{service.description}</p>
                    )}
                  </div>
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </section>
      )}

      {/* About Teaser */}
      <section className="section-gap bg-foreground text-background">
        <div className="container-site">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-20 items-center">
            <div>
              <FadeIn>
                <span className="text-[11px] tracking-[0.12em] uppercase text-background/50 block mb-3">Tentang Studio</span>
                <h2 className="heading-xl text-background mb-6">
                  {settings?.architect_name || 'Cahyo'} Architecture
                </h2>
                <p className="text-body text-background/60">
                  {settings?.about_short ||
                    'Studio arsitektur yang berfokus pada desain hunian dan komersial yang fungsional, estetis, dan berkelanjutan.'}
                </p>
              </FadeIn>
            </div>
            <div className="flex justify-end">
              <FadeIn delay={0.2}>
                <Link href="/about" className="btn border-background/30 text-background hover:bg-background hover:text-foreground transition-all">
                  Selengkapnya
                  <ArrowRight size={14} />
                </Link>
              </FadeIn>
            </div>
          </div>
        </div>
      </section>

      {/* Contact CTA */}
      <section className="section-gap">
        <div className="container-site text-center">
          <RevealText>
            <h2 className="heading-display mb-6">
              Punya Proyek?
            </h2>
          </RevealText>
          <FadeIn delay={0.2}>
            <p className="text-body-lg max-w-lg mx-auto mb-10">
              Kami siap membantu mewujudkan visi arsitektur Anda.
              Mari diskusikan proyek Anda bersama kami.
            </p>
          </FadeIn>
          <FadeIn delay={0.3}>
            <Link href="/contact" className="btn btn-primary">
              Hubungi Kami
              <ArrowRight size={14} />
            </Link>
          </FadeIn>
        </div>
      </section>
    </>
  )
}
