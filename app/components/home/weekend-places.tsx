'use client'

import Link from 'next/link'
import { ChevronRight, MapPin } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WeekendPlace = {
  id: string
  business_name: string
  slug: string
  category: string
  description: string | null
  province: string | null
  city: string | null
  location: string | null
  cover_image: string | null
  logo_url: string | null
  price_from: number | null
  is_featured: boolean
}

export default function WeekendPlaces() {
  const [places, setPlaces] =
    useState<WeekendPlace[]>([])

  const [loading, setLoading] =
    useState(true)

  useEffect(() => {
    async function loadPlaces() {
      const supabase =
        createClient()

      const {
        data,
        error,
      } = await supabase
        .from('weekend_places')
        .select(`
          id,
          business_name,
          slug,
          category,
          description,
          province,
          city,
          location,
          cover_image,
          logo_url,
          price_from,
          is_featured
        `)
        .eq('status', 'active')
        .or(
          'subscription_expires_at.is.null,subscription_expires_at.gt.' +
            new Date().toISOString(),
        )
        .order(
          'is_featured',
          {
            ascending: false,
          },
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )
        .limit(12)

      if (error) {
        console.error(
          'Erro ao carregar lugares:',
          error,
        )

        setPlaces([])
      } else {
        setPlaces(
          data || [],
        )
      }

      setLoading(false)
    }

    void loadPlaces()
  }, [])

  if (
    !loading &&
    places.length === 0
  ) {
    return null
  }

  return (
    <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 lg:px-8">

      {/* CABEÇALHO */}
      <div className="flex items-end justify-between gap-4">

        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-orange-500">
            Descobre onde ir
          </p>

          <h2 className="mt-1 text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
            Lugares para o fim de semana
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Hotéis, resorts, restaurantes e lugares para aproveitar.
          </p>
        </div>

        <Link
          href="/weekend"
          className="hidden items-center gap-1 text-sm font-bold text-orange-500 transition hover:text-orange-600 sm:flex"
        >
          Ver todos
          <ChevronRight size={16} />
        </Link>

      </div>

      {/* CARDS */}
      <div className="mt-5 flex gap-3 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

        {loading
          ? [1, 2, 3, 4].map(
              (item) => (
                <div
                  key={item}
                  className="min-w-[200px] animate-pulse overflow-hidden rounded-2xl bg-gray-100 sm:min-w-[230px]"
                >
                  <div className="h-[210px] bg-gray-200" />

                  <div className="space-y-2 p-3">
                    <div className="h-4 w-2/3 rounded bg-gray-200" />

                    <div className="h-3 w-1/2 rounded bg-gray-200" />

                    <div className="h-3 w-3/4 rounded bg-gray-200" />
                  </div>
                </div>
              ),
            )
          : places.map(
              (place) => {
                const location =
                  place.location ||
                  place.city ||
                  place.province ||
                  'Angola'

                return (
                  <Link
                    key={place.id}
                    href={`/weekend/${place.slug}`}
                    className="group block min-w-[200px] sm:min-w-[230px]"
                  >
                    <article className="relative overflow-hidden rounded-2xl bg-gray-100 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                      {/* IMAGEM */}
                      <div className="relative h-[210px] overflow-hidden">

                        <img
                          src={
                            place.cover_image ||
                            '/placeholder-experience.jpg'
                          }
                          alt={
                            place.business_name
                          }
                          className="h-full w-full object-cover transition duration-700 group-hover:scale-105"
                        />

                        {/* GRADIENTE */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                        {/* DESTAQUE */}
                        {place.is_featured && (
                          <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-lg">
                            Destaque
                          </span>
                        )}

                        {/* CATEGORIA */}
                        <span className="absolute right-3 top-3 max-w-[110px] truncate rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-gray-900 shadow-lg backdrop-blur">
                          {place.category}
                        </span>

                        {/* INFORMAÇÕES */}
                        <div className="absolute inset-x-0 bottom-0 p-3">

                          {/* LOGO + NOME */}
                          <div className="flex items-center gap-2.5">

                            <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full border-2 border-white bg-white shadow-lg">

                              {place.logo_url ? (
                                <img
                                  src={
                                    place.logo_url
                                  }
                                  alt={
                                    place.business_name
                                  }
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="flex h-full w-full items-center justify-center text-xs font-black text-orange-500">
                                  {place.business_name
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}

                            </div>

                            <div className="min-w-0 text-white">

                              <h3 className="truncate text-[15px] font-black">
                                {
                                  place.business_name
                                }
                              </h3>

                              <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/75">
                                <MapPin size={10} />

                                <span className="truncate">
                                  {location}
                                </span>
                              </p>

                            </div>

                          </div>

                          {/* PREÇO */}
                          {place.price_from !==
                            null && (
                            <div className="mt-2">

                              <p className="text-[9px] font-medium text-white/60">
                                A partir de
                              </p>

                              <p className="text-sm font-black text-white">
                                {Number(
                                  place.price_from,
                                ).toLocaleString(
                                  'pt-AO',
                                )}{' '}
                                Kz
                              </p>

                            </div>
                          )}

                        </div>
                      </div>

                    </article>
                  </Link>
                )
              },
            )}

      </div>

      {/* MOBILE */}
      <Link
        href="/weekend"
        className="mt-4 flex items-center justify-center gap-1 rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-900 sm:hidden"
      >
        Ver todos os lugares

        <ChevronRight size={16} />
      </Link>

    </section>
  )
}