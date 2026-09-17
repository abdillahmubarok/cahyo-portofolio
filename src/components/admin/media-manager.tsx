'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { getStorageUrl, generateStoragePath } from '@/lib/utils'
import { deleteMedia, setCoverImage, updateMediaAlt, registerProjectMedia, cleanupUnregisteredMedia, updateMediaOrder } from '@/app/actions'
import { Upload, Star, Trash2, X, Loader2 } from 'lucide-react'
import type { ProjectWithMedia, ProjectMedia } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { uploadAndRegister, validateImageFile } from '@/lib/media-upload'

type Props = {
  project: ProjectWithMedia
}

export function MediaManager({ project }: Props) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [editingMedia, setEditingMedia] = useState<ProjectMedia | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [cleanupPaths, setCleanupPaths] = useState<string[]>([])
  const [pendingOrder, setPendingOrder] = useState<string[] | null>(null)
  const [busy, setBusy] = useState(false)
  const orderedMedia = pendingOrder
    ? pendingOrder.map(id => project.project_media.find(media => media.id === id)).filter((media): media is ProjectMedia => !!media)
    : project.project_media
  const fileInputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files || files.length === 0) return

    setUploading(true)
    setErrors([])
    const maxOrder = Math.max(0, ...project.project_media.map(m => m.sort_order))
    let uploadCount = 0

    try {
      const supabase = createClient()
      for (let i = 0; i < files.length; i++) {
      const file = files[i]
      setUploadProgress(`Mengupload ${i + 1}/${files.length}: ${file.name}`)
      const storagePath = generateStoragePath(project.id, file.name)
      try {
      validateImageFile(file)
      const dimensions = await getImageDimensions(file)
      const result = await uploadAndRegister({
        upload: async () => {
      const { error: uploadError } = await supabase.storage
        .from('portfolio-images')
        .upload(storagePath, file, { contentType: file.type })

      if (uploadError) {
        throw new Error(uploadError.message)
      }
        },
        register: async () => {
      const isFirstMedia = project.project_media.length === 0 && uploadCount === 0

      await registerProjectMedia(project.id, {
        storage_path: storagePath,
        width: dimensions.width,
        height: dimensions.height,
        aspect_ratio: dimensions.width && dimensions.height
          ? Math.round((dimensions.width / dimensions.height) * 100) / 100
          : null,
        sort_order: maxOrder + i + 1,
        is_cover: isFirstMedia,
      })
        },
        compensate: () => cleanupUnregisteredMedia(project.id, storagePath),
      })
      if (result.registered) uploadCount++
      if (result.error) setErrors(previous => [...previous, `${file.name}: ${result.error}`])
      if (result.cleanupPending) {
        setCleanupPaths(previous => [...new Set([...previous, storagePath])])
        setErrors(previous => [...previous, `Pembersihan perlu dicoba kembali: ${storagePath}`])
      }
      } catch (error) {
        setErrors(previous => [...previous, `${file.name}: ${error instanceof Error ? error.message : 'Upload gagal.'}`])
      }
    } } catch (error) {
      setErrors(previous => [...previous, error instanceof Error ? error.message : 'Upload gagal.'])
    } finally {
    setUploading(false)
    setUploadProgress('')
    if (fileInputRef.current) fileInputRef.current.value = ''

    if (uploadCount > 0) {
      setPendingOrder(null)
      router.refresh()
    }
    }
  }

  const runMutation = async (operation: () => Promise<void>) => {
    setBusy(true)
    setErrors([])
    try { await operation(); router.refresh() }
    catch (error) { setErrors([error instanceof Error ? error.message : 'Perubahan gagal. Coba lagi.']) }
    finally { setBusy(false) }
  }

  const handleSetCover = (media: ProjectMedia) => runMutation(() => setCoverImage(media.id, project.id))

  const handleDeleteMedia = async (media: ProjectMedia) => {
    if (!confirm('Hapus gambar ini?')) return
    await runMutation(async () => {
      const result = await deleteMedia(media.id)
      if (result.cleanupPath) setCleanupPaths(previous => [...new Set([...previous, result.cleanupPath!])])
      setPendingOrder(null)
    })
  }

  const handleSaveAlt = async () => {
    if (!editingMedia) return
    const altInput = document.getElementById('media-alt') as HTMLInputElement
    const captionInput = document.getElementById('media-caption') as HTMLInputElement
    await runMutation(async () => {
      await updateMediaAlt(editingMedia.id, altInput.value, captionInput.value)
      setEditingMedia(null)
    })
  }

  const moveMedia = (index: number, direction: number) => {
    const ids = orderedMedia.map(media => media.id)
    ;[ids[index], ids[index + direction]] = [ids[index + direction], ids[index]]
    setPendingOrder(ids)
  }

  return (
    <div className="space-y-4">
      {errors.length > 0 && <ul role="alert" className="text-sm text-error space-y-2">{errors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
      {cleanupPaths.map(path => <div key={path} className="admin-card text-sm">
        <p>File tanpa referensi perlu dibersihkan: {path}</p>
        <button type="button" className="btn btn-outline btn-sm mt-2" disabled={busy || uploading} onClick={() => runMutation(async () => {
          await cleanupUnregisteredMedia(project.id, path)
          setCleanupPaths(previous => previous.filter(item => item !== path))
        })}>Coba pembersihan lagi</button>
      </div>)}
      <fieldset disabled={busy || uploading} className="space-y-4">
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
            className="sr-only"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button type="button" className="btn btn-outline btn-sm" disabled={!pendingOrder} onClick={() => runMutation(async () => {
          await updateMediaOrder(project.id, orderedMedia.map(media => media.id))
          setPendingOrder(null)
        })}>Simpan urutan</button>
        {pendingOrder && <button type="button" className="btn btn-outline btn-sm" onClick={() => setPendingOrder(null)}>Batalkan urutan</button>}
        <span role="status" className="text-xs text-muted">{pendingOrder ? 'Urutan belum disimpan. Cover tidak berubah.' : `${orderedMedia.length} gambar`}</span>
      </div>

      {/* Gallery Grid */}
      {project.project_media.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {orderedMedia.map((media, index) => (
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
              <div className="flex flex-wrap items-center justify-center gap-2 py-2 bg-surface">
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
              <div className="flex flex-wrap justify-between items-center gap-1 text-xs">
                <button type="button" className="btn btn-outline btn-sm" aria-label={`Pindahkan gambar ${index + 1} ke awal`} disabled={index === 0} onClick={() => moveMedia(index, -1)}>←</button>
                <span>{index + 1} / {orderedMedia.length}</span>
                <button type="button" className="btn btn-outline btn-sm" aria-label={`Pindahkan gambar ${index + 1} ke akhir`} disabled={index === orderedMedia.length - 1} onClick={() => moveMedia(index, 1)}>→</button>
              </div>
            </div>
          ))}
        </div>
      )}
      </fieldset>

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
              <button disabled={busy} onClick={handleSaveAlt} className="btn btn-primary btn-sm w-full">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = document.createElement('img')
    img.onload = () => {
      if (img.naturalWidth > 0 && img.naturalHeight > 0) resolve({ width: img.naturalWidth, height: img.naturalHeight })
      else reject(new Error('Dimensi gambar tidak valid.'))
      URL.revokeObjectURL(img.src)
    }
    img.onerror = () => { URL.revokeObjectURL(img.src); reject(new Error('Gambar tidak dapat dibaca.')) }
    img.src = URL.createObjectURL(file)
  })
}
