'use client'

import {
  ArrowLeft,
  MapPin,
  MoreHorizontal,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import ChatComposer from '@/app/components/chat-composer'
import ChatScrollBottom from '@/app/components/chat-scroll-bottom'

type AgencyMessagesChatPanelProps = {
  conversationId: string
  userId: string
  agencyId: string
  onClose: () => void
}

type Conversation = {
  id: string
  user_id: string
  agency_id: string
  experience_id: string | null
  customer_name: string | null
  customer_phone: string | null
  created_at: string
}

type Experience = {
  id: string
  title: string
  slug: string
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  read: boolean
  created_at: string
}

export default function AgencyMessagesChatPanel({
  conversationId,
  userId,
  agencyId,
  onClose,
}: AgencyMessagesChatPanelProps) {
  const supabase = useMemo(
    () => createClient(),
    [],
  )

  const [conversation, setConversation] =
    useState<Conversation | null>(null)

  const [experience, setExperience] =
    useState<Experience | null>(null)

  const [messages, setMessages] =
    useState<Message[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadChat() {
      setLoading(true)

      const { data: conversationData } =
        await supabase
          .from('conversations')
          .select(`
            id,
            user_id,
            agency_id,
            experience_id,
            customer_name,
            customer_phone,
            created_at
          `)
          .eq('id', conversationId)
          .eq('agency_id', agencyId)
          .maybeSingle()

      if (cancelled) return

      if (!conversationData) {
        setLoading(false)
        return
      }

      const currentConversation =
        conversationData as Conversation

      setConversation(
        currentConversation,
      )

      if (
        currentConversation.experience_id
      ) {
        const { data: experienceData } =
          await supabase
            .from('experiences')
            .select(
              'id, title, slug',
            )
            .eq(
              'id',
              currentConversation.experience_id,
            )
            .maybeSingle()

        if (!cancelled) {
          setExperience(
            (experienceData ||
              null) as Experience | null,
          )
        }
      } else {
        setExperience(null)
      }

      const { data: messageData } =
        await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            message,
            read,
            created_at
          `)
          .eq(
            'conversation_id',
            conversationId,
          )
          .order('created_at', {
            ascending: true,
          })

      if (!cancelled) {
        setMessages(
          (messageData ||
            []) as Message[],
        )
      }

      /*
       * MARCAR COMO LIDAS
       *
       * Apenas mensagens enviadas pelo
       * cliente são marcadas como lidas.
       */
      await supabase
        .from('messages')
        .update({
          read: true,
        })
        .eq(
          'conversation_id',
          conversationId,
        )
        .neq(
          'sender_id',
          userId,
        )
        .eq('read', false)

      if (!cancelled) {
        setLoading(false)
      }
    }

    loadChat()

    return () => {
      cancelled = true
    }
  }, [
    conversationId,
    agencyId,
    userId,
    supabase,
  ])

  /*
   * REALTIME DA CONVERSA
   */
  useEffect(() => {
    const channel = supabase
      .channel(
        `agency-chat-${conversationId}`,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMessage =
            payload.new as Message

          setMessages((current) => {
            const exists = current.some(
              (message) =>
                message.id === newMessage.id,
            )

            if (exists) {
              return current
            }

            return [
              ...current,
              newMessage,
            ]
          })

          /*
           * Se o cliente enviar uma mensagem
           * enquanto a conversa estiver aberta,
           * marca automaticamente como lida.
           */
          if (
            newMessage.sender_id !== userId
          ) {
            supabase
              .from('messages')
              .update({
                read: true,
              })
              .eq(
                'id',
                newMessage.id,
              )
              .then(() => {})
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updatedMessage =
            payload.new as Message

          setMessages((current) =>
            current.map((message) =>
              message.id ===
              updatedMessage.id
                ? updatedMessage
                : message,
            ),
          )
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [
    conversationId,
    supabase,
    userId,
  ])

  function formatTime(
    date: string,
  ) {
    return new Date(date).toLocaleTimeString(
      'pt-AO',
      {
        hour: '2-digit',
        minute: '2-digit',
      },
    )
  }

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 flex-col bg-white">
        <div className="flex h-16 items-center gap-3 border-b border-gray-100 px-4">
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100 md:hidden"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />

          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-2 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="flex-1 animate-pulse bg-gray-50" />
      </div>
    )
  }

  if (!conversation) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="text-sm text-gray-500">
          Não foi possível carregar esta
          conversa.
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-4 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white"
        >
          Voltar
        </button>
      </div>
    )
  }

  return (
    <div className="flex min-w-0 flex-1 flex-col bg-white">
      {/* =====================================================
          HEADER
      ====================================================== */}
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-4">
        <button
          type="button"
          onClick={onClose}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 md:hidden"
          aria-label="Voltar às conversas"
        >
          <ArrowLeft size={20} />
        </button>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
          <span className="text-sm font-black">
            {conversation.customer_name
              ?.charAt(0)
              .toUpperCase() ||
              'C'}
          </span>
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="truncate text-sm font-black">
            {conversation.customer_name ||
              'Cliente'}
          </h2>

          {experience ? (
            <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[11px] text-gray-500">
              <MapPin
                size={11}
                className="shrink-0"
              />

              <span className="truncate">
                {experience.title}
              </span>
            </div>
          ) : conversation.customer_phone ? (
            <p className="truncate text-[11px] text-gray-500">
              {conversation.customer_phone}
            </p>
          ) : null}
        </div>

        <button
          type="button"
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full hover:bg-gray-100"
          aria-label="Mais opções"
        >
          <MoreHorizontal size={20} />
        </button>
      </header>

      {/* =====================================================
          EXPERIÊNCIA
      ====================================================== */}
      {experience && (
        <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-orange-500">
              <MapPin size={16} />
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                Experiência
              </p>

              <p className="truncate text-xs font-bold text-gray-800">
                {experience.title}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================
          MENSAGENS
      ====================================================== */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-gray-50 px-4 py-5">
        <div className="mx-auto flex max-w-3xl flex-col gap-2">
          {messages.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-20 text-center">
              <div>
                <p className="text-sm font-bold text-gray-700">
                  Nenhuma mensagem ainda
                </p>

                <p className="mt-1 text-xs text-gray-400">
                  Começa a conversa com o cliente.
                </p>
              </div>
            </div>
          ) : (
            messages.map((message) => {
              const isMine =
                message.sender_id ===
                userId

              return (
                <div
                  key={message.id}
                  className={`flex ${
                    isMine
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >
                  <div
                    className={`
                      max-w-[82%] rounded-2xl px-4 py-2.5
                      ${
                        isMine
                          ? 'rounded-br-md bg-orange-500 text-white'
                          : 'rounded-bl-md bg-white text-gray-800 shadow-sm'
                      }
                    `}
                  >
                    <p className="whitespace-pre-wrap break-words text-sm leading-5">
                      {message.message}
                    </p>

                    <div
                      className={`mt-1 text-[9px] ${
                        isMine
                          ? 'text-white/70'
                          : 'text-gray-400'
                      }`}
                    >
                      {formatTime(
                        message.created_at,
                      )}
                    </div>
                  </div>
                </div>
              )
            })
          )}

          <ChatScrollBottom
            dependency={messages.length}
          />
        </div>
      </div>

      {/* =====================================================
          COMPOSER
      ====================================================== */}
      <div className="shrink-0 border-t border-gray-100 bg-white px-4">
        <ChatComposer
          conversationId={conversationId}
          userId={userId}
        />
      </div>
    </div>
  )
}