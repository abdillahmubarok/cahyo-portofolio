import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="container-site text-center">
        <p className="text-label mb-4">404</p>
        <h1 className="heading-display mb-6">Halaman Tidak Ditemukan</h1>
        <p className="text-body mb-10 max-w-md mx-auto">
          Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
        </p>
        <Link href="/" className="btn btn-outline">
          <ArrowLeft size={14} />
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  )
}
