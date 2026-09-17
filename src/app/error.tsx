'use client'

// Covers failures in the site layout itself (settings/header/footer queries).
export default function ErrorPage({ reset }: { reset: () => void }) {
  return <main className="container-site section-gap">
    <h1 className="heading-xl">Gagal memuat situs</h1>
    <p className="text-body my-6">Data belum dapat dimuat. Silakan coba lagi.</p>
    <button className="btn btn-primary" onClick={reset}>Coba Lagi</button>
  </main>
}
