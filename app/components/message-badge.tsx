
'use client'

import Link from 'next/link'
import { MessageCircle } from 'lucide-react'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type MessageRow = {
  id: string
  sender_id: string
  conversation_id: string
  read: boolean
}

export default function MessageBadge() {
  const [unreadCount, setUnreadCount] = useState(0)
  const [href, setHref] = useState('/messages')

  useEffect(() => {
    const supabase = createClient()

    let cancelled = false

    async function loadUnreadCount(userId: string) {
      const { count, error } = await supabase
        .from('messages')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .neq('sender_id', userId)
        .eq('read', false)

      if (!error && !cancelled) {
        setUnreadCount(count ?? 0)
      }
    }

    async function init() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user || cancelled) {
        return
      }

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (cancelled) {
        return
      }

      setHref(
        agency
          ? '/agency/messages'
          : '/messages',
      )

      await loadUnreadCount(user.id)

      if (cancelled) {
        return
      }

      const channel = supabase.channel(
        `message-badge-${user.id}-${Date.now()}`,
      )

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const message =
            payload.new as MessageRow

          if (
            message.sender_id !== user.id &&
            message.read === false
          ) {
            setUnreadCount((current) => current + 1)
          }
        },
      )

      channel.on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const oldMessage =
            payload.old as Partial<MessageRow>

          const newMessage =
            payload.new as MessageRow

          if (
            oldMessage.read === false &&
            newMessage.read === true &&
            newMessage.sender_id !== user.id
          ) {
            setUnreadCount((current) =>
              Math.max(current - 1, 0),
            )
          }
        },
      )

      channel.subscribe((status) => {
        console.log(
          '[MessageBadge] Realtime:',
          status,
        )
      })

      if (cancelled) {
        await supabase.removeChannel(channel)
      }
    }

    init()

    return () => {
      cancelled = true
    }
  }, [])

  return (
    <Link
      href={href}
      aria-label={
        unreadCount > 0
          ? `Mensagens, ${unreadCount} não lidas`
          : 'Mensagens'
      }
      title="Mensagens"
      className="relative flex h-11 w-11 items-center justify-center rounded-full text-gray-700 transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 active:scale-95"
    >
      <MessageCircle
        size={21}
        aria-hidden="true"
      />

      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute right-1 top-1 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black leading-none text-white"
        >
          {unreadCount > 99
            ? '99+'
            : unreadCount}
        </span>
      )}
    </Link>
  )
}
