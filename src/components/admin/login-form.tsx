'use client'

import { signIn } from '@/app/actions'
import { LogIn } from 'lucide-react'

export function LoginForm() {
  return (
    <form action={signIn} className="space-y-4">
      <div>
        <label htmlFor="login-email" className="label">Email</label>
        <input
          id="login-email"
          name="email"
          type="email"
          required
          className="input"
          placeholder="admin@email.com"
          autoComplete="email"
        />
      </div>
      <div>
        <label htmlFor="login-password" className="label">Password</label>
        <input
          id="login-password"
          name="password"
          type="password"
          required
          className="input"
          placeholder="••••••••"
          autoComplete="current-password"
        />
      </div>
      <button type="submit" className="btn btn-primary w-full">
        Masuk
        <LogIn size={14} />
      </button>
    </form>
  )
}
