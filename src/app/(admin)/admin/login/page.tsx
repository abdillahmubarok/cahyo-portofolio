import type { Metadata } from 'next'
import { LoginForm } from '@/components/admin/login-form'

export const metadata: Metadata = {
  title: 'Admin Login',
  robots: { index: false, follow: false },
}

type Props = {
  searchParams: Promise<{ error?: string }>
}

export default async function AdminLoginPage({ searchParams }: Props) {
  const { error } = await searchParams

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-lg font-medium tracking-[0.15em] uppercase mb-2">Admin</h1>
          <p className="text-sm text-muted">Masuk ke dashboard</p>
        </div>

        {error === 'invalid' && (
          <div className="p-3 mb-4 border border-error text-error text-sm text-center">
            Email atau password salah.
          </div>
        )}
        {error === 'not_admin' && (
          <div className="p-3 mb-4 border border-error text-error text-sm text-center">
            Akun Anda tidak memiliki akses admin.
          </div>
        )}

        <LoginForm />
      </div>
    </div>
  )
}
