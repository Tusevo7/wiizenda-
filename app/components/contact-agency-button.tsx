'use client'

import { useState } from 'react'
import { MessageCircle, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'

type ContactAgencyButtonProps = {
  agencyId: string
  experienceId: string
}

export default function ContactAgencyButton({
  agencyId,
  experienceId,
}: ContactAgencyButtonProps) {
  const router = useRouter()

  const [loading, setLoading] = useState(false)

  async function handleContact() {
    if (loading) return

    setLoading(true)

    try {
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          agency_id: agencyId,
          experience_id: experienceId,
        }),
      })

      const data = await response.json()

      if (response.status === 401) {
        router.push('/login')
        return
      }

      if (!response.ok) {
        throw new Error(
          data.error || 'Não foi possível iniciar a conversa.',
        )
      }

      router.push(`/messages/${data.conversation_id}`)
    } catch (error) {
      console.error(error)

      alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível iniciar a conversa.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleContact}
      disabled={loading}
      className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white font-bold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? (
        <>
          <Loader2
            size={20}
            className="animate-spin"
          />
          A abrir conversa...
        </>
      ) : (
        <>
          <MessageCircle size={20} />
          Falar com a agência
        </>
      )}
    </button>
  )
}