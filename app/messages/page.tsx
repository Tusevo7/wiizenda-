
'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ChevronRight,
  MapPin,
  MessageCircle,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import AppShell from '@/app/components/app-shell'

type Agency = {
  id: string
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
  agency_id: string
  experience_id: string | null
  updated_at: string
  agencies: Agency | Agency[] | null
  experiences: Experience | Experience[] | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  read: boolean
  created_at: string
}

export default function MessagesHistoryPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<
    Conversation[]
  >([])
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(
    () => createClient(),
    [],
  )

  useEffect(() => {
    let cancelled = false

    async function loadData() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        if (!cancelled) {
          setLoading(false)
        }

        return
      }

      if (!cancelled) {
        setUserId(user.id)
      }

      const {
        data: conversationData,
        error: conversationsError,
      } = await supabase
        .from('conversations')
        .select(`
          id,
          agency_id,
          experience_id,
          updated_at,
          agencies (
            id,
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
        .eq('user_id', user.id)
        .order('updated_at', {
          ascending: false,
        })

      if (conversationsError) {
        console.error(
          'Erro ao carregar conversas:',
          conversationsError,
        )
      }

      const loadedConversations =
        (conversationData || []) as Conversation[]

      const conversationIds =
        loadedConversations.map(
          (conversation) => conversation.id,
        )

      let loadedMessages: Message[] = []

      if (conversationIds.length > 0) {
        const {
          data: messageData,
          error: messagesError,
        } = await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            message,
            read,
            created_at
          `)
          .in(
            'conversation_id',
            conversationIds,
          )
          .order('created_at', {
            ascending: false,
          })

        if (messagesError) {
          console.error(
            'Erro ao carregar mensagens:',
            messagesError,
          )
        }

        loadedMessages =
          (messageData || []) as Message[]
      }

      if (!cancelled) {
        setConversations(
          loadedConversations,
        )

        setMessages(loadedMessages)

        setLoading(false)
      }

      const channel = supabase.channel(
        `messages-history-${user.id}-${Date.now()}`,
      )

      channel.on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage =
            payload.new as Message

          if (
            !conversationIds.includes(
              newMessage.conversation_id,
            )
          ) {
            return
          }

          setMessages((current) => {
            const exists = current.some(
              (message) =>
                message.id === newMessage.id,
            )

            if (exists) {
              return current
            }

            return [
              newMessage,
              ...current,
            ]
          })

          setConversations((current) =>
            current
              .map((conversation) =>
                conversation.id ===
                newMessage.conversation_id
                  ? {
                      ...conversation,
                      updated_at:
                        newMessage.created_at,
                    }
                  : conversation,
              )
              .sort(
                (a, b) =>
                  new Date(
                    b.updated_at,
                  ).getTime() -
                  new Date(
                    a.updated_at,
                  ).getTime(),
              ),
          )
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
          const updatedMessage =
            payload.new as Message

          if (
            !conversationIds.includes(
              updatedMessage.conversation_id,
            )
          ) {
            return
          }

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

      channel.subscribe((status) => {
        console.log(
          '[MessagesHistory] Realtime:',
          status,
        )
      })

      return () => {
        supabase.removeChannel(channel)
      }
    }

    let cleanup:
      | (() => void)
      | undefined

    loadData().then((result) => {
      if (typeof result === 'function') {
        cleanup = result
      }
    })

    return () => {
      cancelled = true

      if (cleanup) {
        cleanup()
      }
    }
  }, [supabase])

  const latestMessageByConversation =
    useMemo(() => {
      const map = new Map<
        string,
        Message
      >()

      for (const message of messages) {
        const existing =
          map.get(
            message.conversation_id,
          )

        if (
          !existing ||
          new Date(
            message.created_at,
          ).getTime() >
            new Date(
              existing.created_at,
            ).getTime()
        ) {
          map.set(
            message.conversation_id,
            message,
          )
        }
      }

      return map
    }, [messages])

  function formatMessageDate(
    date: string,
  ) {
    const messageDate = new Date(date)
    const now = new Date()

    if (
      messageDate.toDateString() ===
      now.toDateString()
    ) {
      return messageDate.toLocaleTimeString(
        'pt-AO',
        {
          hour: '2-digit',
          minute: '2-digit',
        },
      )
    }

    return messageDate.toLocaleDateString(
      'pt-AO',
      {
        day: '2-digit',
        month: '2-digit',
      },
    )
  }

  if (!userId && !loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-2xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Inicia sessão para ver as mensagens
          </h1>

          <p className="mt-3 text-gray-500">
            Entra na tua conta para aceder às
            conversas.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white"
          >
            Entrar
          </Link>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="min-h-[calc(100vh-140px)] bg-gray-50/50">
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-5">
            <Link
              href="/"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Link>

            <div>
              <h1 className="text-2xl font-black">
                Mensagens
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                As tuas conversas com as agências.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-3xl px-5 py-6">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-3xl border border-gray-100 bg-white"
                />
              ))}
            </div>
          ) : conversations.length > 0 ? (
            <div className="space-y-3">
              {conversations.map(
                (conversation) => {
                  const agency =
                    Array.isArray(
                      conversation.agencies,
                    )
                      ? conversation.agencies[0]
                      : conversation.agencies

                  const experience =
                    Array.isArray(
                      conversation.experiences,
                    )
                      ? conversation.experiences[0]
                      : conversation.experiences

                  const latestMessage =
                    latestMessageByConversation.get(
                      conversation.id,
                    )

                  const hasUnread =
                    latestMessage &&
                    latestMessage.sender_id !==
                      userId &&
                    !latestMessage.read

                  return (
                    <Link
                      key={conversation.id}
                      href={`/messages/${conversation.id}`}
                      className="group block rounded-3xl border border-gray-100 bg-white p-4 transition hover:border-orange-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                          {agency?.logo_url ? (
                            <img
                              src={
                                agency.logo_url
                              }
                              alt={
                                agency.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-lg font-black text-gray-400">
                              {agency?.name
                                ?.charAt(0)
                                .toUpperCase() ||
                                'A'}
                            </div>
                          )}

                          {hasUnread && (
                            <span className="absolute right-1 top-1 h-3 w-3 rounded-full border-2 border-white bg-orange-500" />
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-3">
                            <h2
                              className={`truncate text-base ${
                                hasUnread
                                  ? 'font-black'
                                  : 'font-bold'
                              }`}
                            >
                              {agency?.name ||
                                'Agência'}
                            </h2>

                            {latestMessage && (
                              <span className="shrink-0 text-[11px] text-gray-400">
                                {formatMessageDate(
                                  latestMessage.created_at,
                                )}
                              </span>
                            )}
                          </div>

                          {experience && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                              <MapPin size={12} />

                              <span className="truncate">
                                {experience.title}
                              </span>
                            </div>
                          )}

                          <p
                            className={`mt-2 truncate text-sm ${
                              hasUnread
                                ? 'font-bold text-gray-900'
                                : 'text-gray-500'
                            }`}
                          >
                            {latestMessage
                              ? latestMessage.message
                              : 'Começa uma conversa com a agência'}
                          </p>
                        </div>

                        <ChevronRight
                          size={20}
                          className="shrink-0 text-gray-300 transition group-hover:text-orange-500"
                        />
                      </div>
                    </Link>
                  )
                },
              )}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center rounded-3xl border border-gray-100 bg-white px-6 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <MessageCircle size={34} />
              </div>

              <h2 className="mt-6 text-xl font-black">
                Ainda não tens mensagens
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Quando falares com uma agência sobre
                uma experiência, a conversa aparecerá
                aqui.
              </p>

              <Link
                href="/explore"
                className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                Explorar experiências
              </Link>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
