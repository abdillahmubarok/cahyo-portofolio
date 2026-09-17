import { RevealText, FadeIn } from '@/components/motion/reveal'
import type { SiteSettings } from '@/lib/types'

type AboutSectionProps = {
  settings: SiteSettings | null
}

export function AboutSection({ settings }: AboutSectionProps) {
  return (
    <section id="about" className="section-gap">
      <div className="container-site">
        <div className="max-w-3xl">
          <RevealText>
            <span className="text-label block mb-3">Tentang</span>
            <h2 className="heading-display mb-10">
              {settings?.architect_name || 'Cahyo'} Architecture
            </h2>
          </RevealText>

          <FadeIn delay={0.2}>
            <div className="w-20 h-px bg-accent mb-10" />
          </FadeIn>

          <FadeIn delay={0.3}>
            <p className="text-body-lg mb-8">
              {settings?.about_short ||
                'Studio arsitektur yang berfokus pada desain hunian dan komersial yang fungsional, estetis, dan berkelanjutan.'}
            </p>
          </FadeIn>

          {settings?.about_long ? (
            <FadeIn delay={0.4}>
              <div className="text-body whitespace-pre-line">
                {settings.about_long}
              </div>
            </FadeIn>
          ) : (
            <FadeIn delay={0.4}>
              <div className="text-body space-y-6">
                <p>
                  Kami percaya bahwa arsitektur yang baik lahir dari pemahaman mendalam
                  tentang kebutuhan penghuni, konteks lingkungan, dan keseimbangan antara
                  estetika dan fungsionalitas.
                </p>
                <p>
                  Setiap proyek adalah kesempatan untuk menciptakan ruang yang tidak hanya
                  indah dipandang, tetapi juga nyaman ditinggali dan berkelanjutan bagi
                  lingkungan sekitarnya.
                </p>
              </div>
            </FadeIn>
          )}
        </div>

        {/* Contact Info */}
        <FadeIn delay={0.5}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16 md:mt-24 pt-12 border-t border-border">
            {settings?.email && (
              <div>
                <span className="text-label block mb-2">Email</span>
                <a href={`mailto:${settings.email}`} className="text-sm hover:text-accent transition-colors">
                  {settings.email}
                </a>
              </div>
            )}
            {settings?.phone && (
              <div>
                <span className="text-label block mb-2">Telepon</span>
                <a href={`tel:${settings.phone}`} className="text-sm hover:text-accent transition-colors">
                  {settings.phone}
                </a>
              </div>
            )}
            {settings?.address && (
              <div>
                <span className="text-label block mb-2">Alamat</span>
                <p className="text-sm text-muted">{settings.address}</p>
              </div>
            )}
          </div>
        </FadeIn>
      </div>
    </section>
  )
}
