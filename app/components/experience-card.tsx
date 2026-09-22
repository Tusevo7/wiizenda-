
'use client'

import Link from 'next/link'
import {
  CalendarDays,
  Heart,
  MapPin,
  Star,
} from 'lucide-react'
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
  activityStartAt: string
  agencyName: string
  agencyLogo: string | null
}

export default function ExperienceCard({
  id,
  slug,
  title,
  location,
  price,
  rating,
  image,
  activityStartAt,
  agencyName,
  agencyLogo,
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

  const formattedDate = new Date(
    activityStartAt,
  ).toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
  })

  return (
    <Link
      href={`/experience/${slug}`}
      className="block min-w-[300px] sm:min-w-[330px]"
    >
      <article className="group relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm">

        {/* FOTO */}
        <div className="relative h-[520px] w-full overflow-hidden sm:h-[560px] lg:h-[600px]">

          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />

          {/* GRADIENTE PRETO INFERIOR */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 via-45% to-transparent" />

          {/* GRADIENTE SUPERIOR */}
          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/40 to-transparent" />

          {/* FAVORITO */}
          <button
            type="button"
            onClick={toggleFavorite}
            disabled={loading}
            aria-label={
              favorite
                ? 'Remover dos favoritos'
                : 'Adicionar aos favoritos'
            }
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur transition hover:scale-105 disabled:opacity-60"
          >
            <Heart
              size={20}
              className={
                favorite
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-gray-900'
              }
            />
          </button>

          {/* RATING */}
          {rating > 0 && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
              <Star
                size={15}
                className="fill-orange-400 text-orange-400"
              />

              {rating.toFixed(1)}
            </div>
          )}

          {/* CONTEÚDO SOBRE A FOTO */}
          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6 lg:p-7">

            {/* AGÊNCIA */}
            <div className="mb-5 flex items-center gap-3">

              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-lg">
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agencyName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-orange-50 text-sm font-black text-orange-500">
                    {agencyName
                      ? agencyName
                          .charAt(0)
                          .toUpperCase()
                      : 'A'}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {agencyName}
                </p>

                <p className="text-xs text-white/70">
                  Agência parceira
                </p>
              </div>

            </div>

            {/* TÍTULO */}
            <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              {title}
            </h3>

            {/* LOCALIZAÇÃO + DATA */}
            <div className="mt-4 flex items-center gap-4 text-sm text-white/85">

              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin
                  size={15}
                  className="shrink-0"
                />

                <span className="truncate">
                  {location}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <CalendarDays size={15} />

                <span>
                  {formattedDate}
                </span>
              </div>

            </div>

            {/* PREÇO + BOTÃO */}
            <div className="mt-5 flex items-end justify-between gap-4">

              <div>
                <p className="text-xs font-medium text-white/65">
                  A partir de
                </p>

                <p className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                  {price}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-gray-950 transition group-hover:bg-orange-500 group-hover:text-white">
                Ver experiência
              </span>

            </div>

          </div>

        </div>

      </article>
    </Link>
  )
}