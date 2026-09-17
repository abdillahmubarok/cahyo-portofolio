'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, FolderOpen, Settings, MessageSquare, ExternalLink } from 'lucide-react'

const links = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/projects', label: 'Proyek', icon: FolderOpen },
  { href: '/admin/messages', label: 'Pesan', icon: MessageSquare },
  { href: '/admin/settings', label: 'Pengaturan', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:flex w-56 lg:w-64 flex-col bg-admin-sidebar text-white shrink-0">
      <div className="p-5 border-b border-white/10">
        <Link href="/admin" className="text-sm font-medium tracking-[0.1em] uppercase">
          Admin Panel
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1" aria-label="Admin navigation">
        {links.map(link => {
          const isActive = pathname === link.href || (link.href !== '/admin' && pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded transition-colors ${
                isActive
                  ? 'bg-white/10 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/5'
              }`}
            >
              <link.icon size={16} />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-white/10">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 px-3 py-2.5 text-xs text-white/40 hover:text-white/70 transition-colors"
        >
          <ExternalLink size={14} />
          Lihat Website
        </Link>
      </div>
    </aside>
  )
}
