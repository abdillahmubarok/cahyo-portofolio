'use client'

import { useActionState } from 'react'
import { createProject, type ProjectFormState } from '@/app/actions'
import { slugify } from '@/lib/utils'
import { Save } from 'lucide-react'
import { useState } from 'react'

export function ProjectFormCreate() {
  const [state, action, pending] = useActionState<ProjectFormState, FormData>(createProject, {})
  const [title, setTitle] = useState('')
  const [slug, setSlug] = useState('')

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setTitle(val)
    if (!slug || slug === slugify(title)) {
      setSlug(slugify(val))
    }
  }

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {state.error && (
        <div className="p-3 border border-error text-error text-sm">{state.error}</div>
      )}

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium mb-1">Informasi Dasar</h3>

        <div>
          <label htmlFor="project-title" className="label">Judul Proyek *</label>
          <input
            id="project-title"
            name="title"
            type="text"
            required
            className="input"
            value={title}
            onChange={handleTitleChange}
            placeholder="Nama proyek"
          />
          {state.fieldErrors?.title && <p className="text-xs text-error mt-1">{state.fieldErrors.title[0]}</p>}
        </div>

        <div>
          <label htmlFor="project-slug" className="label">Slug *</label>
          <input
            id="project-slug"
            name="slug"
            type="text"
            required
            className="input"
            value={slug}
            onChange={e => setSlug(e.target.value)}
            placeholder="url-slug"
          />
          {state.fieldErrors?.slug && <p className="text-xs text-error mt-1">{state.fieldErrors.slug[0]}</p>}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project-category" className="label">Kategori</label>
            <input id="project-category" name="category" type="text" className="input" placeholder="Residential, Interior, dll" />
          </div>
          <div>
            <label htmlFor="project-year" className="label">Tahun</label>
            <input id="project-year" name="year" type="number" className="input" placeholder="2026" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="project-location" className="label">Lokasi</label>
            <input id="project-location" name="location" type="text" className="input" />
          </div>
          <div>
            <label htmlFor="project-client" className="label">Klien</label>
            <input id="project-client" name="client_name" type="text" className="input" />
          </div>
        </div>

        <div>
          <label htmlFor="project-summary" className="label">Ringkasan</label>
          <textarea id="project-summary" name="summary" className="textarea" rows={3} placeholder="Ringkasan singkat proyek" />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium mb-1">Detail Proyek</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="project-duration" className="label">Durasi</label>
            <input id="project-duration" name="duration_text" type="text" className="input" placeholder="3 bulan" />
          </div>
          <div>
            <label htmlFor="project-size" className="label">Ukuran</label>
            <input id="project-size" name="size_text" type="text" className="input" placeholder="5 × 8 m" />
          </div>
          <div>
            <label htmlFor="project-style" className="label">Style / Model</label>
            <input id="project-style" name="style_text" type="text" className="input" placeholder="Modern Minimalist" />
          </div>
        </div>

        <div>
          <label htmlFor="project-problem" className="label">Problem</label>
          <textarea id="project-problem" name="problem" className="textarea" rows={3} />
        </div>

        <div>
          <label htmlFor="project-solution" className="label">Solusi / Pendekatan Desain</label>
          <textarea id="project-solution" name="solution" className="textarea" rows={3} />
        </div>

        <div>
          <label htmlFor="project-description" className="label">Deskripsi Lengkap</label>
          <textarea id="project-description" name="description" className="textarea" rows={5} />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium mb-1">Status</h3>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="published" className="w-4 h-4" />
            <span className="text-sm">Publikasi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="featured" className="w-4 h-4" />
            <span className="text-sm">Featured</span>
          </label>
        </div>

        <div>
          <label htmlFor="project-sort" className="label">Urutan</label>
          <input id="project-sort" name="sort_order" type="number" className="input w-24" defaultValue={0} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Menyimpan...' : 'Simpan Proyek'}
        <Save size={14} />
      </button>
    </form>
  )
}
