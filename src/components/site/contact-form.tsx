'use client'

import { useActionState } from 'react'
import { submitContactMessage, type ContactFormState } from '@/app/actions'
import { Send, Check } from 'lucide-react'

export function ContactForm() {
  const [state, action, pending] = useActionState<ContactFormState, FormData>(
    submitContactMessage,
    {}
  )

  if (state.success) {
    return (
      <div className="border border-border p-10 text-center">
        <div className="inline-flex items-center justify-center w-12 h-12 border border-accent text-accent mb-4">
          <Check size={20} />
        </div>
        <h3 className="heading-md mb-2">Pesan Terkirim</h3>
        <p className="text-sm text-muted">Terima kasih! Kami akan segera merespons pesan Anda.</p>
      </div>
    )
  }

  return (
    <form action={action} className="space-y-6">
      {/* Honeypot */}
      <div className="absolute opacity-0 pointer-events-none" aria-hidden="true">
        <input type="text" name="_honeypot" tabIndex={-1} autoComplete="off" />
      </div>

      {state.error && (
        <div className="p-3 border border-error text-error text-sm">{state.error}</div>
      )}

      <div>
        <label htmlFor="contact-name" className="label">Nama *</label>
        <input
          id="contact-name"
          name="name"
          type="text"
          required
          className={`input ${state.fieldErrors?.name ? 'input-error' : ''}`}
          placeholder="Nama lengkap Anda"
        />
        {state.fieldErrors?.name && (
          <p className="text-xs text-error mt-1">{state.fieldErrors.name[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-email" className="label">Email *</label>
        <input
          id="contact-email"
          name="email"
          type="email"
          required
          className={`input ${state.fieldErrors?.email ? 'input-error' : ''}`}
          placeholder="email@contoh.com"
        />
        {state.fieldErrors?.email && (
          <p className="text-xs text-error mt-1">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      <div>
        <label htmlFor="contact-phone" className="label">Telepon</label>
        <input
          id="contact-phone"
          name="phone"
          type="tel"
          className="input"
          placeholder="08xx-xxxx-xxxx"
        />
      </div>

      <div>
        <label htmlFor="contact-subject" className="label">Subjek</label>
        <input
          id="contact-subject"
          name="subject"
          type="text"
          className="input"
          placeholder="Tentang apa?"
        />
      </div>

      <div>
        <label htmlFor="contact-message" className="label">Pesan *</label>
        <textarea
          id="contact-message"
          name="message"
          required
          className={`textarea ${state.fieldErrors?.message ? 'input-error' : ''}`}
          placeholder="Ceritakan tentang proyek Anda..."
          rows={5}
        />
        {state.fieldErrors?.message && (
          <p className="text-xs text-error mt-1">{state.fieldErrors.message[0]}</p>
        )}
      </div>

      <button type="submit" disabled={pending} className="btn btn-primary w-full sm:w-auto">
        {pending ? 'Mengirim...' : 'Kirim Pesan'}
        <Send size={14} />
      </button>
    </form>
  )
}
