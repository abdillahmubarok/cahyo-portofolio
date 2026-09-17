import Link from 'next/link'
import { AtSign, ExternalLink, ArrowUpRight } from 'lucide-react'
import type { SiteSettings } from '@/lib/types'

type FooterProps = {
  settings: SiteSettings | null
}

export function SiteFooter({ settings }: FooterProps) {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="container-site py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-8">
          {/* Brand */}
          <div>
            <p className="text-sm font-medium tracking-[0.15em] uppercase mb-3">
              {settings?.studio_name || 'Cahyo Architecture'}
            </p>
            {settings?.about_short && (
              <p className="text-sm text-muted leading-relaxed max-w-xs">
                {settings.about_short}
              </p>
            )}
          </div>

          {/* Links */}
          <div>
            <p className="text-label mb-4">Navigasi</p>
            <nav className="flex flex-col gap-2" aria-label="Footer navigation">
              <Link href="/projects" className="text-sm text-muted hover:text-foreground transition-colors">
                Proyek
              </Link>
              <Link href="/about" className="text-sm text-muted hover:text-foreground transition-colors">
                Tentang
              </Link>
              <Link href="/services" className="text-sm text-muted hover:text-foreground transition-colors">
                Layanan
              </Link>
              <Link href="/contact" className="text-sm text-muted hover:text-foreground transition-colors">
                Kontak
              </Link>
            </nav>
          </div>

          {/* Contact */}
          <div>
            <p className="text-label mb-4">Kontak</p>
            <div className="flex flex-col gap-2">
              {settings?.email && (
                <a
                  href={`mailto:${settings.email}`}
                  className="text-sm text-muted hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  {settings.email}
                  <ArrowUpRight size={12} />
                </a>
              )}
              {settings?.phone && (
                <a
                  href={`tel:${settings.phone}`}
                  className="text-sm text-muted hover:text-foreground transition-colors"
                >
                  {settings.phone}
                </a>
              )}
              {settings?.address && (
                <p className="text-sm text-muted">{settings.address}</p>
              )}
            </div>

            {/* Social */}
            <div className="flex gap-3 mt-4">
              {settings?.instagram_url && (
                <a
                  href={settings.instagram_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="p-2 text-muted hover:text-foreground transition-colors"
                >
                  <AtSign size={18} />
                </a>
              )}
              {settings?.linkedin_url && (
                <a
                  href={settings.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                  className="p-2 text-muted hover:text-foreground transition-colors"
                >
                  <ExternalLink size={18} />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="border-t border-border mt-10 pt-6">
          <p className="text-xs text-muted">
            {settings?.footer_text || `© ${new Date().getFullYear()} Cahyo Architecture. All rights reserved.`}
          </p>
        </div>
      </div>
    </footer>
  )
}
