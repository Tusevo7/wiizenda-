'use client'

import { FormEvent, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ChatComposerProps = {
  conversationId: string
  userId: string
}

export default function ChatComposer({
  conversationId,
  userId,
}: ChatComposerProps) {
  const router = useRouter()

  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const text = message.trim()

    if (!text || sending) return

    setSending(true)

    const supabase = createClient()

    const { error } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        message: text,
      })

    if (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('Não foi possível enviar a mensagem.')
      setSending(false)
      return
    }

    setMessage('')

    router.refresh()

    setSending(false)
  }

  return (
    <div className="py-3">
      <form
        onSubmit={handleSubmit}
        className="flex items-end gap-2"
      >
        <textarea
          value={message}
          onChange={(event) =>
            setMessage(event.target.value)
          }
          placeholder="Escreve uma mensagem..."
          rows={1}
          disabled={sending}
          className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:bg-white"
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              !event.shiftKey
            ) {
              event.preventDefault()
              event.currentTarget.form?.requestSubmit()
            }
          }}
        />

        <button
          type="submit"
          disabled={!message.trim() || sending}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white transition hover:bg-orange-600 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {sending ? (
            <Loader2
              size={19}
              className="animate-spin"
            />
          ) : (
            <Send size={19} />
          )}
        </button>
      </form>
    </div>
  )
}