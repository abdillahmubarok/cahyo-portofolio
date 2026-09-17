'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw } from 'lucide-react'

export default function SiteError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('Site application error:', error)
  }, [error])

  return (
    <div className="section-gap flex items-center justify-center min-h-[60vh]">
      <div className="container-site max-w-md text-center">
        <span className="text-label block mb-3 text-error">Terjadi Kesalahan Sistem</span>
        <h1 className="heading-xl mb-4">Gagal Memuat Halaman</h1>
        <p className="text-body text-muted mb-8 leading-relaxed">
          Terjadi kendala saat memuat data proyek dari server. Silakan coba memuat ulang atau kembali ke galeri proyek.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => reset()}
            className="btn btn-primary inline-flex items-center justify-center gap-2"
          >
            <RefreshCw size={14} />
            Coba Lagi
          </button>
          <Link
            href="/projects"
            className="btn btn-secondary inline-flex items-center justify-center gap-2"
          >
            <ArrowLeft size={14} />
            Semua Proyek
          </Link>
        </div>
      </div>
    </div>
  )
}
