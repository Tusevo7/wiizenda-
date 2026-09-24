'use client'

import { FormEvent, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  ArrowUp,
  BookOpen,
  History,
  Loader2,
  Map,
  MapPin,
  Mic,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react'

type Experience = {
  id: string
  title: string
  slug: string
  location: string | null
  city: string | null
  province: string | null
  cover_image: string | null
}

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  experiences?: Experience[]
}

type SobaStreamEvent =
  | {
      type: 'text'
      content: string
    }
  | {
      type: 'experiences'
      experiences: Experience[]
    }

const suggestions = [
  {
    label: 'Explorar Angola',
    text: 'Quero descobrir lugares incríveis em Angola.',
    icon: Map,
  },
  {
    label: 'Cultura angolana',
    text: 'Fala-me sobre a cultura angolana.',
    icon: BookOpen,
  },
  {
    label: 'Gastronomia',
    text: 'Quais são os pratos tradicionais de Angola?',
    icon: Utensils,
  },
  {
    label: 'História',
    text: 'Conta-me uma história interessante de Angola.',
    icon: History,
  },
]

function ExperienceCard({
  experience,
}: {
  experience: Experience
}) {
  return (
    <div className="mt-4 w-full max-w-[430px] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md">
      <Link href={`/experience/${experience.slug}`}>
        <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
          {experience.cover_image ? (
            <img
              src={experience.cover_image}
              alt={experience.title}
              loading="lazy"
              decoding="async"
              className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gray-100">
              <Map
                size={28}
                className="text-gray-300"
              />
            </div>
          )}

          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/55 to-transparent" />

          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="truncate text-base font-bold text-white drop-shadow">
              {experience.title}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-start gap-2">
            <MapPin
              size={15}
              className="mt-0.5 shrink-0 text-[#FF5A1F]"
            />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-gray-800">
                {experience.location ||
                  experience.city ||
                  'Angola'}
              </p>

              {(experience.city ||
                experience.province) && (
                <p className="mt-0.5 text-xs text-gray-400">
                  {[
                    experience.city,
                    experience.province,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
            <span className="text-xs font-medium text-gray-400">
              Experiência Wizenda
            </span>

            <span className="text-xs font-semibold text-[#FF5A1F]">
              Ver experiência →
            </span>
          </div>
        </div>
      </Link>
    </div>
  )
}

export default function SobaPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const textareaRef =
    useRef<HTMLTextAreaElement | null>(null)

  const messagesEndRef =
    useRef<HTMLDivElement | null>(null)

  const messagesContainerRef =
    useRef<HTMLDivElement | null>(null)

  const scrollFrameRef =
    useRef<number | null>(null)

  const shouldAutoScrollRef =
    useRef(true)

  const hasMessages = messages.length > 0

  /*
   * Scroll inteligente.
   *
   * Não usamos scrollIntoView com "smooth" durante o streaming.
   * Isso criava várias animações simultâneas e fazia o scroll travar.
   */
  function scrollToBottom(force = false) {
    if (!force && !shouldAutoScrollRef.current) {
      return
    }

    if (scrollFrameRef.current !== null) {
      cancelAnimationFrame(
        scrollFrameRef.current,
      )
    }

    scrollFrameRef.current =
      requestAnimationFrame(() => {
        const container =
          messagesContainerRef.current

        if (container) {
          container.scrollTo({
            top: container.scrollHeight,
            behavior: 'auto',
          })
        }

        scrollFrameRef.current = null
      })
  }

  /*
   * Detecta se o utilizador está perto do fundo.
   * Se ele subir para ler uma mensagem antiga,
   * a Soba deixa de puxar o scroll automaticamente.
   */
  function handleMessagesScroll() {
    const container =
      messagesContainerRef.current

    if (!container) return

    const distanceFromBottom =
      container.scrollHeight -
      container.scrollTop -
      container.clientHeight

    shouldAutoScrollRef.current =
      distanceFromBottom < 180
  }

  useEffect(() => {
    return () => {
      if (scrollFrameRef.current !== null) {
        cancelAnimationFrame(
          scrollFrameRef.current,
        )
      }
    }
  }, [])

  useEffect(() => {
    if (hasMessages && loading) {
      scrollToBottom()
    }
  }, [loading])

  function resizeTextarea() {
    const textarea = textareaRef.current

    if (!textarea) return

    textarea.style.height = 'auto'

    textarea.style.height = `${Math.min(
      textarea.scrollHeight,
      140,
    )}px`
  }

  async function sendMessage(
    event?: FormEvent,
    customMessage?: string,
  ) {
    event?.preventDefault()

    const text = (
      customMessage ?? input
    ).trim()

    if (!text || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const previousMessages = messages

    const assistantMessageId =
      crypto.randomUUID()

    /*
     * Quando o utilizador envia uma nova mensagem,
     * voltamos automaticamente para o fundo.
     */
    shouldAutoScrollRef.current = true

    setMessages((current) => [
      ...current,
      userMessage,
      {
        id: assistantMessageId,
        role: 'assistant',
        content: '',
        experiences: [],
      },
    ])

    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height =
        'auto'
    }

    /*
     * Deixa o browser terminar o primeiro render
     * antes de levar o utilizador ao fundo.
     */
    requestAnimationFrame(() => {
      scrollToBottom(true)
    })

    try {
      const response = await fetch(
        '/api/soba/chat',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: text,
            history: previousMessages.map(
              (message) => ({
                role: message.role,
                content: message.content,
              }),
            ),
          }),
        },
      )

      if (!response.ok) {
        let errorMessage =
          'Falha ao comunicar com a Soba.'

        try {
          const errorText =
            await response.text()

          if (errorText) {
            try {
              const errorData =
                JSON.parse(errorText)

              if (
                typeof errorData?.error ===
                'string'
              ) {
                errorMessage =
                  errorData.error
              } else if (
                typeof errorData?.message ===
                'string'
              ) {
                errorMessage =
                  errorData.message
              } else {
                errorMessage =
                  errorText
              }
            } catch {
              errorMessage =
                errorText
            }
          }
        } catch {
          // Mantém a mensagem padrão.
        }

        throw new Error(errorMessage)
      }

      if (!response.body) {
        throw new Error(
          'A Soba não devolveu uma resposta.',
        )
      }

      const reader =
        response.body.getReader()

      const decoder =
        new TextDecoder()

      let buffer = ''
      let accumulated = ''

      let receivedExperiences: Experience[] =
        []

      /*
       * Em vez de atualizar o React a cada token,
       * acumulamos e atualizamos no máximo
       * algumas vezes por segundo.
       */
      let pendingUpdate = false

      const updateAssistant = () => {
        if (pendingUpdate) return

        pendingUpdate = true

        setTimeout(() => {
          pendingUpdate = false

          setMessages((current) =>
            current.map((message) =>
              message.id ===
              assistantMessageId
                ? {
                    ...message,
                    content:
                      accumulated,
                  }
                : message,
            ),
          )

          scrollToBottom()
        }, 80)
      }

      while (true) {
        const { done, value } =
          await reader.read()

        if (done) break

        buffer += decoder.decode(
          value,
          {
            stream: true,
          },
        )

        const lines =
          buffer.split('\n')

        buffer =
          lines.pop() || ''

        for (const line of lines) {
          const trimmed =
            line.trim()

          if (!trimmed) continue

          try {
            const event =
              JSON.parse(
                trimmed,
              ) as SobaStreamEvent

            if (
              event.type === 'text'
            ) {
              accumulated +=
                event.content

              /*
               * Atualiza a interface sem
               * sobrecarregar o React.
               */
              updateAssistant()
            }

            if (
              event.type ===
              'experiences'
            ) {
              receivedExperiences =
                event.experiences

              setMessages((current) =>
                current.map(
                  (message) =>
                    message.id ===
                    assistantMessageId
                      ? {
                          ...message,
                          experiences:
                            receivedExperiences,
                        }
                      : message,
                ),
              )

              /*
               * Os cards podem aumentar
               * bastante a altura da conversa.
               */
              scrollToBottom()
            }
          } catch {
            // Ignora linhas incompletas ou inválidas.
          }
        }
      }

      /*
       * Processa o último fragmento.
       */
      buffer += decoder.decode()

      if (buffer.trim()) {
        try {
          const event =
            JSON.parse(
              buffer.trim(),
            ) as SobaStreamEvent

          if (event.type === 'text') {
            accumulated +=
              event.content
          }

          if (
            event.type ===
            'experiences'
          ) {
            receivedExperiences =
              event.experiences
          }
        } catch {
          // Ignora último fragmento inválido.
        }
      }

      /*
       * Render final.
       */
      setMessages((current) =>
        current.map((message) =>
          message.id ===
          assistantMessageId
            ? {
                ...message,
                content:
                  accumulated,
                experiences:
                  receivedExperiences,
              }
            : message,
        ),
      )

      /*
       * Garante que o último conteúdo
       * fique visível.
       */
      requestAnimationFrame(() => {
        scrollToBottom(true)
      })

      if (!accumulated.trim()) {
        setMessages((current) =>
          current.map((message) =>
            message.id ===
            assistantMessageId
              ? {
                  ...message,
                  content:
                    receivedExperiences.length >
                    0
                      ? 'Encontrei estas experiências na Wizenda:'
                      : 'Não consegui preparar uma resposta neste momento. Tenta novamente.',
                  experiences:
                    receivedExperiences,
                }
              : message,
          ),
        )
      }
    } catch (error) {
      console.error(
        'Soba frontend error:',
        error,
      )

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Não consegui responder neste momento. Tenta novamente.'

      setMessages((current) =>
        current.map((message) =>
          message.id ===
          assistantMessageId
            ? {
                ...message,
                content:
                  errorMessage,
              }
            : message,
        ),
      )

      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    } finally {
      setLoading(false)

      requestAnimationFrame(() => {
        scrollToBottom(true)
      })
    }
  }

  function clearConversation() {
    setMessages([])
    setInput('')

    shouldAutoScrollRef.current = true

    if (textareaRef.current) {
      textareaRef.current.style.height =
        'auto'
    }
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] text-[#111111]">
      {/* HEADER */}
      <header className="fixed inset-x-0 top-0 z-50 bg-[#FAFAFA]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-8">
          <Link
            href="/"
            className="flex h-9 items-center gap-2 rounded-xl px-2 text-sm font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
          >
            <ArrowLeft size={17} />

            <span className="hidden sm:block">
              Voltar
            </span>
          </Link>

          <div className="absolute left-1/2 flex -translate-x-1/2 items-center gap-2">
            <div className="h-7 w-7 overflow-hidden rounded-full">
              <img
                src="/soba-avatar.png"
                alt="Soba"
                className="h-full w-full object-cover"
              />
            </div>

            <span className="text-sm font-semibold tracking-tight">
              Soba
            </span>

            <Sparkles
              size={13}
              className="text-[#FF5A1F]"
            />
          </div>

          {hasMessages ? (
            <button
              type="button"
              onClick={clearConversation}
              className="flex h-9 items-center gap-2 rounded-xl px-3 text-xs font-medium text-gray-500 transition hover:bg-white hover:text-gray-900"
            >
              <Plus size={15} />

              <span className="hidden sm:block">
                Nova conversa
              </span>
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>
      </header>

      {/* CONTEÚDO */}
      <div
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
        className="min-h-screen overflow-y-auto px-5 pb-36 pt-16 sm:px-8"
      >
        {!hasMessages ? (
          <div className="flex min-h-[calc(100vh-170px)] flex-col items-center justify-center">
            <div className="soba-avatar mb-7 h-20 w-20 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <img
                src="/soba-avatar.png"
                alt="Soba IA"
                className="h-full w-full object-cover"
              />
            </div>

            <div className="text-center">
              <div className="mb-3 flex items-center justify-center gap-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.18em] text-gray-400">
                  Inteligência da Wizenda
                </span>

                <Sparkles
                  size={12}
                  className="text-[#FF5A1F]"
                />
              </div>

              <h1 className="text-4xl font-semibold tracking-[-0.035em] sm:text-5xl">
                Olá, Tusevo 👋
              </h1>

              <p className="mt-3 text-base text-gray-400 sm:text-lg">
                Como posso ajudar-te hoje?
              </p>
            </div>

            <div className="mt-9 flex w-full max-w-md flex-col items-center gap-1">
              {suggestions.map(
                ({
                  label,
                  text,
                  icon: Icon,
                }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() =>
                      sendMessage(
                        undefined,
                        text,
                      )
                    }
                    className="group flex w-full items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-center transition hover:bg-white"
                  >
                    <Icon
                      size={15}
                      className="text-gray-300 transition group-hover:text-[#FF5A1F]"
                    />

                    <span className="text-sm text-gray-500 transition group-hover:text-gray-900">
                      {label}
                    </span>
                  </button>
                ),
              )}
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl pt-10">
            <div className="space-y-9">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={
                    message.role === 'user'
                      ? 'flex justify-end'
                      : 'flex justify-start'
                  }
                >
                  {message.role === 'user' ? (
                    <div className="max-w-[82%] rounded-[20px] rounded-br-md bg-[#FF5A1F] px-4 py-3 text-sm leading-6 text-white">
                      {message.content}
                    </div>
                  ) : (
                    <div className="flex max-w-[95%] gap-3">
                      <div className="soba-small-avatar h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                        <img
                          src="/soba-avatar.png"
                          alt="Soba"
                          className="h-full w-full object-cover"
                        />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-900">
                            Soba
                          </span>

                          <Sparkles
                            size={11}
                            className="text-[#FF5A1F]"
                          />
                        </div>

                        {message.content ? (
                          <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                            {message.content}
                          </div>
                        ) : loading ? (
                          <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                            <Loader2
                              size={14}
                              className="animate-spin text-[#FF5A1F]"
                            />

                            A Soba está a pensar...
                          </div>
                        ) : null}

                        {message.experiences &&
                          message.experiences
                            .length > 0 && (
                            <div className="mt-2 space-y-4">
                              {message.experiences.map(
                                (
                                  experience,
                                ) => (
                                  <ExperienceCard
                                    key={
                                      experience.id
                                    }
                                    experience={
                                      experience
                                    }
                                  />
                                ),
                              )}
                            </div>
                          )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </div>

      {/* INPUT */}
      <div className="fixed bottom-0 left-0 z-40 w-full bg-gradient-to-t from-[#FAFAFA] via-[#FAFAFA] to-transparent px-5 pb-5 pt-8 sm:px-8">
        <form
          onSubmit={sendMessage}
          className="mx-auto w-full max-w-2xl"
        >
          <div className="flex items-end rounded-[22px] border border-gray-200 bg-white px-3 py-2 shadow-sm transition focus-within:border-orange-300 focus-within:shadow-md">
            <textarea
              ref={textareaRef}
              value={input}
              disabled={loading}
              rows={1}
              placeholder="Pergunta à Soba..."
              onChange={(event) => {
                setInput(event.target.value)
                resizeTextarea()
              }}
              onKeyDown={(event) => {
                if (
                  event.key === 'Enter' &&
                  !event.shiftKey
                ) {
                  event.preventDefault()

                  if (!loading) {
                    sendMessage()
                  }
                }
              }}
              className="max-h-[140px] min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-sm leading-6 outline-none placeholder:text-gray-400"
            />

            <button
              type="button"
              disabled
              aria-label="Voz"
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-gray-300"
            >
              <Mic size={17} />
            </button>

            <button
              type="submit"
              disabled={
                loading || !input.trim()
              }
              aria-label="Enviar"
              className="mb-0.5 ml-1 flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF5A1F] text-white transition hover:bg-[#E94D17] active:scale-95 disabled:bg-gray-200 disabled:text-gray-400"
            >
              {loading ? (
                <Loader2
                  size={16}
                  className="animate-spin"
                />
              ) : (
                <ArrowUp size={17} />
              )}
            </button>
          </div>

          <p className="mt-2 text-center text-[10px] text-gray-400">
            A Soba pode cometer erros. Confirma informações importantes.
          </p>
        </form>
      </div>

      <style jsx>{`
        .soba-avatar {
          animation: sobaFloat 4s ease-in-out infinite;
        }

        .soba-avatar img {
          animation: sobaBreath 3.2s ease-in-out infinite;
        }

        .soba-small-avatar {
          animation: sobaSmallFloat 3.5s ease-in-out infinite;
        }

        @keyframes sobaFloat {
          0%,
          100% {
            transform: translateY(0) rotate(0deg);
          }

          50% {
            transform: translateY(-4px) rotate(1deg);
          }
        }

        @keyframes sobaBreath {
          0%,
          100% {
            transform: scale(1);
          }

          50% {
            transform: scale(1.035);
          }
        }

        @keyframes sobaSmallFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-2px);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .soba-avatar,
          .soba-avatar img,
          .soba-small-avatar {
            animation: none;
          }
        }
      `}</style>
    </main>
  )
}