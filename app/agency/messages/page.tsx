'use client'

import Link from 'next/link'
import {
  ChevronRight,
  MapPin,
  MessageCircle,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'
import AppShell from '@/app/components/app-shell'
import AgencyMessagesChatPanel from '@/app/components/agency-messages-chat-panel'

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

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const supabase = useMemo(
    () => createClient(),
    [],
  )

  useEffect(() => {
    let cancelled = false
    let channel: ReturnType<typeof supabase.channel> | null =
      null

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
            agency_id,
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
        (conversationData || []) as Conversation[]

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
        setConversations(conversationList)
        setExperiences(experienceData)
        setMessages(messageData)
        setLoading(false)
      }

      /*
       * REALTIME
       */
      channel = supabase.channel(
        `agency-messages-${agency.id}`,
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

      channel.subscribe()
    }

    loadData()

    return () => {
      cancelled = true

      if (channel) {
        supabase.removeChannel(channel)
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
    const map = new Map<string, Message>()

    for (const message of messages) {
      const existing =
        map.get(message.conversation_id)

      if (
        !existing ||
        new Date(message.created_at).getTime() >
          new Date(existing.created_at).getTime()
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
    const map = new Map<string, number>()

    for (const message of messages) {
      if (
        message.sender_id !== userId &&
        !message.read
      ) {
        map.set(
          message.conversation_id,
          (map.get(message.conversation_id) ?? 0) + 1,
        )
      }
    }

    return map
  }, [messages, userId])

  const filteredConversations = useMemo(() => {
    const value = search.trim().toLowerCase()

    if (!value) {
      return conversations
    }

    return conversations.filter(
      (conversation) => {
        const experience =
          conversation.experience_id
            ? experienceMap.get(
                conversation.experience_id,
              )
            : null

        return (
          conversation.customer_name
            ?.toLowerCase()
            .includes(value) ||
          conversation.customer_phone
            ?.toLowerCase()
            .includes(value) ||
          experience?.title
            .toLowerCase()
            .includes(value)
        )
      },
    )
  }, [
    conversations,
    experienceMap,
    search,
  ])

  function formatMessageDate(date: string) {
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

 function openConversation(
  conversationId: string,
) {
  setSelectedConversationId(
    conversationId,
  )

  // Marca imediatamente as mensagens
  // como lidas na interface.
  setMessages((current) =>
    current.map((message) => {
      if (
        message.conversation_id ===
          conversationId &&
        message.sender_id !== userId
      ) {
        return {
          ...message,
          read: true,
        }
      }

      return message
    }),
  )
}

  function closeConversation() {
    setSelectedConversationId(null)
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
      <main className="h-[calc(100vh-140px)] min-h-[620px] bg-gray-50/50">
        <section className="mx-auto flex h-full max-w-6xl overflow-hidden border-x border-gray-100 bg-white">
          {/* =====================================================
              LISTA DE CONVERSAS
          ====================================================== */}
          <aside
            className={`
              flex w-full shrink-0 flex-col border-r border-gray-100 bg-white
              md:w-[360px]
              lg:w-[390px]
              ${
                selectedConversationId
                  ? 'hidden md:flex'
                  : 'flex'
              }
            `}
          >
            {/* HEADER */}
            <div className="border-b border-gray-100 px-5 py-5">
              <div className="flex items-center gap-3">
                <Link
                  href="/agency"
                  aria-label="Voltar ao painel"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
                >
                  ←
                </Link>

                <div className="min-w-0 flex-1">
                  <h1 className="text-xl font-black">
                    Mensagens
                  </h1>

                  <p className="mt-0.5 text-xs text-gray-500">
                    Conversas com os teus clientes
                  </p>
                </div>
              </div>

              {/* PESQUISA */}
              <div className="relative mt-4">
                <Search
                  size={17}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  placeholder="Pesquisar conversa..."
                  className="h-11 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:bg-white"
                />
              </div>
            </div>

            {/* CONVERSAS */}
            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <div className="space-y-2 p-4">
                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="h-20 animate-pulse rounded-2xl bg-gray-100"
                      />
                    ),
                  )}
                </div>
              ) : filteredConversations.length >
                0 ? (
                filteredConversations.map(
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
                      <button
                        key={conversation.id}
                        type="button"
                        onClick={() =>
                          openConversation(
                            conversation.id,
                          )
                        }
                        className={`
                          group flex w-full items-center gap-3 border-b border-gray-100 px-4 py-4 text-left transition
                          hover:bg-gray-50
                          ${
                            selectedConversationId ===
                            conversation.id
                              ? 'bg-orange-50/60'
                              : 'bg-white'
                          }
                        `}
                      >
                        {/* AVATAR */}
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-100 text-orange-600">
                          <span className="text-base font-black">
                            {conversation.customer_name
                              ?.charAt(0)
                              .toUpperCase() ||
                              'C'}
                          </span>

                          {hasUnread && (
                            <span className="absolute right-0 top-0 h-3.5 w-3.5 rounded-full border-2 border-white bg-orange-500" />
                          )}
                        </div>

                        {/* INFO */}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <h2
                              className={`truncate text-sm ${
                                hasUnread
                                  ? 'font-black'
                                  : 'font-bold'
                              }`}
                            >
                              {conversation.customer_name ||
                                'Cliente'}
                            </h2>

                            {latestMessage && (
                              <span className="shrink-0 text-[10px] text-gray-400">
                                {formatMessageDate(
                                  latestMessage.created_at,
                                )}
                              </span>
                            )}
                          </div>

                          {experience && (
                            <div className="mt-1 flex min-w-0 items-center gap-1 text-[11px] text-gray-500">
                              <MapPin
                                size={11}
                                className="shrink-0"
                              />

                              <span className="truncate">
                                {experience.title}
                              </span>
                            </div>
                          )}

                          <p
                            className={`mt-1 truncate text-xs ${
                              hasUnread
                                ? 'font-bold text-gray-900'
                                : 'text-gray-500'
                            }`}
                          >
                            {latestMessage
                              ? latestMessage.message
                              : 'Nova conversa'}
                          </p>
                        </div>

                        {hasUnread && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-orange-500 px-1.5 text-[10px] font-black text-white">
                            {unreadCount > 9
                              ? '9+'
                              : unreadCount}
                          </span>
                        )}

                        <ChevronRight
                          size={17}
                          className="shrink-0 text-gray-300"
                        />
                      </button>
                    )
                  },
                )
              ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center px-6 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                    <MessageCircle size={28} />
                  </div>

                  <h2 className="mt-5 text-lg font-black">
                    {search
                      ? 'Nenhuma conversa encontrada'
                      : 'Ainda não tens mensagens'}
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    {search
                      ? 'Experimenta pesquisar por outro nome ou experiência.'
                      : 'Quando um cliente falar com a tua agência, a conversa aparecerá aqui.'}
                  </p>
                </div>
              )}
            </div>
          </aside>

          {/* =====================================================
              CHAT LATERAL
          ====================================================== */}
          <section
            className={`
              min-w-0 flex-1
              ${
                selectedConversationId
                  ? 'flex'
                  : 'hidden md:flex'
              }
            `}
          >
            {selectedConversationId &&
            userId &&
            agencyId ? (
              <AgencyMessagesChatPanel
                conversationId={
                  selectedConversationId
                }
                userId={userId}
                agencyId={agencyId}
                onClose={
                  closeConversation
                }
              />
            ) : (
              <div className="hidden flex-1 flex-col items-center justify-center md:flex">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <MessageCircle size={34} />
                </div>

                <h2 className="mt-5 text-xl font-black">
                  As tuas mensagens
                </h2>

                <p className="mt-2 text-sm text-gray-500">
                  Seleciona uma conversa para
                  começar.
                </p>
              </div>
            )}
          </section>
        </section>
      </main>
    </AppShell>
  )
}