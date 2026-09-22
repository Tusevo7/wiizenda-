'use client'

import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
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

const categories = [
  'Todos',
  'Hotéis e Resorts',
  'Restaurantes',
  'Lodges',
  'Piscinas e Clubes',
  'Praias',
  'Espaços de Lazer',
  'Parques',
  'Spas',
  'Entretenimento',
  'Eventos',
]

export default function WeekendPage() {
  const [places, setPlaces] = useState<WeekendPlace[]>([])
  const [loading, setLoading] = useState(true)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('Todos')

  useEffect(() => {
    async function loadPlaces() {
      const supabase = createClient()

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
        .order('is_featured', {
          ascending: false,
        })
        .order('created_at', {
          ascending: false,
        })

      if (error) {
        console.error(
          'Erro ao carregar lugares:',
          error,
        )

        setPlaces([])
      } else {
        setPlaces(data || [])
      }

      setLoading(false)
    }

    void loadPlaces()
  }, [])

  const filteredPlaces = useMemo(() => {
    const term = search.trim().toLowerCase()

    return places.filter((place) => {
      const matchesCategory =
        category === 'Todos' ||
        place.category === category

      const searchableText = [
        place.business_name,
        place.category,
        place.description,
        place.province,
        place.city,
        place.location,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      const matchesSearch =
        !term ||
        searchableText.includes(term)

      return (
        matchesCategory &&
        matchesSearch
      )
    })
  }, [places, search, category])

  return (
    <main className="min-h-screen bg-[#FAFAFA]">

      {/* HEADER */}
      <section className="bg-gray-950">

        <div className="mx-auto max-w-7xl px-5 pb-10 pt-6 sm:px-6 lg:px-8">

          {/* VOLTAR */}
          <Link
            href="/"
            className="inline-flex items-center gap-1 text-sm font-bold text-white/70 transition hover:text-white"
          >
            <ChevronLeft size={18} />
            Início
          </Link>

          <div className="mt-8 max-w-2xl">

            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-400">
              Descobre onde ir
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
              Lugares para o fim de semana
            </h1>

            <p className="mt-3 text-sm leading-6 text-gray-300 sm:text-base">
              Descobre hotéis, restaurantes, resorts,
              praias, piscinas e outros lugares para
              aproveitar em Angola.
            </p>

          </div>

          {/* PESQUISA */}
          <div className="mt-7 max-w-2xl">

            <div className="flex items-center gap-3 rounded-2xl bg-white p-2 shadow-xl">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Search
                  size={19}
                  className="text-gray-500"
                />
              </div>

              <input
                type="text"
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value,
                  )
                }
                placeholder="Pesquisar lugares..."
                className="min-w-0 flex-1 bg-transparent text-sm font-medium text-gray-900 outline-none placeholder:text-gray-400"
              />

            </div>

          </div>

        </div>

      </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">

        {/* CATEGORIAS */}
        <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

          {categories.map((item) => {
            const active =
              category === item

            return (
              <button
                key={item}
                type="button"
                onClick={() =>
                  setCategory(item)
                }
                className={[
                  'shrink-0 rounded-full px-4 py-2.5 text-xs font-bold transition',
                  active
                    ? 'bg-orange-500 text-white shadow-sm'
                    : 'border border-gray-200 bg-white text-gray-700 hover:border-orange-200 hover:text-orange-500',
                ].join(' ')}
              >
                {item}
              </button>
            )
          })}

        </div>

        {/* TÍTULO */}
        <div className="mt-8 flex items-end justify-between gap-4">

          <div>
            <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
              {search || category !== 'Todos'
                ? 'Resultados'
                : 'Todos os lugares'}
            </h2>

            {!loading && (
              <p className="mt-1 text-sm text-gray-500">
                {filteredPlaces.length}{' '}
                {filteredPlaces.length === 1
                  ? 'lugar encontrado'
                  : 'lugares encontrados'}
              </p>
            )}
          </div>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

            {[1, 2, 3, 4, 5, 6, 7, 8].map(
              (item) => (
                <div
                  key={item}
                  className="animate-pulse overflow-hidden rounded-2xl bg-white"
                >
                  <div className="h-[210px] bg-gray-200" />

                  <div className="space-y-2 p-3">
                    <div className="h-4 w-3/4 rounded bg-gray-200" />
                    <div className="h-3 w-1/2 rounded bg-gray-200" />
                    <div className="h-3 w-2/3 rounded bg-gray-200" />
                  </div>
                </div>
              ),
            )}

          </div>
        )}

        {/* RESULTADOS */}
        {!loading &&
          filteredPlaces.length > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4">

              {filteredPlaces.map(
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
                      className="group"
                    >
                      <article className="overflow-hidden rounded-2xl bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

                        {/* IMAGEM */}
                        <div className="relative h-[190px] overflow-hidden sm:h-[220px]">

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

                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />

                          {/* DESTAQUE */}
                          {place.is_featured && (
                            <span className="absolute left-2.5 top-2.5 rounded-full bg-orange-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wide text-white shadow-lg">
                              Destaque
                            </span>
                          )}

                          {/* CATEGORIA */}
                          <span className="absolute right-2.5 top-2.5 max-w-[100px] truncate rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-bold text-gray-900 backdrop-blur">
                            {place.category}
                          </span>

                          {/* LOCALIZAÇÃO */}
                          <div className="absolute bottom-3 left-3 right-3 text-white">

                            <h3 className="truncate text-sm font-black sm:text-base">
                              {place.business_name}
                            </h3>

                            <p className="mt-0.5 flex items-center gap-1 text-[10px] text-white/75 sm:text-xs">
                              <MapPin size={11} />

                              <span className="truncate">
                                {location}
                              </span>
                            </p>

                          </div>

                        </div>

                        {/* INFORMAÇÕES */}
                        <div className="p-3">

                          <div className="flex items-center justify-between gap-2">

                            <span className="truncate text-[10px] font-bold uppercase tracking-wide text-gray-400">
                              {place.category}
                            </span>

                            <ChevronRight
                              size={15}
                              className="shrink-0 text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                            />

                          </div>

                          {place.price_from !==
                            null && (
                            <p className="mt-1.5 text-xs font-black text-gray-950">
                              A partir de{' '}
                              {Number(
                                place.price_from,
                              ).toLocaleString(
                                'pt-AO',
                              )}{' '}
                              Kz
                            </p>
                          )}

                        </div>

                      </article>
                    </Link>
                  )
                },
              )}

            </div>
          )}

        {/* SEM RESULTADOS */}
        {!loading &&
          filteredPlaces.length === 0 && (
            <div className="mt-8 rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">
                <Search
                  size={22}
                  className="text-gray-400"
                />
              </div>

              <h3 className="mt-4 text-lg font-black text-gray-950">
                Nenhum lugar encontrado
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Tenta pesquisar por outro nome,
                cidade ou categoria.
              </p>

              {(search ||
                category !== 'Todos') && (
                <button
                  type="button"
                  onClick={() => {
                    setSearch('')
                    setCategory('Todos')
                  }}
                  className="mt-5 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Limpar filtros
                </button>
              )}

            </div>
          )}

      </section>

    </main>
  )
}