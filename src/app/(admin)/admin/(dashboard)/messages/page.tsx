import { getContactMessages } from '@/lib/queries'
import { MessagesTable } from '@/components/admin/messages-table'

export default async function AdminMessagesPage() {
  const messages = await getContactMessages()

  return (
    <div>
      <h1 className="text-xl font-medium mb-6">Pesan Kontak</h1>
      {messages.length === 0 ? (
        <div className="admin-card text-center py-16">
          <p className="text-muted">Belum ada pesan.</p>
        </div>
      ) : (
        <MessagesTable messages={messages} />
      )}
    </div>
  )
}
