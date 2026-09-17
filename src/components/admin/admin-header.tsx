'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from '@/app/actions'
import { LogOut, Menu, X, LayoutDashboard, FolderOpen, Settings, MessageSquare } from 'lucide-react'
import { useState } from 'react'

type AdminHeaderProps = {
  displayName: string | null
}

const mobileLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'Proyek', icon: FolderOpen },
  { href: '/admin/messages', label: 'Pesan', icon: MessageSquare },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

export function AdminHeader({ displayName }: AdminHeaderProps) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <>
      <header className="sticky top-0 z-30 bg-white border-b border-border px-4 md:px-6 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Mobile menu toggle */}
          <button
            className="md:hidden p-1"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Tutup menu' : 'Buka menu'}
          >
            {mobileOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
          <span className="text-sm text-muted">
            {displayName ? `Halo, ${displayName}` : 'Admin Dashboard'}
          </span>
        </div>

        <form action={signOut}>
          <button type="submit" className="btn btn-sm btn-outline">
            <LogOut size={14} />
            Keluar
          </button>
        </form>
      </header>

      {/* Mobile Navigation */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-20 bg-white pt-14">
          <nav className="p-4 space-y-1">
            {mobileLinks.map(link => {
              const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`flex items-center gap-3 px-3 py-3 text-sm rounded transition-colors ${
                    isActive ? 'bg-surface text-foreground' : 'text-muted hover:text-foreground hover:bg-surface'
                  }`}
                >
                  <link.icon size={16} />
                  {link.label}
                </Link>
              )
            })}
          </nav>
        </div>
      )}
    </>
  )
}
