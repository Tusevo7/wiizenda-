'use client'

import {
  ArrowLeft,
  MapPin,
} from 'lucide-react'
import { useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import ChatRealtime from '@/app/components/chat-realtime'
import ChatComposer from '@/app/components/chat-composer'
import ChatScrollBottom from '@/app/components/chat-scroll-bottom'

type MessagesChatPanelProps = {
  conversationId: string
  userId: string
  onClose: () => void
}

type Agency = {
  id: string
  owner_id: string
  name: string
  logo_url: string | null
  city: string | null
  province: string | null
}

type Experience = {
  id: string
  title: string
  cover_image: string | null
}

type Conversation = {
  id: string
  user_id: string
  agency_id: string
  experience_id: string | null
  agency: Agency | null
  experience: Experience | null
}

type Message = {
  id: string
  sender_id: string
  message: string
  read: boolean
  created_at: string
}

export default function MessagesChatPanel({
  conversationId,
  userId,
  onClose,
}: MessagesChatPanelProps) {
  const supabase = createClient()

  const [conversation, setConversation] =
    useState<Conversation | null>(null)

  const [messages, setMessages] =
    useState<Message[]>([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState<string | null>(null)

  /*
   * =====================================================
   * CARREGAR CONVERSA
   * =====================================================
   */

  useEffect(() => {
    let mounted = true

    async function loadConversation() {
      setLoading(true)
      setError(null)

      const {
        data,
        error: conversationError,
      } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          agency_id,
          experience_id,
          agencies (
            id,
            owner_id,
            name,
            logo_url,
            city,
            province
          ),
          experiences (
            id,
            title,
            cover_image
          )
        `)
        .eq('id', conversationId)
        .eq('user_id', userId)
        .maybeSingle()

      if (!mounted) return

      if (conversationError) {
        console.error(
          'Erro ao carregar conversa:',
          conversationError,
        )

        setError(
          'Não foi possível carregar esta conversa.',
        )

        setLoading(false)
        return
      }

      if (!data) {
        setError(
          'Esta conversa não foi encontrada.',
        )

        setLoading(false)
        return
      }

      const agency = Array.isArray(data.agencies)
        ? data.agencies[0] || null
        : data.agencies || null

      const experience =
        Array.isArray(data.experiences)
          ? data.experiences[0] || null
          : data.experiences || null

      setConversation({
        id: data.id,
        user_id: data.user_id,
        agency_id: data.agency_id,
        experience_id: data.experience_id,
        agency,
        experience,
      })

      /*
       * CARREGAR MENSAGENS
       */

      const {
        data: messageData,
        error: messageError,
      } = await supabase
        .from('messages')
        .select(`
          id,
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

      if (!mounted) return

      if (messageError) {
        console.error(
          'Erro ao carregar mensagens:',
          messageError,
        )
      }

      setMessages(messageData || [])

      /*
       * MARCAR COMO LIDAS
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
        .neq('sender_id', userId)
        .eq('read', false)

      setLoading(false)
    }

    loadConversation()

    return () => {
      mounted = false
    }
  }, [
    conversationId,
    userId,
    supabase,
  ])

  /*
   * =====================================================
   * REALTIME DO CHAT
   * =====================================================
   */

  useEffect(() => {
    const channel = supabase
      .channel(
        `chat-panel-${conversationId}`,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          const newMessage =
            payload.new as Message

          setMessages((current) => {
            const exists = current.some(
              (item) =>
                item.id === newMessage.id,
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
           * Se a mensagem veio da agência,
           * marcamos imediatamente como lida.
           */

          if (
            newMessage.sender_id !==
            userId
          ) {
            await supabase
              .from('messages')
              .update({
                read: true,
              })
              .eq(
                'id',
                newMessage.id,
              )
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
            current.map((item) =>
              item.id ===
              updatedMessage.id
                ? updatedMessage
                : item,
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
    userId,
    supabase,
  ])

  /*
   * =====================================================
   * LOADING
   * =====================================================
   */

  if (loading) {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col bg-white">

        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-4">
          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="h-11 w-11 animate-pulse rounded-full bg-gray-100" />

          <div className="space-y-2">
            <div className="h-3 w-32 animate-pulse rounded bg-gray-100" />
            <div className="h-2.5 w-20 animate-pulse rounded bg-gray-100" />
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center">
          <div className="text-sm text-gray-400">
            A carregar conversa...
          </div>
        </div>

      </section>
    )
  }

  /*
   * =====================================================
   * ERRO
   * =====================================================
   */

  if (error || !conversation) {
    return (
      <section className="flex h-full min-w-0 flex-1 flex-col bg-white">

        <div className="flex h-16 shrink-0 items-center gap-3 border-b border-gray-100 px-4">

          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar"
            className="flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <ArrowLeft size={20} />
          </button>

          <h1 className="text-base font-black">
            Mensagens
          </h1>

        </div>

        <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">

          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl">
            💬
          </div>

          <h2 className="mt-5 text-xl font-black">
            Conversa indisponível
          </h2>

          <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
            {error ||
              'Não foi possível carregar esta conversa.'}
          </p>

        </div>

      </section>
    )
  }

  const agency =
    conversation.agency

  const experience =
    conversation.experience

  return (
    <section className="flex h-full min-w-0 flex-1 flex-col bg-white">

      {/* =================================================
          HEADER
      ================================================== */}

      <header className="shrink-0 border-b border-gray-100 bg-white">

        <div className="flex h-16 items-center gap-3 px-4 sm:px-5">

          {/* VOLTAR */}

          <button
            type="button"
            onClick={onClose}
            aria-label="Voltar para as conversas"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 active:scale-95"
          >
            <ArrowLeft size={20} />
          </button>

          {/* LOGO */}

          <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">

            {agency?.logo_url ? (
              <img
                src={agency.logo_url}
                alt={agency.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg font-black text-gray-400">
                {agency?.name
                  ?.charAt(0)
                  .toUpperCase() || 'A'}
              </span>
            )}

          </div>

          {/* NOME */}

          <div className="min-w-0 flex-1">

            <h1 className="truncate text-sm font-black text-gray-950 sm:text-base">
              {agency?.name ||
                'Agência'}
            </h1>

            <div className="flex items-center gap-1 text-xs text-gray-500">

              <MapPin size={11} />

              <span className="truncate">
                {agency?.city ||
                  agency?.province ||
                  'Angola'}
              </span>

            </div>

          </div>

        </div>

      </header>

      {/* =================================================
          EXPERIÊNCIA
      ================================================== */}

      {experience && (
        <section className="shrink-0 border-b border-gray-100 bg-gray-50">

          <div className="px-4 py-3 sm:px-5">

            <div className="flex items-center gap-3">

              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-200">

                {experience.cover_image && (
                  <img
                    src={
                      experience.cover_image
                    }
                    alt={
                      experience.title
                    }
                    className="h-full w-full object-cover"
                  />
                )}

              </div>

              <div className="min-w-0">

                <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400">
                  Experiência
                </p>

                <p className="truncate text-sm font-bold text-gray-900">
                  {experience.title}
                </p>

              </div>

            </div>

          </div>

        </section>
      )}

      {/* =================================================
          REALTIME
      ================================================== */}

      <ChatRealtime
        conversationId={
          conversationId
        }
      />

      {/* =================================================
          MENSAGENS
      ================================================== */}

      <div
        data-chat-scroll
        className="min-h-0 flex-1 overflow-y-auto px-4 sm:px-5"
      >

        <div className="mx-auto max-w-3xl space-y-3 py-6">

          {messages.length > 0 ? (
            messages.map((item) => {

              const isMine =
                item.sender_id ===
                userId

              return (
                <div
                  key={item.id}
                  className={`flex w-full ${
                    isMine
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  <div
                    className={`flex max-w-[85%] flex-col sm:max-w-[70%] ${
                      isMine
                        ? 'items-end'
                        : 'items-start'
                    }`}
                  >

                    {/* BALÃO */}

                    <div
                      className={`rounded-3xl px-4 py-3 shadow-sm ${
                        isMine
                          ? 'rounded-br-md bg-orange-500 text-white'
                          : 'rounded-bl-md border border-gray-200 bg-gray-100 text-gray-900'
                      }`}
                    >

                      <p className="whitespace-pre-wrap break-words text-sm leading-6">
                        {item.message}
                      </p>

                    </div>

                    {/* HORA */}

                    <span className="mt-1 px-1 text-[10px] text-gray-400">
                      {new Date(
                        item.created_at,
                      ).toLocaleTimeString(
                        'pt-AO',
                        {
                          hour: '2-digit',
                          minute: '2-digit',
                        },
                      )}
                    </span>

                  </div>

                </div>
              )
            })
          ) : (
            <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl">
                💬
              </div>

              <h2 className="mt-5 text-xl font-black text-gray-950">
                Começa a conversa
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Envia uma mensagem para a
                agência. Podes perguntar
                sobre horários,
                disponibilidade, localização
                ou qualquer detalhe da
                experiência.
              </p>

            </div>
          )}

          <ChatScrollBottom
            dependency={messages}
          />

        </div>

      </div>

      {/* =================================================
          COMPOSER
      ================================================== */}

      <div className="shrink-0 border-t border-gray-100 bg-white px-4 sm:px-5">

        <div className="mx-auto max-w-3xl">

          <ChatComposer
            conversationId={
              conversationId
            }
            userId={userId}
          />

        </div>

      </div>

    </section>
  )
}