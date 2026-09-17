import { getProjectStats } from '@/lib/queries'
import { FolderOpen, Eye, EyeOff, ImageIcon, MessageSquare } from 'lucide-react'

export default async function AdminDashboardPage() {
  const stats = await getProjectStats()

  const cards = [
    { label: 'Total Proyek', value: stats.total, icon: FolderOpen },
    { label: 'Terpublikasi', value: stats.published, icon: Eye },
    { label: 'Draft', value: stats.drafts, icon: EyeOff },
    { label: 'Total Gambar', value: stats.totalImages, icon: ImageIcon },
    { label: 'Pesan Belum Dibaca', value: stats.unreadMessages, icon: MessageSquare },
  ]

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {cards.map(card => (
          <div key={card.label} className="admin-card">
            <div className="flex items-center gap-3 mb-3">
              <card.icon size={18} className="text-muted" />
              <span className="text-label">{card.label}</span>
            </div>
            <p className="text-2xl font-light">{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
