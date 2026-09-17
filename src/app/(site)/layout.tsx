import { SiteHeader } from '@/components/site/site-header'
import { SiteFooter } from '@/components/site/site-footer'
import { CustomCursor } from '@/components/motion/custom-cursor'
import { MotionProvider } from '@/components/motion/motion-provider'
import { getSiteSettings } from '@/lib/queries'
import type { ReactNode } from 'react'

export default async function SiteLayout({ children }: { children: ReactNode }) {
  const settings = await getSiteSettings()

  return (
    <MotionProvider>
      <a href="#main-content" className="skip-to-content">
        Langsung ke konten utama
      </a>
      <CustomCursor />
      <SiteHeader studioName={settings?.studio_name} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter settings={settings} />
    </MotionProvider>
  )
}
