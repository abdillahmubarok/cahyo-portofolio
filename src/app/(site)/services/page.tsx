import type { Metadata } from 'next'
import { getServices } from '@/lib/queries'
import { ServiceIcon } from '@/components/site/service-icon'
import { RevealText, FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/reveal'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Layanan',
  description: 'Layanan arsitektur dan desain interior oleh Cahyo Architecture.',
}

export default async function ServicesPage() {
  const services = await getServices()

  return (
    <section className="section-gap">
      <div className="container-site">
        <div className="max-w-2xl mb-12 md:mb-20">
          <RevealText>
            <span className="text-label block mb-3">Layanan</span>
            <h1 className="heading-xl mb-6">Apa yang Kami Tawarkan</h1>
          </RevealText>
          <FadeIn delay={0.2}>
            <p className="text-body-lg">
              Kami menyediakan layanan arsitektur dan desain interior secara komprehensif,
              dari konsep awal hingga realisasi proyek.
            </p>
          </FadeIn>
        </div>

        <StaggerContainer className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-0 border-t border-l border-border">
          {services.map(service => (
            <StaggerItem key={service.id}>
              <div className="p-8 md:p-10 border-b border-r border-border">
                <div className="text-accent mb-5">
                  <ServiceIcon name={service.icon_name} size={32} />
                </div>
                <h2 className="text-lg font-light mb-3">{service.title}</h2>
                {service.description && (
                  <p className="text-sm text-muted leading-relaxed">{service.description}</p>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>

        {services.length === 0 && (
          <div className="text-center py-20">
            <p className="text-muted">Layanan akan segera ditampilkan.</p>
          </div>
        )}
      </div>
    </section>
  )
}
