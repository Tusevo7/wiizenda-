
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

type Conversation = {
  id: string
  user_id: string
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

export default function AgencyMessagesPage() {
  const [userId, setUserId] = useState<string | null>(null)
  const [agencyId, setAgencyId] = useState<string | null>(null)
  const [conversations, setConversations] = useState<
    Conversation[]
  >([])
  const [experiences, setExperiences] = useState<
    Experience[]
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

      const { data: agency } = await supabase
        .from('agencies')
        .select('id, name')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!agency) {
        if (!cancelled) {
          setLoading(false)
        }

        return
      }

      if (!cancelled) {
        setAgencyId(agency.id)
      }

      const { data: conversationData } =
        await supabase
          .from('conversations')
          .select(`
            id,
            user_id,
            experience_id,
            customer_name,
            customer_phone,
            created_at
          `)
          .eq('agency_id', agency.id)
          .order('created_at', {
            ascending: false,
          })

      const conversationList =
        (conversationData ||
          []) as Conversation[]

      const conversationIds =
        conversationList.map(
          (conversation) => conversation.id,
        )

      const experienceIds = [
        ...new Set(
          conversationList
            .map(
              (conversation) =>
                conversation.experience_id,
            )
            .filter(Boolean),
        ),
      ] as string[]

      let experienceData: Experience[] = []

      if (experienceIds.length > 0) {
        const { data } = await supabase
          .from('experiences')
          .select('id, title, slug')
          .in('id', experienceIds)

        experienceData =
          (data || []) as Experience[]
      }

      let messageData: Message[] = []

      if (conversationIds.length > 0) {
        const { data } = await supabase
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

        messageData =
          (data || []) as Message[]
      }

      if (!cancelled) {
        setConversations(
          conversationList,
        )

        setExperiences(
          experienceData,
        )

        setMessages(messageData)

        setLoading(false)
      }

      const channel = supabase.channel(
        `agency-messages-history-${user.id}-${Date.now()}`,
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
            current.sort(
              (a, b) => {
                if (
                  a.id ===
                  newMessage.conversation_id
                ) {
                  return -1
                }

                if (
                  b.id ===
                  newMessage.conversation_id
                ) {
                  return 1
                }

                return 0
              },
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
          '[AgencyMessagesHistory] Realtime:',
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

  const experienceMap = useMemo(() => {
    return new Map(
      experiences.map((experience) => [
        experience.id,
        experience,
      ]),
    )
  }, [experiences])

  const lastMessageMap = useMemo(() => {
    const map = new Map<
      string,
      Message
    >()

    for (const message of messages) {
      const existing =
        map.get(message.conversation_id)

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

  const unreadMap = useMemo(() => {
    const map = new Map<
      string,
      number
    >()

    for (const message of messages) {
      if (
        message.sender_id !== userId &&
        !message.read
      ) {
        map.set(
          message.conversation_id,
          (map.get(
            message.conversation_id,
          ) ?? 0) + 1,
        )
      }
    }

    return map
  }, [messages, userId])

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

  if (!agencyId && !loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-2xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Acesso restrito
          </h1>

          <p className="mt-3 text-gray-500">
            Esta área é exclusiva para agências.
          </p>
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
              href="/agency"
              aria-label="Voltar ao painel da agência"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2"
            >
              <ArrowLeft
                size={20}
                aria-hidden="true"
              />
            </Link>

            <div>
              <h1 className="text-2xl font-black">
                Mensagens
              </h1>

              <p className="mt-1 text-sm text-gray-500">
                As tuas conversas com os clientes.
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
                  const experience =
                    conversation.experience_id
                      ? experienceMap.get(
                          conversation.experience_id,
                        )
                      : null

                  const latestMessage =
                    lastMessageMap.get(
                      conversation.id,
                    )

                  const unreadCount =
                    unreadMap.get(
                      conversation.id,
                    ) ?? 0

                  const hasUnread =
                    unreadCount > 0

                  return (
                    <Link
                      key={conversation.id}
                      href={`/agency/messages/${conversation.id}`}
                      className="group block rounded-3xl border border-gray-100 bg-white p-4 transition hover:border-orange-200 hover:shadow-sm"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-orange-50 text-orange-500">
                          <span className="text-lg font-black">
                            {conversation.customer_name
                              ?.charAt(0)
                              .toUpperCase() ||
                              'C'}
                          </span>

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
                              {conversation.customer_name ||
                                'Cliente'}
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
                              <MapPin
                                size={12}
                                aria-hidden="true"
                              />

                              <span className="truncate">
                                {experience.title}
                              </span>
                            </div>
                          )}

                          {!experience &&
                            conversation.customer_phone && (
                              <p className="mt-1 truncate text-xs text-gray-500">
                                {conversation.customer_phone}
                              </p>
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
                              : 'Começa uma conversa com o cliente'}
                          </p>
                        </div>

                        <ChevronRight
                          size={20}
                          aria-hidden="true"
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
                <MessageCircle
                  size={34}
                  aria-hidden="true"
                />
              </div>

              <h2 className="mt-6 text-xl font-black">
                Ainda não tens mensagens
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Quando um cliente falar com a tua
                agência, a conversa aparecerá aqui.
              </p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
