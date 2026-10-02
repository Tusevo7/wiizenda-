import Link from 'next/link'
import {
  ArrowRight,
  Banknote,
  Bath,
  Building2,
  CheckCircle2,
  Clock3,
  Heart,
  Hotel,
  MapPin,
  Phone,
  Sparkles,
  TreePalm,
  Waves,
} from 'lucide-react'

import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/server'

type RelaxationPlace = {
  id: string
  name: string
  slug: string
  type: string
  description: string | null
  province: string | null
  city: string | null
  address: string | null
  cover_image_url: string | null
  price_from: number | string | null
  price_currency: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  amenities: string[]
  is_featured: boolean
}

const typeLabels: Record<string, string> = {
  resort: 'Resort',
  hotel: 'Hotel',
  lodge: 'Lodge',
  spa: 'Spa',
  beach_resort: 'Resort de Praia',
  casa_de_campo: 'Casa de Campo',
  eco_lodge: 'Eco Lodge',
  complexo_turistico: 'Complexo Turístico',
  outro: 'Outro',
}

function TypeIcon({
  type,
}: {
  type: string
}) {
  if (type === 'hotel') {
    return <Hotel size={18} />
  }

  if (
    type === 'spa'
  ) {
    return <Bath size={18} />
  }

  if (
    type === 'beach_resort'
  ) {
    return <Waves size={18} />
  }

  if (
    type === 'casa_de_campo' ||
    type === 'eco_lodge'
  ) {
    return <TreePalm size={18} />
  }

  if (
    type === 'complexo_turistico'
  ) {
    return <Building2 size={18} />
  }

  return <Sparkles size={18} />
}

function formatPrice(
  price: number | string | null,
  currency: string,
) {
  if (
    price === null ||
    price === undefined ||
    price === ''
  ) {
    return 'Preço sob consulta'
  }

  const value = Number(price)

  if (Number.isNaN(value)) {
    return 'Preço sob consulta'
  }

  return `A partir de ${value.toLocaleString(
    'pt-AO',
  )} ${currency}`
}

export default async function RelaxationPlacesPage() {
  const supabase = await createClient()

  const {
    data: places,
    error,
  } = await supabase
    .from('relaxation_places')
    .select(
      `
        id,
        name,
        slug,
        type,
        description,
        province,
        city,
        address,
        cover_image_url,
        price_from,
        price_currency,
        phone,
        whatsapp,
        email,
        website,
        instagram,
        amenities,
        is_featured
      `,
    )
    .eq('status', 'approved')
    .order('is_featured', {
      ascending: false,
    })
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Relaxation places error:',
      error,
    )
  }

  const safePlaces: RelaxationPlace[] =
    places || []

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-10">
        {/* HEADER */}

        <div className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-orange-50 px-4 py-2 text-sm font-bold text-orange-600">
            <Heart size={16} />
            Locais para Relaxar
          </div>

          <h1 className="text-3xl font-black tracking-tight md:text-4xl">
            Encontra o teu próximo lugar para relaxar
          </h1>

          <p className="mt-3 max-w-2xl text-gray-500">
            Descobre resorts, hotéis, spas, lodges,
            praias e outros espaços para descansar,
            divertir-te e viver novas experiências.
          </p>
        </div>

        {/* LISTA */}

        {safePlaces.length === 0 ? (
          <div className="rounded-3xl border border-gray-200 bg-white px-6 py-16 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Heart size={28} />
            </div>

            <h2 className="mt-5 text-xl font-black">
              Ainda não há locais publicados
            </h2>

            <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
              Estamos a preparar novos locais para
              tornar a tua próxima escapadinha
              especial.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {safePlaces.map((place) => (
              <article
                key={place.id}
                className="group overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-xl"
              >
                {/* IMAGEM */}

                <div className="relative h-56 overflow-hidden bg-gray-100">
                  {place.cover_image_url ? (
                    <img
                      src={
                        place.cover_image_url
                      }
                      alt={place.name}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                      <Building2 size={48} />
                    </div>
                  )}

                  <div className="absolute left-4 top-4 flex items-center gap-2">
                    <span className="inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-2 text-xs font-bold text-gray-800 shadow-sm">
                      <TypeIcon
                        type={place.type}
                      />

                      {typeLabels[
                        place.type
                      ] ||
                        place.type}
                    </span>

                    {place.is_featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-white">
                        <Sparkles
                          size={13}
                        />
                        Destaque
                      </span>
                    )}
                  </div>
                </div>

                {/* CONTEÚDO */}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="text-xl font-black leading-tight">
                      {place.name}
                    </h2>

                    <Heart
                      size={19}
                      className="shrink-0 text-gray-400"
                    />
                  </div>

                  {/* LOCALIZAÇÃO */}

                  {(place.city ||
                    place.province) && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                      <MapPin
                        size={16}
                        className="shrink-0 text-orange-500"
                      />

                      <span>
                        {[
                          place.city,
                          place.province,
                        ]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    </div>
                  )}

                  {/* DESCRIÇÃO */}

                  {place.description && (
                    <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-500">
                      {place.description}
                    </p>
                  )}

                  {/* PREÇO */}

                  <div className="mt-4 flex items-center gap-2 text-sm font-bold text-gray-800">
                    <Banknote
                      size={17}
                      className="text-orange-500"
                    />

                    {formatPrice(
                      place.price_from,
                      place.price_currency,
                    )}
                  </div>

                  {/* COMODIDADES */}

                  {place.amenities &&
                    place.amenities.length >
                      0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {place.amenities
                          .slice(0, 4)
                          .map(
                            (amenity) => (
                              <span
                                key={
                                  amenity
                                }
                                className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600"
                              >
                                <CheckCircle2
                                  size={13}
                                  className="text-orange-500"
                                />

                                {amenity}
                              </span>
                            ),
                          )}
                      </div>
                    )}

                  {/* FOOTER */}

                  <div className="mt-5 flex items-center justify-between border-t border-gray-100 pt-4">
                    {place.phone ? (
                      <a
                        href={`tel:${place.phone}`}
                        className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-orange-500"
                      >
                        <Phone size={16} />
                        Contactar
                      </a>
                    ) : (
                      <span className="inline-flex items-center gap-2 text-sm text-gray-400">
                        <Clock3 size={16} />
                        Disponível
                      </span>
                    )}

                    <Link
                      href={`/locais-para-relaxar/${place.slug}`}
                      className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                    >
                      Ver local
                      <ArrowRight
                        size={16}
                      />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </AppShell>
  )
}