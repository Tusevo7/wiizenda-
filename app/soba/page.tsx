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
  Mic,
  Plus,
  Sparkles,
  Utensils,
} from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
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

export default function SobaPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)

  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const hasMessages = messages.length > 0

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    })
  }, [messages, loading])

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

    const text = (customMessage ?? input).trim()

    if (!text || loading) return

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    }

    const previousMessages = messages

    setMessages((current) => [
      ...current,
      userMessage,
    ])

    setInput('')
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const response = await fetch('/api/soba/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: text,
          history: previousMessages,
        }),
      })

      if (!response.ok) {
        throw new Error(
          'Falha ao comunicar com a Soba.',
        )
      }

      const data = await response.json()

      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            data.message ||
            'Ainda estou a preparar essa resposta.',
        },
      ])
    } catch {
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: 'assistant',
          content:
            'Não consegui responder neste momento. Tenta novamente.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  function clearConversation() {
    setMessages([])
    setInput('')

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
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

          {/* LOGO SOBA */}
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
      <div className="min-h-screen px-5 pb-36 pt-16 sm:px-8">
        {!hasMessages ? (
          /* ========================================
             HOME DA SOBA
          ======================================== */
          <div className="flex min-h-[calc(100vh-170px)] flex-col items-center justify-center">
            {/* AVATAR */}
            <div className="soba-avatar mb-7 h-20 w-20 overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-gray-200">
              <img
                src="/soba-avatar.png"
                alt="Soba IA"
                className="h-full w-full object-cover"
              />
            </div>

            {/* TEXTO PRINCIPAL */}
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

            {/* SUGESTÕES */}
            <div className="mt-9 flex w-full max-w-md flex-col items-center gap-1">
              {suggestions.map(
                ({ label, text, icon: Icon }) => (
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
          /* ========================================
             CONVERSA
          ======================================== */
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

                      <div className="min-w-0">
                        <div className="mb-1.5 flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-gray-900">
                            Soba
                          </span>

                          <Sparkles
                            size={11}
                            className="text-[#FF5A1F]"
                          />
                        </div>

                        <div className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                          {message.content}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* LOADING */}
              {loading && (
                <div className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="soba-small-avatar h-8 w-8 shrink-0 overflow-hidden rounded-full bg-white ring-1 ring-gray-200">
                      <img
                        src="/soba-avatar.png"
                        alt="Soba"
                        className="h-full w-full object-cover"
                      />
                    </div>

                    <div className="flex items-center gap-2 pt-1 text-xs text-gray-400">
                      <Loader2
                        size={14}
                        className="animate-spin text-[#FF5A1F]"
                      />

                      A Soba está a pensar...
                    </div>
                  </div>
                </div>
              )}

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

            {/* MICROFONE */}
            <button
              type="button"
              disabled
              aria-label="Voz"
              className="mb-0.5 flex h-9 w-9 items-center justify-center rounded-xl text-gray-300"
            >
              <Mic size={17} />
            </button>

            {/* ENVIAR */}
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

      {/* ANIMAÇÕES */}
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
      `}</style>
    </main>
  )
}