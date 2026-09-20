
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import AppShell from '@/app/components/app-shell'
import ChatRealtime from '@/app/components/chat-realtime'
import ChatComposer from '@/app/components/chat-composer'
import ChatScrollBottom from '@/app/components/chat-scroll-bottom'

type MessagesPageProps = {
  params: Promise<{
    id: string
  }>
}

export default async function MessagesPage({
  params,
}: MessagesPageProps) {
  const { id } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Inicia sessão para continuar
          </h1>

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
    .eq('id', id)
    .maybeSingle()

  if (conversationError) {
    console.error(
      'Erro ao carregar conversa:',
      conversationError,
    )
  }

  if (!conversation) {
    return (
      <AppShell>
        <main className="mx-auto max-w-xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Conversa não encontrada
          </h1>

          <p className="mt-3 text-gray-500">
            Esta conversa pode ter sido removida ou não
            tens acesso a ela.
          </p>

          <Link
            href="/explore"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white"
          >
            Explorar experiências
          </Link>
        </main>
      </AppShell>
    )
  }

  const agency = Array.isArray(conversation.agencies)
    ? conversation.agencies[0]
    : conversation.agencies

  const experience = Array.isArray(conversation.experiences)
    ? conversation.experiences[0]
    : conversation.experiences

  const currentUserId = user.id

  await supabase
    .from('messages')
    .update({
      read: true,
    })
    .eq('conversation_id', id)
    .neq('sender_id', user.id)
    .eq('read', false)

  const {
    data: messages,
    error: messagesError,
  } = await supabase
    .from('messages')
    .select(`
      id,
      sender_id,
      message,
      read,
      created_at
    `)
    .eq('conversation_id', id)
    .order('created_at', {
      ascending: true,
    })

  if (messagesError) {
    console.error(
      'Erro ao carregar mensagens:',
      messagesError,
    )
  }

  return (
    <AppShell>
      <main className="flex h-[calc(100vh-140px)] min-h-0 flex-col overflow-hidden bg-white">

        {/* HEADER */}

        <section className="shrink-0 border-b border-gray-100 bg-white">
          <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4 sm:px-6">

            <Link
              href="/bookings"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition hover:bg-gray-100"
            >
              <ArrowLeft size={20} />
            </Link>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
              {agency?.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={agency.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-black text-gray-400">
                  {agency?.name?.charAt(0).toUpperCase() || 'A'}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h1 className="truncate text-base font-black">
                {agency?.name || 'Agência'}
              </h1>

              <div className="flex items-center gap-1 text-xs text-gray-500">
                <MapPin size={12} />

                <span className="truncate">
                  {agency?.city ||
                    agency?.province ||
                    'Angola'}
                </span>
              </div>
            </div>

          </div>
        </section>

        {/* EXPERIÊNCIA */}

        {experience && (
          <section className="shrink-0 border-b border-gray-100 bg-gray-50">
            <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                  {experience.cover_image && (
                    <img
                      src={experience.cover_image}
                      alt={experience.title}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Experiência
                  </p>

                  <p className="truncate text-sm font-bold">
                    {experience.title}
                  </p>
                </div>

              </div>

            </div>
          </section>
        )}

        <ChatRealtime
          conversationId={id}
        />

        {/* ÁREA DO CHAT */}

        <section className="mx-auto flex min-h-0 w-full max-w-4xl flex-1 flex-col">

          {/* MENSAGENS */}

          <div
            data-chat-scroll
            className="relative min-h-0 flex-1 overflow-y-auto px-4 sm:px-6"
          >

            <div className="space-y-3 py-6">

              {messages && messages.length > 0 ? (
                messages.map((item) => {

                  const isMine =
                    item.sender_id === currentUserId

                  return (
                    <div
                      key={item.id}
                      className="w-full"
                    >

                      <div
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

                    </div>
                  )
                })
              ) : (
                <div className="flex min-h-[300px] flex-col items-center justify-center text-center">

                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-2xl">
                    💬
                  </div>

                  <h2 className="mt-5 text-xl font-black">
                    Começa a conversa
                  </h2>

                  <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                    Envia uma mensagem para a agência.
                    Podes perguntar sobre horários,
                    disponibilidade, localização ou
                    qualquer detalhe da experiência.
                  </p>

                </div>
              )}

              {/* IR PARA A ÚLTIMA MENSAGEM */}

              <ChatScrollBottom
                dependency={messages}
              />

            </div>

          </div>

          {/* CAIXA DE TEXTO FIXA */}

          <div className="shrink-0 border-t border-gray-100 bg-white px-4 py-3 sm:px-6">

            <ChatComposer
              conversationId={id}
              userId={user.id}
            />

          </div>

        </section>

      </main>
    </AppShell>
  )
}
