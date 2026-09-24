import Link from 'next/link'
import {
  ArrowLeft,
  Globe,
  MapPin,
  Phone,
} from 'lucide-react'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

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
  phone: string | null
  website: string | null
  price_from: number | null
  is_featured: boolean
}

type PageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function WeekendPlacePage({
  params,
}: PageProps) {
  const { slug } = await params

  const supabase = createClient()

  const {
    data: place,
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
      phone,
      website,
      price_from,
      is_featured
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .or(
      'subscription_expires_at.is.null,subscription_expires_at.gt.' +
        new Date().toISOString(),
    )
    .maybeSingle()

  if (error) {
    console.error(
      'Erro ao carregar lugar:',
      error,
    )

    notFound()
  }

  if (!place) {
    notFound()
  }

  const location =
    place.location ||
    place.city ||
    place.province ||
    'Angola'

  return (
    <main className="min-h-screen bg-[#FAFAFA]">

      {/* HERO */}
      <section className="relative">

        {/* IMAGEM */}
        <div className="relative h-[55vh] min-h-[420px] max-h-[650px] overflow-hidden">

          <img
            src={
              place.cover_image ||
              '/placeholder-experience.jpg'
            }
            alt={place.business_name}
            className="h-full w-full object-cover"
          />

          {/* GRADIENTE */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-black/5" />

          {/* VOLTAR */}
          <Link
            href="/weekend"
            className="absolute left-5 top-5 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/90 text-gray-950 shadow-xl backdrop-blur transition hover:bg-white sm:left-8"
            aria-label="Voltar"
          >
            <ArrowLeft size={20} />
          </Link>

          {/* CONTEÚDO HERO */}
          <div className="absolute inset-x-0 bottom-0">

            <div className="mx-auto max-w-7xl px-5 pb-7 sm:px-6 sm:pb-10 lg:px-8">

              <div className="flex flex-wrap items-center gap-2">

                {place.is_featured && (
                  <span className="rounded-full bg-orange-500 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white shadow-lg">
                    Destaque
                  </span>
                )}

                <span className="rounded-full bg-white/90 px-3 py-1.5 text-[10px] font-bold text-gray-900 backdrop-blur">
                  {place.category}
                </span>

              </div>

              <h1 className="mt-3 max-w-3xl text-3xl font-black tracking-tight text-white sm:text-5xl lg:text-6xl">
                {place.business_name}
              </h1>

              <p className="mt-2 flex items-center gap-1.5 text-sm text-white/80 sm:text-base">
                <MapPin size={16} />

                <span>
                  {location}
                </span>
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-5 py-7 sm:px-6 sm:py-10 lg:px-8">

        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">

          {/* PRINCIPAL */}
          <div className="space-y-6">

            {/* SOBRE */}
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

              <h2 className="text-xl font-black tracking-tight text-gray-950">
                Sobre este lugar
              </h2>

              {place.description ? (
                <p className="mt-4 whitespace-pre-line text-sm leading-7 text-gray-600 sm:text-base">
                  {place.description}
                </p>
              ) : (
                <p className="mt-4 text-sm text-gray-400">
                  Este estabelecimento ainda não adicionou uma descrição.
                </p>
              )}

            </section>

            {/* LOCALIZAÇÃO */}
            <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

              <h2 className="text-xl font-black tracking-tight text-gray-950">
                Localização
              </h2>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-500">
                  <MapPin size={19} />
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-950">
                    {location}
                  </p>

                  {(place.city ||
                    place.province) && (
                    <p className="mt-1 text-xs text-gray-500">
                      {[
                        place.city,
                        place.province,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </p>
                  )}
                </div>

              </div>

              {/* MAPA — PREPARADO PARA FUTURA IMPLEMENTAÇÃO */}
              <div className="mt-4 flex h-52 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">

                <div className="text-center">

                  <MapPin
                    size={28}
                    className="mx-auto text-gray-300"
                  />

                  <p className="mt-2 text-sm font-bold text-gray-400">
                    Mapa
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Localização no mapa será adicionada aqui.
                  </p>

                </div>

              </div>

            </section>

          </div>

          {/* SIDEBAR */}
          <aside className="space-y-4">

            {/* PERFIL DO NEGÓCIO */}
            <section className="rounded-3xl bg-white p-5 shadow-sm">

              <div className="flex items-center gap-3">

                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-gray-100 bg-gray-50">

                  {place.logo_url ? (
                    <img
                      src={place.logo_url}
                      alt={place.business_name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-xl font-black text-orange-500">
                      {place.business_name
                        .charAt(0)
                        .toUpperCase()}
                    </div>
                  )}

                </div>

                <div className="min-w-0">

                  <h2 className="truncate text-base font-black text-gray-950">
                    {place.business_name}
                  </h2>

                  <p className="mt-0.5 text-xs text-gray-500">
                    {place.category}
                  </p>

                </div>

              </div>

              {/* PREÇO */}
              {place.price_from !==
                null && (
                <div className="mt-5 rounded-2xl bg-gray-50 p-4">

                  <p className="text-[10px] font-bold uppercase tracking-wide text-gray-400">
                    A partir de
                  </p>

                  <p className="mt-1 text-2xl font-black text-gray-950">
                    {Number(
                      place.price_from,
                    ).toLocaleString(
                      'pt-AO',
                    )}{' '}
                    <span className="text-sm">
                      Kz
                    </span>
                  </p>

                </div>
              )}

            </section>

            {/* CONTACTOS */}
            <section className="rounded-3xl bg-white p-5 shadow-sm">

              <h2 className="text-base font-black text-gray-950">
                Contactar
              </h2>

              <div className="mt-4 space-y-2">

                {place.phone && (
                  <a
                    href={`tel:${place.phone}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Phone size={17} />

                    <span className="truncate">
                      {place.phone}
                    </span>
                  </a>
                )}

                {place.website && (
                  <a
                    href={place.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gray-100 p-3 text-sm font-bold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600"
                  >
                    <Globe size={17} />

                    <span className="truncate">
                      Website
                    </span>
                  </a>
                )}

                {!place.phone &&
                  !place.website && (
                    <p className="rounded-2xl bg-gray-50 p-4 text-xs leading-5 text-gray-500">
                      Este estabelecimento ainda não adicionou contactos.
                    </p>
                  )}

              </div>

            </section>

          </aside>

        </div>

      </section>

    </main>
  )
}