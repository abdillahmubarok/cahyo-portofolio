'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getStorageUrl, generateStoragePath } from '@/lib/utils'
import { deleteMedia, setCoverImage, updateMediaAlt } from '@/app/actions'
import { Upload, Star, Trash2, X, Loader2 } from 'lucide-react'
import type { ProjectWithMedia, ProjectMedia } from '@/lib/types'
import { useRouter } from 'next/navigation'

type Props = {
  project: ProjectWithMedia
}

export function MediaManager({ project }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editingMedia, setEditingMedia] = useState<ProjectMedia | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const supabase = createClient()
    const maxOrder = Math.max(0, ...project.project_media.map(m => m.sort_order))
    let uploadCount = 0

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Mengupload ${i + 1}/${files.length}: ${file.name}`)

      // Get image dimensions
      const dimensions = await getImageDimensions(file)
      const storagePath = generateStoragePath(project.id, file.name)

      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        console.error('Upload error:', uploadError)
        continue
      }

      const isFirstMedia = project.project_media.length === 0 && i === 0

      await supabase.from('project_media').insert({
        project_id: project.id,
        storage_path: storagePath,
        width: dimensions.width,
        height: dimensions.height,
        aspect_ratio: dimensions.width && dimensions.height
          ? Math.round((dimensions.width / dimensions.height) * 100) / 100
          : null,
        sort_order: maxOrder + i + 1,
        is_cover: isFirstMedia,
      })

      uploadCount++
    }

    setUploading(false)
    setUploadProgress('')
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (uploadCount > 0) {
      router.refresh()
    }
  }

  const handleSetCover = async (media: ProjectMedia) => {
    await setCoverImage(media.id, project.id)
    router.refresh()
  }

  const handleDeleteMedia = async (media: ProjectMedia) => {
    if (!confirm('Hapus gambar ini?')) return
    await deleteMedia(media.id, media.storage_path)
    router.refresh()
  }

  const handleSaveAlt = async () => {
    if (!editingMedia) return
    const altInput = document.getElementById('media-alt') as HTMLInputElement
    const captionInput = document.getElementById('media-caption') as HTMLInputElement
    await updateMediaAlt(editingMedia.id, altInput.value, captionInput.value)
    setEditingMedia(null)
    router.refresh()
  }

  return (
    <div className="space-y-4">
      {/* Upload */}
      <div className="admin-card">
        <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border cursor-pointer hover:border-accent transition-colors">
          {uploading ? (
            <>
              <Loader2 size={24} className="text-muted mb-2 animate-spin" />
              <span className="text-sm text-muted">{uploadProgress}</span>
            </>
          ) : (
            <>
              <Upload size={24} className="text-muted mb-2" />
              <span className="text-sm text-muted">Klik untuk upload gambar</span>
              <span className="text-xs text-muted/60 mt-1">JPG, PNG, WebP, AVIF (maks 20MB)</span>
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/avif"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {/* Gallery Grid */}
      {project.project_media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {project.project_media.map(media => (
            <div key={media.id} className="relative group">
              <Image
                src={getStorageUrl(media.storage_path)}
                alt={media.alt_text || 'Media proyek'}
                width={media.width || 300}
                height={media.height || 200}
                className="w-full h-auto"
                sizes="200px"
              />
              {media.is_cover && (
                <span className="absolute top-1 left-1 bg-accent text-white text-[9px] px-1.5 py-0.5 uppercase tracking-wider">
                  Cover
                </span>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                {!media.is_cover && (
                  <button
                    onClick={() => handleSetCover(media)}
                    className="p-1.5 bg-white text-foreground hover:bg-accent hover:text-white transition-colors"
                    title="Jadikan cover"
                    aria-label="Jadikan cover"
                  >
                    <Star size={14} />
                  </button>
                )}
                <button
                  onClick={() => setEditingMedia(media)}
                  className="p-1.5 bg-white text-foreground hover:bg-accent hover:text-white transition-colors text-[10px] font-medium"
                  title="Edit alt text"
                  aria-label="Edit alt text"
                >
                  Alt
                </button>
                <button
                  onClick={() => handleDeleteMedia(media)}
                  className="p-1.5 bg-white text-error hover:bg-error hover:text-white transition-colors"
                  title="Hapus gambar"
                  aria-label="Hapus gambar"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {project.project_media.length === 0 && (
        <div className="admin-card text-center py-8">
          <p className="text-sm text-muted">Project belum memiliki gambar. Silakan upload gambar di atas.</p>
        </div>
      )}

      {/* Alt Text Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true">
          <div className="bg-white p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Edit Metadata</h3>
              <button onClick={() => setEditingMedia(null)} aria-label="Tutup">
                <X size={16} />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="media-alt" className="label">Alt Text</label>
                <input id="media-alt" type="text" className="input" defaultValue={editingMedia.alt_text ?? ''} />
              </div>
              <div>
                <label htmlFor="media-caption" className="label">Caption</label>
                <input id="media-caption" type="text" className="input" defaultValue={editingMedia.caption ?? ''} />
              </div>
              <button onClick={handleSaveAlt} className="btn btn-primary btn-sm w-full">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise(resolve => {
    const img = document.createElement('img')
    img.onload = () => {
      resolve({ width: img.naturalWidth, height: img.naturalHeight })
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => resolve({ width: 0, height: 0 })
    img.src = URL.createObjectURL(file)
  })
}
