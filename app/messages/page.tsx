'use client'

import {
  MessageCircle,
  Search,
  MapPin,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

import AppShell from '@/app/components/app-shell'
import MessagesChatPanel from '@/app/components/messages-chat-panel'

type Conversation = {
  id: string
  user_id: string
  agency_id: string
  experience_id: string | null
  created_at: string
  agency: {
    id: string
    name: string
    logo_url: string | null
    city: string | null
    province: string | null
  } | null
  experience: {
    id: string
    title: string
    cover_image: string | null
  } | null
}

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  read: boolean
  created_at: string
}

export default function MessagesPage() {
  const supabase = useMemo(
    () => createClient(),
    [],
  )

  const [conversations, setConversations] =
    useState<Conversation[]>([])

  const [messages, setMessages] =
    useState<Message[]>([])

  const [userId, setUserId] =
    useState<string | null>(null)

  const [selectedConversationId, setSelectedConversationId] =
    useState<string | null>(null)

  const [search, setSearch] = useState('')

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    let mounted = true

    async function loadMessages() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!mounted) return

      if (!user) {
        setLoading(false)
        return
      }

      setUserId(user.id)

      const {
        data: conversationData,
        error: conversationError,
      } = await supabase
        .from('conversations')
        .select(`
          id,
          user_id,
          agency_id,
          experience_id,
          created_at,
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
        .order('created_at', {
          ascending: false,
        })

      if (conversationError) {
        console.error(
          'Erro ao carregar conversas:',
          conversationError,
        )

        setLoading(false)
        return
      }

      const formattedConversations =
        (conversationData || []).map((item: any) => ({
          id: item.id,
          user_id: item.user_id,
          agency_id: item.agency_id,
          experience_id: item.experience_id,
          created_at: item.created_at,

          agency: Array.isArray(item.agencies)
            ? item.agencies[0] || null
            : item.agencies || null,

          experience: Array.isArray(item.experiences)
            ? item.experiences[0] || null
            : item.experiences || null,
        }))

      if (!mounted) return

      setConversations(formattedConversations)

      const conversationIds =
        formattedConversations.map(
          (conversation) => conversation.id,
        )

      if (conversationIds.length > 0) {
        const {
          data: messageData,
          error: messageError,
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
            ascending: true,
          })

        if (messageError) {
          console.error(
            'Erro ao carregar mensagens:',
            messageError,
          )
        }

        if (mounted) {
          setMessages(messageData || [])
        }
      }

      setLoading(false)
    }

    loadMessages()

    return () => {
      mounted = false
    }
  }, [supabase])

  /*
   * =====================================================
   * RECUPERAR CONVERSA DA URL
   * =====================================================
   */

 

  /*
   * =====================================================
   * REALTIME
   * =====================================================
   */

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel(
        `messages-history-${userId}`,
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
        },
        (payload) => {
          const newMessage =
            payload.new as Message

          const belongsToConversation =
            conversations.some(
              (conversation) =>
                conversation.id ===
                newMessage.conversation_id,
            )

          if (!belongsToConversation) {
            return
          }

          setMessages((current) => {
            const exists = current.some(
              (message) =>
                message.id ===
                newMessage.id,
            )

            if (exists) {
              return current
            }

            return [
              ...current,
              newMessage,
            ]
          })
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
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
    supabase,
    userId,
    conversations,
  ])

  /*
   * =====================================================
   * ÚLTIMA MENSAGEM DE CADA CONVERSA
   * =====================================================
   */

  function getLastMessage(
    conversationId: string,
  ) {
    const conversationMessages =
      messages.filter(
        (message) =>
          message.conversation_id ===
          conversationId,
      )

    if (
      conversationMessages.length === 0
    ) {
      return null
    }

    return conversationMessages[
      conversationMessages.length - 1
    ]
  }

  /*
   * =====================================================
   * CONTADOR DE NÃO LIDAS
   * =====================================================
   */

  function getUnreadCount(
    conversationId: string,
  ) {
    return messages.filter(
      (message) =>
        message.conversation_id ===
          conversationId &&
        message.sender_id !== userId &&
        !message.read,
    ).length
  }

  /*
   * =====================================================
   * FILTRO
   * =====================================================
   */

  const filteredConversations =
    conversations.filter(
      (conversation) => {
        const query =
          search.trim().toLowerCase()

        if (!query) return true

        const agencyName =
          conversation.agency?.name
            ?.toLowerCase() || ''

        const experienceTitle =
          conversation.experience?.title
            ?.toLowerCase() || ''

        const lastMessage =
          getLastMessage(
            conversation.id,
          )

        const messageText =
          lastMessage?.message
            ?.toLowerCase() || ''

        return (
          agencyName.includes(query) ||
          experienceTitle.includes(query) ||
          messageText.includes(query)
        )
      },
    )

  /*
   * =====================================================
   * ABRIR CONVERSA
   * =====================================================
   */
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

  /*
   * =====================================================
   * FECHAR CHAT
   * =====================================================
   */

function closeConversation() {
  setSelectedConversationId(null)
}
  /*
   * =====================================================
   * SEM LOGIN
   * =====================================================
   */

  if (!loading && !userId) {
    return (
      <AppShell>
        <main className="flex min-h-[calc(100vh-140px)] items-center justify-center px-5">
          <div className="max-w-md text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50">
              <MessageCircle
                size={28}
                className="text-orange-500"
              />
            </div>

            <h1 className="mt-5 text-2xl font-black text-gray-950">
              Inicia sessão
            </h1>

            <p className="mt-2 text-sm leading-6 text-gray-500">
              Inicia sessão para veres e
              responderes às tuas conversas.
            </p>
          </div>
        </main>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <main className="h-[calc(100vh-140px)] min-h-0 overflow-hidden bg-white">

        <div className="mx-auto flex h-full w-full max-w-[1400px] overflow-hidden border-x border-gray-100">

          {/* =================================================
              LISTA DE CONVERSAS
          ================================================== */}

          <aside
            className={`
              flex h-full w-full shrink-0 flex-col bg-white
              md:w-[350px]
              lg:w-[390px]
              md:border-r
              md:border-gray-100
              ${
                selectedConversationId
                  ? 'hidden md:flex'
                  : 'flex'
              }
            `}
          >

            {/* HEADER */}

            <div className="shrink-0 border-b border-gray-100 px-5 py-5">

              <div className="flex items-center justify-between">

                <div>
                  <h1 className="text-2xl font-black tracking-tight text-gray-950">
                    Mensagens
                  </h1>

                  <p className="mt-1 text-xs text-gray-500">
                    As tuas conversas
                  </p>
                </div>

                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                  <MessageCircle
                    size={19}
                  />
                </div>

              </div>

              {/* PESQUISA */}

              <div className="mt-5 flex items-center gap-3 rounded-xl bg-gray-50 px-4 py-3">

                <Search
                  size={17}
                  className="shrink-0 text-gray-400"
                />

                <input
                  type="text"
                  value={search}
                  onChange={(event) =>
                    setSearch(
                      event.target.value,
                    )
                  }
                  placeholder="Pesquisar conversas"
                  className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-gray-400"
                />

              </div>

            </div>

            {/* LISTA */}

            <div className="min-h-0 flex-1 overflow-y-auto">

              {loading ? (
                <div className="space-y-1 p-3">

                  {[1, 2, 3, 4].map(
                    (item) => (
                      <div
                        key={item}
                        className="flex animate-pulse gap-3 rounded-2xl p-3"
                      >
                        <div className="h-12 w-12 shrink-0 rounded-full bg-gray-100" />

                        <div className="min-w-0 flex-1 space-y-2 pt-1">
                          <div className="h-3 w-32 rounded bg-gray-100" />
                          <div className="h-3 w-48 rounded bg-gray-100" />
                        </div>
                      </div>
                    ),
                  )}

                </div>
              ) : filteredConversations.length > 0 ? (
                <div className="p-2">

                  {filteredConversations.map(
                    (conversation) => {
                      const lastMessage =
                        getLastMessage(
                          conversation.id,
                        )

                      const unreadCount =
                        getUnreadCount(
                          conversation.id,
                        )

                      const isSelected =
                        selectedConversationId ===
                        conversation.id

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
                            flex w-full items-center gap-3 rounded-2xl p-3 text-left transition
                            ${
                              isSelected
                                ? 'bg-orange-50'
                                : 'hover:bg-gray-50'
                            }
                          `}
                        >

                          {/* LOGO */}

                          <div className="relative h-13 w-13 shrink-0">

                            <div className="flex h-13 w-13 items-center justify-center overflow-hidden rounded-full bg-gray-100">

                              {conversation.agency?.logo_url ? (
                                <img
                                  src={
                                    conversation
                                      .agency
                                      .logo_url
                                  }
                                  alt={
                                    conversation
                                      .agency
                                      .name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <span className="text-lg font-black text-gray-400">
                                  {conversation.agency?.name
                                    ?.charAt(
                                      0,
                                    )
                                    .toUpperCase() ||
                                    'A'}
                                </span>
                              )}

                            </div>

                            {unreadCount >
                              0 && (
                              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[9px] font-black text-white ring-2 ring-white">
                                {unreadCount >
                                9
                                  ? '9+'
                                  : unreadCount}
                              </span>
                            )}

                          </div>

                          {/* TEXTO */}

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center justify-between gap-2">

                              <h2
                                className={`
                                  truncate text-sm
                                  ${
                                    unreadCount >
                                    0
                                      ? 'font-black text-gray-950'
                                      : 'font-bold text-gray-800'
                                  }
                                `}
                              >
                                {conversation
                                  .agency
                                  ?.name ||
                                  'Agência'}
                              </h2>

                              {lastMessage && (
                                <span className="shrink-0 text-[10px] text-gray-400">
                                  {new Date(
                                    lastMessage.created_at,
                                  ).toLocaleTimeString(
                                    'pt-AO',
                                    {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                    },
                                  )}
                                </span>
                              )}

                            </div>

                            <div className="mt-1 flex items-center gap-1">

                              {conversation
                                .experience && (
                                <span className="max-w-[45%] truncate text-[10px] font-semibold text-orange-500">
                                  {
                                    conversation
                                      .experience
                                      .title
                                  }
                                </span>
                              )}

                            </div>

                            <p
                              className={`
                                mt-1 truncate text-xs
                                ${
                                  unreadCount >
                                  0
                                    ? 'font-semibold text-gray-700'
                                    : 'text-gray-500'
                                }
                              `}
                            >
                              {lastMessage
                                ? lastMessage.message
                                : 'Ainda não existem mensagens'}
                            </p>

                          </div>

                        </button>
                      )
                    },
                  )}

                </div>
              ) : (
                <div className="flex min-h-[400px] flex-col items-center justify-center px-8 text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                    <MessageCircle
                      size={27}
                      className="text-gray-300"
                    />
                  </div>

                  <h2 className="mt-5 text-lg font-black text-gray-900">
                    {search
                      ? 'Nenhuma conversa encontrada'
                      : 'Ainda não tens conversas'}
                  </h2>

                  <p className="mt-2 max-w-xs text-sm leading-6 text-gray-500">
                    {search
                      ? 'Tenta pesquisar por outro nome ou experiência.'
                      : 'Quando entrares em contacto com uma agência, as tuas conversas aparecerão aqui.'}
                  </p>

                </div>
              )}

            </div>

          </aside>

          {/* =================================================
              CHAT — DESKTOP
          ================================================== */}

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
            userId ? (
              <MessagesChatPanel
                conversationId={
                  selectedConversationId
                }
                userId={userId}
                onClose={
                  closeConversation
                }
              />
            ) : (
              <div className="hidden h-full flex-1 flex-col items-center justify-center bg-gray-50 md:flex">

                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white shadow-sm">
                  <MessageCircle
                    size={32}
                    className="text-gray-300"
                  />
                </div>

                <h2 className="mt-6 text-xl font-black text-gray-900">
                  As tuas mensagens
                </h2>

                <p className="mt-2 max-w-sm text-center text-sm leading-6 text-gray-500">
                  Seleciona uma conversa para
                  começares a falar com uma agência.
                </p>

              </div>
            )}

          </section>

        </div>

      </main>
    </AppShell>
  )
}