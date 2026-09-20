'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  Search,
  SlidersHorizontal,
  UserRound,
  ChevronRight,
  MessageCircle,
  X,
} from 'lucide-react'

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

type Conversation = {
  id: string
  user_id: string
  experience_id: string | null
  customer_name: string | null
  customer_phone: string | null
  created_at: string
  experience: Experience | null
  lastMessage: Message | null
  unreadCount: number
}

type Props = {
  conversations: Conversation[]
  currentUserId: string
}

function formatMessageTime(dateString: string) {
  const date = new Date(dateString)
  const now = new Date()

  const isToday = date.toDateString() === now.toDateString()

  if (isToday) {
    return date.toLocaleTimeString('pt-AO', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)

  if (date.toDateString() === yesterday.toDateString()) {
    return 'Ontem'
  }

  return date.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
  })
}

export default function AgencyMessagesList({
  conversations,
  currentUserId,
}: Props) {
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const filteredConversations = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()

    return conversations.filter((conversation) => {
      const matchesSearch =
        !normalizedSearch ||
        conversation.customer_name
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        conversation.customer_phone
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        conversation.experience?.title
          ?.toLowerCase()
          .includes(normalizedSearch) ||
        conversation.lastMessage?.message
          ?.toLowerCase()
          .includes(normalizedSearch)

      const matchesFilter =
        filter === 'all' || conversation.unreadCount > 0

      return matchesSearch && matchesFilter
    })
  }, [conversations, search, filter])

  return (
    <section className="flex flex-1 flex-col">
      {/* PESQUISA */}
      <div className="border-b border-gray-100 px-4 py-4 sm:px-7">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
            />

            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Pesquisar cliente ou conversa..."
              className="h-12 w-full rounded-2xl border border-gray-200 bg-gray-50 pl-11 pr-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-300 focus:bg-white focus:ring-4 focus:ring-orange-500/5"
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-700"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() =>
              setFilter((current) =>
                current === 'all' ? 'unread' : 'all',
              )
            }
            className={`flex h-12 shrink-0 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition ${
              filter === 'unread'
                ? 'border-orange-200 bg-orange-50 text-orange-600'
                : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SlidersHorizontal size={17} />

            <span className="hidden sm:inline">
              {filter === 'unread' ? 'Não lidas' : 'Todas'}
            </span>
          </button>
        </div>

        {(search || filter === 'unread') && (
          <div className="mt-3 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filteredConversations.length}{' '}
              {filteredConversations.length === 1
                ? 'conversa encontrada'
                : 'conversas encontradas'}
            </p>

            <button
              type="button"
              onClick={() => {
                setSearch('')
                setFilter('all')
              }}
              className="text-xs font-medium text-orange-500 hover:text-orange-600"
            >
              Limpar filtros
            </button>
          </div>
        )}
      </div>

      {/* LISTA */}
      <div className="flex-1">
        {conversations.length === 0 ? (
          <EmptyState />
        ) : filteredConversations.length === 0 ? (
          <NoResults />
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredConversations.map((conversation) => {
              const lastMessage = conversation.lastMessage

              const isLastMessageMine =
                lastMessage?.sender_id === currentUserId

              return (
                <Link
                  key={conversation.id}
                  href={`/agency/messages/${conversation.id}`}
                  className={`group flex gap-3 px-4 py-4 transition hover:bg-gray-50 sm:px-7 ${
                    conversation.unreadCount > 0
                      ? 'bg-orange-50/30'
                      : ''
                  }`}
                >
                  {/* AVATAR */}
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full ${
                        conversation.unreadCount > 0
                          ? 'bg-orange-100 text-orange-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      <UserRound size={22} />
                    </div>

                    {conversation.unreadCount > 0 && (
                      <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-orange-500 px-1 text-[10px] font-bold text-white ring-2 ring-white">
                        {conversation.unreadCount > 9
                          ? '9+'
                          : conversation.unreadCount}
                      </span>
                    )}
                  </div>

                  {/* CONTEÚDO */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h2
                          className={`truncate text-sm ${
                            conversation.unreadCount > 0
                              ? 'font-bold text-gray-950'
                              : 'font-semibold text-gray-900'
                          }`}
                        >
                          {conversation.customer_name || 'Cliente'}
                        </h2>

                        {conversation.customer_phone && (
                          <p className="mt-0.5 truncate text-xs text-gray-400">
                            {conversation.customer_phone}
                          </p>
                        )}
                      </div>

                      {lastMessage && (
                        <span
                          className={`shrink-0 text-[11px] ${
                            conversation.unreadCount > 0
                              ? 'font-semibold text-orange-500'
                              : 'text-gray-400'
                          }`}
                        >
                          {formatMessageTime(lastMessage.created_at)}
                        </span>
                      )}
                    </div>

                    {conversation.experience && (
                      <div className="mt-1.5 flex min-w-0 items-center gap-1.5">
                        <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-orange-500" />

                        <p className="truncate text-xs font-medium text-orange-500">
                          {conversation.experience.title}
                        </p>
                      </div>
                    )}

                    <div className="mt-1.5 flex items-center gap-2">
                      <p
                        className={`min-w-0 flex-1 truncate text-sm ${
                          conversation.unreadCount > 0
                            ? 'font-medium text-gray-800'
                            : 'text-gray-500'
                        }`}
                      >
                        {lastMessage ? (
                          <>
                            {isLastMessageMine && (
                              <span className="text-gray-400">
                                Tu:{' '}
                              </span>
                            )}

                            {lastMessage.message}
                          </>
                        ) : (
                          'Nenhuma mensagem ainda'
                        )}
                      </p>

                      <ChevronRight
                        size={17}
                        className="shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-400"
                      />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}

function EmptyState() {
  return (
    <div className="flex min-h-[55vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-3xl bg-orange-50 text-orange-500">
        <MessageCircle size={32} strokeWidth={1.7} />
      </div>

      <h2 className="mt-6 text-lg font-bold text-gray-950">
        A tua caixa de entrada está vazia
      </h2>

      <p className="mt-2 max-w-md text-sm leading-6 text-gray-500">
        Quando um cliente entrar em contacto através de uma
        experiência, a conversa aparecerá aqui.
      </p>
    </div>
  )
}

function NoResults() {
  return (
    <div className="flex min-h-[45vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 text-gray-400">
        <Search size={26} />
      </div>

      <h2 className="mt-5 text-base font-semibold text-gray-900">
        Nenhuma conversa encontrada
      </h2>

      <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
        Tenta pesquisar por outro nome, número ou experiência.
      </p>
    </div>
  )
}