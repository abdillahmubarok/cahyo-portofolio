import { getSiteSettings } from '@/lib/queries'
import { SettingsForm } from '@/components/admin/settings-form'

export default async function AdminSettingsPage() {
  const settings = await getSiteSettings()

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Pengaturan Situs</h1>
      <SettingsForm settings={settings} />
    </div>
  )
}
