export function validateImageFile(file: { type: string; size: number }) {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) throw new Error('Format harus JPG, PNG, WebP, atau AVIF.')
  if (file.size === 0 || file.size > 20 * 1024 * 1024) throw new Error('Ukuran file harus 1 byte–20 MB.')
}

// Storage + Postgres is a compensated operation, not an atomic transaction.
export async function uploadAndRegister(operations: {
  upload: () => Promise<void>
  register: () => Promise<void>
  compensate: () => Promise<{ registered: boolean }>
}): Promise<{ registered: boolean; cleanupPending: boolean; error?: string }> {
  let uploaded = false
  try {
    await operations.upload()
    uploaded = true
    await operations.register()
    return { registered: true, cleanupPending: false }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload gagal.'
    if (!uploaded) return { registered: false, cleanupPending: false, error: message }
    try {
      // Compensation checks committed DB references before deleting the asset.
      const result = await operations.compensate()
      return { registered: result.registered, cleanupPending: false, error: result.registered ? undefined : message }
    } catch {
      return { registered: false, cleanupPending: true, error: message }
    }
  }
}
