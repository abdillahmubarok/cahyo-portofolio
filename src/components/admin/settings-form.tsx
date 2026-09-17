'use client'

import { useActionState } from 'react'
import { updateSiteSettings } from '@/app/actions'
import type { SiteSettings } from '@/lib/types'
import { Save, Check } from 'lucide-react'

type Props = {
  settings: SiteSettings | null
}

export function SettingsForm({ settings }: Props) {
  const [state, action, pending] = useActionState(updateSiteSettings, {})

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {state.error && <div className="p-3 border border-error text-error text-sm">{state.error}</div>}
      {state.success && (
        <div className="p-3 border border-success text-success text-sm flex items-center gap-2">
          <Check size={14} /> Pengaturan berhasil disimpan.
        </div>
      )}

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Identitas</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="s-architect" className="label">Nama Arsitek</label>
            <input id="s-architect" name="architect_name" className="input" defaultValue={settings?.architect_name ?? ''} />
          </div>
          <div>
            <label htmlFor="s-studio" className="label">Nama Studio</label>
            <input id="s-studio" name="studio_name" className="input" defaultValue={settings?.studio_name ?? ''} />
          </div>
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Hero Section</h3>
        <div>
          <label htmlFor="s-hero-title" className="label">Judul Hero</label>
          <input id="s-hero-title" name="hero_title" className="input" defaultValue={settings?.hero_title ?? ''} />
        </div>
        <div>
          <label htmlFor="s-hero-sub" className="label">Subtitle Hero</label>
          <input id="s-hero-sub" name="hero_subtitle" className="input" defaultValue={settings?.hero_subtitle ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Tentang</h3>
        <div>
          <label htmlFor="s-about-short" className="label">Tentang (Singkat)</label>
          <textarea id="s-about-short" name="about_short" className="textarea" rows={3} defaultValue={settings?.about_short ?? ''} />
        </div>
        <div>
          <label htmlFor="s-about-long" className="label">Tentang (Lengkap)</label>
          <textarea id="s-about-long" name="about_long" className="textarea" rows={6} defaultValue={settings?.about_long ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Kontak</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="s-email" className="label">Email</label>
            <input id="s-email" name="email" type="email" className="input" defaultValue={settings?.email ?? ''} />
          </div>
          <div>
            <label htmlFor="s-phone" className="label">Telepon</label>
            <input id="s-phone" name="phone" className="input" defaultValue={settings?.phone ?? ''} />
          </div>
          <div>
            <label htmlFor="s-whatsapp" className="label">WhatsApp</label>
            <input id="s-whatsapp" name="whatsapp" className="input" defaultValue={settings?.whatsapp ?? ''} />
          </div>
          <div>
            <label htmlFor="s-address" className="label">Alamat</label>
            <input id="s-address" name="address" className="input" defaultValue={settings?.address ?? ''} />
          </div>
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Media Sosial</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="s-instagram" className="label">Instagram URL</label>
            <input id="s-instagram" name="instagram_url" className="input" defaultValue={settings?.instagram_url ?? ''} />
          </div>
          <div>
            <label htmlFor="s-linkedin" className="label">LinkedIn URL</label>
            <input id="s-linkedin" name="linkedin_url" className="input" defaultValue={settings?.linkedin_url ?? ''} />
          </div>
          <div>
            <label htmlFor="s-behance" className="label">Behance URL</label>
            <input id="s-behance" name="behance_url" className="input" defaultValue={settings?.behance_url ?? ''} />
          </div>
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Footer</h3>
        <div>
          <label htmlFor="s-footer" className="label">Teks Footer</label>
          <input id="s-footer" name="footer_text" className="input" defaultValue={settings?.footer_text ?? ''} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Menyimpan...' : 'Simpan Pengaturan'}
        <Save size={14} />
      </button>
    </form>
  )
}
