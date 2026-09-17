import type { Metadata } from 'next'
import { getSiteSettings } from '@/lib/queries'
import { ContactForm } from '@/components/site/contact-form'
import { RevealText, FadeIn } from '@/components/motion/reveal'
import { Mail, Phone, MapPin } from 'lucide-react'

export const revalidate = 60

export const metadata: Metadata = {
  title: 'Kontak',
  description: 'Hubungi Cahyo Architecture untuk konsultasi arsitektur dan desain interior.',
}

export default async function ContactPage() {
  const settings = await getSiteSettings()

  return (
    <section className="section-gap">
      <div className="container-site">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
          {/* Left: Info */}
          <div>
            <RevealText>
              <span className="text-label block mb-3">Kontak</span>
              <h1 className="heading-xl mb-6">Mari Berdiskusi</h1>
            </RevealText>
            <FadeIn delay={0.2}>
              <p className="text-body mb-10">
                Punya proyek arsitektur atau renovasi yang ingin Anda wujudkan?
                Kami dengan senang hati mendengar ide Anda.
              </p>
            </FadeIn>

            <FadeIn delay={0.3}>
              <div className="space-y-5">
                {settings?.email && (
                  <a
                    href={`mailto:${settings.email}`}
                    className="flex items-center gap-3 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <Mail size={16} />
                    {settings.email}
                  </a>
                )}
                {settings?.phone && (
                  <a
                    href={`tel:${settings.phone}`}
                    className="flex items-center gap-3 text-sm text-muted hover:text-foreground transition-colors"
                  >
                    <Phone size={16} />
                    {settings.phone}
                  </a>
                )}
                {settings?.address && (
                  <div className="flex items-start gap-3 text-sm text-muted">
                    <MapPin size={16} className="mt-0.5 shrink-0" />
                    {settings.address}
                  </div>
                )}
              </div>
            </FadeIn>
          </div>

          {/* Right: Form */}
          <FadeIn delay={0.3}>
            <ContactForm />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
