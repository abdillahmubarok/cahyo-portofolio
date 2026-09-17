import { getAuthenticatedAdmin } from '@/lib/auth'
import { AdminSidebar } from '@/components/admin/admin-sidebar'
import { AdminHeader } from '@/components/admin/admin-header'
import type { ReactNode } from 'react'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const { profile } = await getAuthenticatedAdmin()

  return (
    <div className="min-h-screen flex bg-admin-bg">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminHeader displayName={profile.display_name} />
        <main className="flex-1 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
