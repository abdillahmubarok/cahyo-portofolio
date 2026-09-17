import { ServiceIcon } from '@/components/site/service-icon'
import { RevealText, FadeIn, StaggerContainer, StaggerItem } from '@/components/motion/reveal'
import type { Service } from '@/lib/types'

type ServicesSectionProps = {
  services: Service[]
}

export function ServicesSection({ services }: ServicesSectionProps) {
  if (services.length === 0) return null

  return (
    <section id="services" className="section-gap">
      <div className="container-site">
        <div className="max-w-2xl mb-12 md:mb-20">
          <RevealText>
            <span className="text-label block mb-3">Layanan</span>
            <h2 className="heading-xl mb-6">Apa yang Kami Tawarkan</h2>
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
                <h3 className="text-lg font-light mb-3">{service.title}</h3>
                {service.description && (
                  <p className="text-sm text-muted leading-relaxed">{service.description}</p>
                )}
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  )
}
