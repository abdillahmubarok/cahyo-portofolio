'use client'

import { markMessageRead, deleteMessage } from '@/app/actions'
import type { ContactMessage } from '@/lib/types'
import { Eye, Trash2, Mail, MailOpen } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

type Props = {
  messages: ContactMessage[]
}

export function MessagesTable({ messages }: Props) {
  const router = useRouter()
  const [expanded, setExpanded] = useState<string | null>(null)

  const handleRead = async (id: string) => {
    await markMessageRead(id)
    router.refresh()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus pesan ini?')) return
    await deleteMessage(id)
    router.refresh()
  }

  return (
    <div className="space-y-3">
      {messages.map(msg => (
        <div
          key={msg.id}
          className={`admin-card cursor-pointer ${!msg.read ? 'border-l-4 border-l-accent' : ''}`}
          onClick={() => setExpanded(expanded === msg.id ? null : msg.id)}
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              {msg.read ? (
                <MailOpen size={16} className="text-muted mt-0.5 shrink-0" />
              ) : (
                <Mail size={16} className="text-accent mt-0.5 shrink-0" />
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{msg.name}</span>
                  <span className="text-xs text-muted">{msg.email}</span>
                </div>
                {msg.subject && (
                  <p className="text-sm text-muted mt-0.5">{msg.subject}</p>
                )}
                <p className="text-xs text-muted mt-1">
                  {new Date(msg.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
              {!msg.read && (
                <button
                  onClick={() => handleRead(msg.id)}
                  className="btn btn-outline btn-sm"
                  title="Tandai sudah dibaca"
                  aria-label="Tandai sudah dibaca"
                >
                  <Eye size={12} />
                </button>
              )}
              <button
                onClick={() => handleDelete(msg.id)}
                className="btn btn-outline btn-sm text-error border-error/30"
                title="Hapus pesan"
                aria-label="Hapus pesan"
              >
                <Trash2 size={12} />
              </button>
            </div>
          </div>

          {expanded === msg.id && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              {msg.phone && (
                <p className="text-xs text-muted mt-3">Telepon: {msg.phone}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
