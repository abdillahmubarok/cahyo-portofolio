'use client'

import { toggleProjectPublished, deleteProject } from '@/app/actions'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { useState } from 'react'

type Props = {
  projectId: string
  published: boolean
}

export function ProjectActions({ projectId, published }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)

  const handleToggle = async () => {
    await toggleProjectPublished(projectId, !published)
  }

  const handleDelete = async () => {
    await deleteProject(projectId)
  }

  return (
    <>
      <button
        onClick={handleToggle}
        className="btn btn-outline btn-sm"
        aria-label={published ? 'Unpublish' : 'Publish'}
        title={published ? 'Jadikan Draft' : 'Publikasi'}
      >
        {published ? <EyeOff size={12} /> : <Eye size={12} />}
      </button>

      <button
        onClick={() => setShowConfirm(true)}
        className="btn btn-outline btn-sm text-error border-error/30 hover:border-error"
        aria-label="Hapus proyek"
      >
        <Trash2 size={12} />
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white p-6 max-w-sm w-full">
            <h3 className="font-medium mb-2">Hapus Proyek?</h3>
            <p className="text-sm text-muted mb-6">
              Proyek beserta semua gambar akan dihapus secara permanen. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowConfirm(false)} className="btn btn-outline btn-sm">
                Batal
              </button>
              <button onClick={handleDelete} className="btn btn-danger btn-sm">
                <Trash2 size={12} />
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
