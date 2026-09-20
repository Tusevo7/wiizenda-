'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type ChatRealtimeProps = {
  conversationId: string
}

export default function ChatRealtime({
  conversationId,
}: ChatRealtimeProps) {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    // Atualiza imediatamente quando o Realtime receber uma mensagem
    const channel = supabase
      .channel(`chat-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => {
          router.refresh()
        },
      )
      .subscribe()

    // Fallback:
    // verifica novas mensagens periodicamente.
    // Assim o chat continua funcionando mesmo se o
    // Realtime estiver atrasado ou não estiver configurado.
    const interval = window.setInterval(() => {
      router.refresh()
    }, 3000)

    return () => {
      window.clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [conversationId, router])

  return null
}