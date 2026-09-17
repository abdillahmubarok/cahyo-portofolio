'use client'

import { useActionState } from 'react'
import { updateProject, type ProjectFormState } from '@/app/actions'
import type { ProjectWithMedia } from '@/lib/types'
import { Save, Check } from 'lucide-react'
import { useCallback } from 'react'

type Props = {
  project: ProjectWithMedia
}

export function ProjectFormEdit({ project }: Props) {
  const boundUpdate = useCallback(
    (state: ProjectFormState, formData: FormData) => updateProject(project.id, state, formData),
    [project.id]
  )

  const [state, action, pending] = useActionState<ProjectFormState, FormData>(boundUpdate, {})

  return (
    <form action={action} className="space-y-6 max-w-3xl">
      {state.error && (
        <div className="p-3 border border-error text-error text-sm">{state.error}</div>
      )}
      {state.success && (
        <div className="p-3 border border-success text-success text-sm flex items-center gap-2">
          <Check size={14} />
          Proyek berhasil diperbarui.
        </div>
      )}

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Informasi Dasar</h3>

        <div>
          <label htmlFor="edit-title" className="label">Judul Proyek *</label>
          <input id="edit-title" name="title" type="text" required className="input" defaultValue={project.title} />
        </div>

        <div>
          <label htmlFor="edit-slug" className="label">Slug *</label>
          <input id="edit-slug" name="slug" type="text" required className="input" defaultValue={project.slug} />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-category" className="label">Kategori</label>
            <input id="edit-category" name="category" type="text" className="input" defaultValue={project.category ?? ''} />
          </div>
          <div>
            <label htmlFor="edit-year" className="label">Tahun</label>
            <input id="edit-year" name="year" type="number" className="input" defaultValue={project.year ?? ''} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="edit-location" className="label">Lokasi</label>
            <input id="edit-location" name="location" type="text" className="input" defaultValue={project.location ?? ''} />
          </div>
          <div>
            <label htmlFor="edit-client" className="label">Klien</label>
            <input id="edit-client" name="client_name" type="text" className="input" defaultValue={project.client_name ?? ''} />
          </div>
        </div>

        <div>
          <label htmlFor="edit-summary" className="label">Ringkasan</label>
          <textarea id="edit-summary" name="summary" className="textarea" rows={3} defaultValue={project.summary ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Detail Proyek</h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label htmlFor="edit-duration" className="label">Durasi</label>
            <input id="edit-duration" name="duration_text" type="text" className="input" defaultValue={project.duration_text ?? ''} />
          </div>
          <div>
            <label htmlFor="edit-size" className="label">Ukuran</label>
            <input id="edit-size" name="size_text" type="text" className="input" defaultValue={project.size_text ?? ''} />
          </div>
          <div>
            <label htmlFor="edit-style" className="label">Style / Model</label>
            <input id="edit-style" name="style_text" type="text" className="input" defaultValue={project.style_text ?? ''} />
          </div>
        </div>

        <div>
          <label htmlFor="edit-problem" className="label">Problem</label>
          <textarea id="edit-problem" name="problem" className="textarea" rows={3} defaultValue={project.problem ?? ''} />
        </div>

        <div>
          <label htmlFor="edit-solution" className="label">Solusi / Pendekatan Desain</label>
          <textarea id="edit-solution" name="solution" className="textarea" rows={3} defaultValue={project.solution ?? ''} />
        </div>

        <div>
          <label htmlFor="edit-description" className="label">Deskripsi Lengkap</label>
          <textarea id="edit-description" name="description" className="textarea" rows={5} defaultValue={project.description ?? ''} />
        </div>
      </div>

      <div className="admin-card space-y-5">
        <h3 className="text-sm font-medium">Status</h3>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="published" className="w-4 h-4" defaultChecked={project.published} />
            <span className="text-sm">Publikasi</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" name="featured" className="w-4 h-4" defaultChecked={project.featured} />
            <span className="text-sm">Featured</span>
          </label>
        </div>

        <div>
          <label htmlFor="edit-sort" className="label">Urutan</label>
          <input id="edit-sort" name="sort_order" type="number" className="input w-24" defaultValue={project.sort_order} />
        </div>
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? 'Menyimpan...' : 'Simpan Perubahan'}
        <Save size={14} />
      </button>
    </form>
  )
}
