
import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { ArrowLeft, User } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import AgencyChatComposer from '@/app/components/agency-chat-composer'
import ChatRealtime from '@/app/components/chat-realtime'
import ChatScrollBottom from '@/app/components/chat-scroll-bottom'

type Message = {
  id: string
  conversation_id: string
  sender_id: string
  message: string
  created_at: string
}

export default async function AgencyMessagePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select(`
      id,
      name,
      owner_id
    `)
    .eq('owner_id', user.id)
    .single()

  if (!agency) {
    redirect('/agency')
  }

  const {
    data: conversation,
    error: conversationError,
  } = await supabase
    .from('conversations')
    .select(`
      id,
      user_id,
      agency_id,
      experience_id,
      customer_name,
      customer_phone
    `)
    .eq('id', id)
    .eq('agency_id', agency.id)
    .single()

  if (conversationError || !conversation) {
    notFound()
  }

  const { data: experience } = conversation.experience_id
    ? await supabase
        .from('experiences')
        .select('id, title, slug')
        .eq('id', conversation.experience_id)
        .single()
    : { data: null }

  await supabase
    .from('messages')
    .update({
      read: true,
    })
    .eq('conversation_id', conversation.id)
    .neq('sender_id', user.id)
    .eq('read', false)

  const {
    data: messages,
    error: messagesError,
  } = await supabase
    .from('messages')
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      created_at
    `)
    .eq('conversation_id', conversation.id)
    .order('created_at', {
      ascending: true,
    })

  if (messagesError) {
    console.error(messagesError)
  }

  const messageList: Message[] = messages ?? []

  const agencyId = agency.owner_id
  const clientId = conversation.user_id

  return (
    <main className="flex h-screen min-h-0 flex-col overflow-hidden bg-white">

      <ChatRealtime
        conversationId={conversation.id}
      />

      {/* HEADER */}

      <header className="shrink-0 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center gap-3 px-4">

          <Link
            href="/agency/messages"
            aria-label="Voltar para mensagens"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-500"
          >
            <ArrowLeft
              size={20}
              aria-hidden="true"
            />
          </Link>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-600">
            <User
              size={19}
              aria-hidden="true"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-gray-900">
              {conversation.customer_name || 'Cliente'}
            </p>

            {experience ? (
              <Link
                href={`/experience/${experience.slug}`}
                className="block truncate text-xs text-gray-500 hover:text-orange-500"
              >
                {experience.title}
              </Link>
            ) : conversation.customer_phone ? (
              <p className="truncate text-xs text-gray-500">
                {conversation.customer_phone}
              </p>
            ) : (
              <p className="text-xs text-gray-500">
                Cliente
              </p>
            )}
          </div>

        </div>
      </header>

      {/* CHAT */}

      <div className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">

        {/* ÁREA DAS MENSAGENS */}

        <div
          data-chat-scroll
          className="relative min-h-0 flex-1 overflow-y-auto px-4"
        >

          <div className="space-y-3 py-6">

            {messageList.length === 0 ? (
              <div className="flex min-h-[50vh] items-center justify-center">

                <div className="max-w-sm text-center">

                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gray-100 text-gray-500">
                    <User
                      size={24}
                      aria-hidden="true"
                    />
                  </div>

                  <h2 className="text-base font-semibold text-gray-900">
                    Nenhuma mensagem ainda
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Responde ao cliente quando ele iniciar a conversa.
                  </p>

                </div>

              </div>
            ) : (
              messageList.map((item) => {

                const isMine =
                  item.sender_id === agencyId

                const isClientMessage =
                  item.sender_id === clientId

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
                            : isClientMessage
                              ? 'rounded-bl-md border border-gray-200 bg-gray-100 text-gray-900'
                              : 'rounded-2xl border border-red-200 bg-red-50 text-red-700'
                        }`}
                      >
                        <p className="whitespace-pre-wrap break-words text-sm leading-6">
                          {item.message}
                        </p>
                      </div>

                      {/* HORA */}

                      <span
                        className={`mt-1 px-1 text-[10px] text-gray-400 ${
                          isMine
                            ? 'text-right'
                            : 'text-left'
                        }`}
                      >
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
            )}

            {/* IR PARA A ÚLTIMA MENSAGEM */}

            <ChatScrollBottom
              dependency={messageList}
            />

          </div>

        </div>

        {/* CAIXA DE TEXTO FIXA */}

        <div className="shrink-0 border-t border-gray-100 bg-white/95 px-4 py-3 backdrop-blur">

          <AgencyChatComposer
            conversationId={conversation.id}
            userId={user.id}
          />

        </div>

      </div>

    </main>
  )
}
