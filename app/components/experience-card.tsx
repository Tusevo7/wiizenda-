'use client'

import Link from 'next/link'
import { Heart, MapPin, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type ExperienceCardProps = {
  id: string
  slug: string
  title: string
  location: string
  price: string
  rating: number
  image: string
}

export default function ExperienceCard({
  id,
  slug,
  title,
  location,
  price,
  rating,
  image,
}: ExperienceCardProps) {
  const [favorite, setFavorite] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function checkFavorite() {
      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) return

      const { data } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('experience_id', id)
        .maybeSingle()

      setFavorite(!!data)
    }

    checkFavorite()
  }, [id])

  async function toggleFavorite(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    setLoading(true)

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      window.location.href = '/login'
      return
    }

    if (favorite) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('experience_id', id)

      if (!error) {
        setFavorite(false)
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          experience_id: id,
        })

      if (!error) {
        setFavorite(true)
      }
    }

    setLoading(false)
  }

  return (
    <Link
      href={`/experience/${slug}`}
      className="block"
    >
      <article className="group">
        <div className="relative overflow-hidden rounded-3xl bg-gray-100">
          <img
            src={image}
            alt={title}
            className="h-[340px] w-full object-cover transition duration-500 group-hover:scale-105"
          />

          <button
            type="button"
            onClick={toggleFavorite}
            disabled={loading}
            aria-label={
              favorite
                ? 'Remover dos favoritos'
                : 'Adicionar aos favoritos'
            }
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/90 shadow-sm backdrop-blur transition hover:scale-105 disabled:opacity-60"
          >
            <Heart
              size={19}
              className={
                favorite
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-gray-800'
              }
            />
          </button>

          <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold backdrop-blur">
            Experiência
          </div>
        </div>

        <div className="mt-3">
          <div className="flex items-start justify-between gap-3">
            <h3 className="font-bold text-gray-950">
              {title}
            </h3>

            <div className="flex shrink-0 items-center gap-1 text-sm font-semibold">
              <Star
                size={15}
                className="fill-orange-500 text-orange-500"
              />
              {rating}
            </div>
          </div>

          <div className="mt-1 flex items-center gap-1 text-sm text-gray-500">
            <MapPin size={14} />
            {location}
          </div>

          <p className="mt-2 text-sm text-gray-500">
            A partir de{' '}
            <span className="font-bold text-gray-950">
              {price}
            </span>
          </p>
        </div>
      </article>
    </Link>
  )
}