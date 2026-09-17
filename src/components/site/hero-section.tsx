'use client'

import { RevealText, FadeIn } from '@/components/motion/reveal'
import type { SiteSettings } from '@/lib/types'

type HeroProps = {
  settings: SiteSettings | null
}

export function HeroSection({ settings }: HeroProps) {
  return (
    <section className="section-gap relative min-h-[60vh] md:min-h-[70vh] flex items-center">
      <div className="container-site w-full">
        <div className="max-w-4xl">
          <FadeIn>
            <span className="text-label block mb-6">
              {settings?.hero_subtitle || 'Arsitektur · Interior · Visualisasi'}
            </span>
          </FadeIn>
          <RevealText>
            <h1 className="heading-display mb-8">
              {settings?.hero_title || 'Ruang yang dirancang untuk manusia, tempat, dan tujuan.'}
            </h1>
          </RevealText>
          <FadeIn delay={0.3}>
            <div className="w-20 h-px bg-accent" />
          </FadeIn>
        </div>
      </div>
    </section>
  )
}
