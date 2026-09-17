import { getSiteSettings, getServices, getPublishedProjectsWithMedia } from '@/lib/queries'
import { HeroSection } from '@/components/site/hero-section'
import { PortfolioSection } from '@/components/site/portfolio-section'
import { AboutSection } from '@/components/site/about-section'
import { ServicesSection } from '@/components/site/services-section'
import { ContactSection } from '@/components/site/contact-section'

export const revalidate = 60
export const metadata = { alternates: { canonical: '/' } }

export default async function HomePage() {
  const [settings, projects, services] = await Promise.all([
    getSiteSettings(),
    getPublishedProjectsWithMedia(),
    getServices(),
  ])

  return (
    <>
      {/* Hero */}
      <HeroSection settings={settings} />

      {/* Portfolio — Client Island with filter, grid, drawer, URL state */}
      <PortfolioSection projects={projects} />

      {/* About — Server Component */}
      <AboutSection settings={settings} />

      {/* Services — Server Component */}
      <ServicesSection services={services} />

      {/* Contact — Server wrapper + Client form */}
      <ContactSection settings={settings} />
    </>
  )
}
