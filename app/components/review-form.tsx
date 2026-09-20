'use client'

import { Star } from 'lucide-react'
import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ReviewFormProps = {
  experienceId: string
  bookingId: string
  onSuccess?: () => void
}

export default function ReviewForm({
  experienceId,
  bookingId,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (rating < 1 || rating > 5) {
      setMessage('Escolhe uma avaliação de 1 a 5 estrelas.')
      return
    }

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setMessage('Precisas de iniciar sessão.')
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('reviews')
      .insert({
        user_id: user.id,
        experience_id: experienceId,
        booking_id: bookingId,
        rating,
        comment: comment.trim() || null,
      })

    if (error) {
      console.error(error)

      setMessage(
        error.message ||
          'Não foi possível enviar a avaliação.',
      )

      setLoading(false)
      return
    }

    setRating(0)
    setComment('')
    setMessage('Avaliação enviada com sucesso!')

    setLoading(false)

    onSuccess?.()
  }

  const displayedRating =
    hoverRating || rating

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm"
    >
      <h3 className="text-xl font-black">
        Avalia esta experiência
      </h3>

      <p className="mt-1 text-sm text-gray-500">
        Como foi a tua experiência?
      </p>

      <div
        className="mt-5 flex gap-2"
        onMouseLeave={() =>
          setHoverRating(0)
        }
      >
        {[1, 2, 3, 4, 5].map((value) => (
          <button
            key={value}
            type="button"
            onMouseEnter={() =>
              setHoverRating(value)
            }
            onClick={() =>
              setRating(value)
            }
            aria-label={`${value} estrela${
              value > 1 ? 's' : ''
            }`}
            className="rounded-lg p-1 transition hover:scale-110"
          >
            <Star
              size={30}
              className={
                value <= displayedRating
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-gray-300'
              }
            />
          </button>
        ))}
      </div>

      <p className="mt-2 text-sm font-semibold text-gray-700">
        {displayedRating === 0
          ? 'Seleciona uma avaliação'
          : `${displayedRating} de 5 estrelas`}
      </p>

      <textarea
        value={comment}
        onChange={(event) =>
          setComment(event.target.value)
        }
        placeholder="Conta como foi a tua experiência..."
        rows={4}
        maxLength={1000}
        className="mt-5 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
      />

      <div className="mt-2 text-right text-xs text-gray-400">
        {comment.length}/1000
      </div>

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="mt-4 w-full rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {loading
          ? 'A enviar...'
          : 'Enviar avaliação'}
      </button>

      {message && (
        <p className="mt-4 rounded-2xl bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700">
          {message}
        </p>
      )}
    </form>
  )
}