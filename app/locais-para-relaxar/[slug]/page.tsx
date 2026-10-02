import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Banknote,
  Bath,
  Building2,
  CheckCircle2,
  Globe,
  Heart,
  Hotel,
  AtSign,
  Mail,
  MapPin,
  MessageCircle,
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
  gallery_urls: string[]

  price_from: number | string | null
  price_currency: string

  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null

  amenities: string[]

  is_featured: boolean
  status: string
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

  if (type === 'spa') {
    return <Bath size={18} />
  }

  if (type === 'beach_resort') {
    return <Waves size={18} />
  }

  if (
    type === 'casa_de_campo' ||
    type === 'eco_lodge'
  ) {
    return <TreePalm size={18} />
  }

  if (type === 'complexo_turistico') {
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

  return `${value.toLocaleString(
    'pt-AO',
  )} ${currency}`
}

export default async function RelaxationPlacePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const supabase = await createClient()

  const {
    data: place,
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
        gallery_urls,
        price_from,
        price_currency,
        phone,
        whatsapp,
        email,
        website,
        instagram,
        amenities,
        is_featured,
        status
      `,
    )
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) {
    console.error(
      'Relaxation place error:',
      error,
    )
  }

  if (!place) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-5 py-16">
          <div className="rounded-3xl border border-gray-200 bg-white p-10 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-orange-50 text-orange-500">
              <Building2 size={30} />
            </div>

            <h1 className="mt-5 text-2xl font-black">
              Local não encontrado
            </h1>

            <p className="mt-3 text-gray-500">
              Este local pode ter sido removido,
              suspenso ou ainda não foi aprovado.
            </p>

            <Link
              href="/locais-para-relaxar"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              <ArrowLeft size={17} />
              Voltar aos locais
            </Link>
          </div>
        </main>
      </AppShell>
    )
  }

  const typedPlace =
    place as RelaxationPlace

  const gallery = Array.from(
    new Set(
      [
        typedPlace.cover_image_url,
        ...(typedPlace.gallery_urls || []),
      ].filter(
        (image): image is string =>
          Boolean(image),
      ),
    ),
  )

  return (
    <AppShell>
      <main className="mx-auto max-w-7xl px-5 py-8">
        {/* VOLTAR */}

        <Link
          href="/locais-para-relaxar"
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-orange-500"
        >
          <ArrowLeft size={17} />
          Locais para Relaxar
        </Link>

        {/* GALERIA */}

        <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white">
          {gallery.length === 0 ? (
            <div className="flex h-[420px] items-center justify-center bg-gray-100 text-gray-400">
              <Building2 size={70} />
            </div>
          ) : gallery.length === 1 ? (
            <div className="h-[420px] overflow-hidden bg-gray-100">
              <img
                src={gallery[0]}
                alt={typedPlace.name}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="grid h-[420px] grid-cols-1 gap-1 md:grid-cols-2">
              <div className="overflow-hidden">
                <img
                  src={gallery[0]}
                  alt={typedPlace.name}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="grid grid-cols-2 gap-1">
                {gallery
                  .slice(1, 5)
                  .map(
                    (
                      image,
                      index,
                    ) => (
                      <div
                        key={image}
                        className="relative overflow-hidden"
                      >
                        <img
                          src={image}
                          alt={`${typedPlace.name} - ${index + 2}`}
                          className="h-full w-full object-cover"
                        />

                        {index === 3 &&
                          gallery.length >
                            5 && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                              <span className="text-lg font-black text-white">
                                +{gallery.length - 5}{' '}
                                fotos
                              </span>
                            </div>
                          )}
                      </div>
                    ),
                  )}
              </div>
            </div>
          )}
        </section>

        {/* CONTEÚDO */}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
          <section>
            {/* TÍTULO */}

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                    <TypeIcon
                      type={typedPlace.type}
                    />

                    {typeLabels[
                      typedPlace.type
                    ] ||
                      typedPlace.type}
                  </span>

                  {typedPlace.is_featured && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-orange-500 px-3 py-2 text-xs font-bold text-white">
                      <Sparkles
                        size={13}
                      />
                      Destaque
                    </span>
                  )}
                </div>

                <h1 className="mt-4 text-3xl font-black tracking-tight md:text-4xl">
                  {typedPlace.name}
                </h1>

                {(typedPlace.city ||
                  typedPlace.province) && (
                  <div className="mt-3 flex items-center gap-2 text-gray-500">
                    <MapPin
                      size={18}
                      className="text-orange-500"
                    />

                    <span>
                      {[
                        typedPlace.city,
                        typedPlace.province,
                      ]
                        .filter(Boolean)
                        .join(', ')}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition hover:border-orange-200 hover:text-orange-500"
                aria-label="Guardar local"
              >
                <Heart size={20} />
              </button>
            </div>

            {/* DESCRIÇÃO */}

            {typedPlace.description && (
              <div className="mt-8">
                <h2 className="text-xl font-black">
                  Sobre este local
                </h2>

                <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                  {typedPlace.description}
                </p>
              </div>
            )}

            {/* LOCALIZAÇÃO */}

            <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <MapPin size={21} />
                </div>

                <div>
                  <h2 className="font-black">
                    Localização
                  </h2>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    {[
                      typedPlace.address,
                      typedPlace.city,
                      typedPlace.province,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      'Localização não informada'}
                  </p>
                </div>
              </div>
            </div>

            {/* COMODIDADES */}

            {typedPlace.amenities &&
              typedPlace.amenities.length >
                0 && (
                <div className="mt-8">
                  <h2 className="text-xl font-black">
                    O que este local oferece
                  </h2>

                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {typedPlace.amenities.map(
                      (amenity) => (
                        <div
                          key={amenity}
                          className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4"
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-50 text-orange-500">
                            <CheckCircle2
                              size={18}
                            />
                          </div>

                          <span className="font-semibold text-gray-700">
                            {amenity}
                          </span>
                        </div>
                      ),
                    )}
                  </div>
                </div>
              )}

            {/* CONTACTOS */}

            <div className="mt-8">
              <h2 className="text-xl font-black">
                Contactos
              </h2>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {typedPlace.phone && (
                  <a
                    href={`tel:${typedPlace.phone}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Phone size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Telefone
                      </p>

                      <p className="font-bold text-gray-700">
                        {typedPlace.phone}
                      </p>
                    </div>
                  </a>
                )}

                {typedPlace.whatsapp && (
                  <a
                    href={`https://wa.me/${typedPlace.whatsapp.replace(
                      /\D/g,
                      '',
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <MessageCircle
                        size={18}
                      />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        WhatsApp
                      </p>

                      <p className="font-bold text-gray-700">
                        Contactar
                      </p>
                    </div>
                  </a>
                )}

                {typedPlace.email && (
                  <a
                    href={`mailto:${typedPlace.email}`}
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Mail size={18} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs text-gray-400">
                        Email
                      </p>

                      <p className="truncate font-bold text-gray-700">
                        {typedPlace.email}
                      </p>
                    </div>
                  </a>
                )}

                {typedPlace.website && (
                  <a
                    href={
                      typedPlace.website.startsWith(
                        'http',
                      )
                        ? typedPlace.website
                        : `https://${typedPlace.website}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <Globe size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Website
                      </p>

                      <p className="font-bold text-gray-700">
                        Visitar site
                      </p>
                    </div>
                  </a>
                )}

                {typedPlace.instagram && (
                  <a
                    href={
                      typedPlace.instagram.startsWith(
                        'http',
                      )
                        ? typedPlace.instagram
                        : `https://instagram.com/${typedPlace.instagram.replace(
                            /^@/,
                            '',
                          )}`
                    }
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 transition hover:border-orange-200"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                      <AtSign  size={18} />
                    </div>

                    <div>
                      <p className="text-xs text-gray-400">
                        Instagram
                      </p>

                      <p className="font-bold text-gray-700">
                        Ver perfil
                      </p>
                    </div>
                  </a>
                )}
              </div>
            </div>
          </section>

          {/* CARD DE RESERVA */}

          <aside>
            <div className="sticky top-6 rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-500">
                    Preço
                  </p>

                  <div className="mt-1 flex items-center gap-2">
                    <Banknote
                      size={21}
                      className="text-orange-500"
                    />

                    <span className="text-xl font-black">
                      {formatPrice(
                        typedPlace.price_from,
                        typedPlace.price_currency,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              <div className="my-5 h-px bg-gray-100" />

              <div className="space-y-3">
                {typedPlace.whatsapp && (
                  <a
                    href={`https://wa.me/${typedPlace.whatsapp.replace(
                      /\D/g,
                      '',
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3.5 font-bold text-white transition hover:bg-orange-600"
                  >
                    <MessageCircle
                      size={18}
                    />
                    Contactar pelo WhatsApp
                  </a>
                )}

                {typedPlace.phone && (
                  <a
                    href={`tel:${typedPlace.phone}`}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3.5 font-bold text-gray-700 transition hover:border-orange-300 hover:text-orange-500"
                  >
                    <Phone size={18} />
                    Ligar
                  </a>
                )}
              </div>

              <div className="mt-5 rounded-2xl bg-gray-50 p-4">
                <div className="flex gap-3">
                  <Sparkles
                    size={18}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />

                  <p className="text-xs leading-5 text-gray-500">
                    Este local foi verificado e
                    aprovado pela equipa Wizenda.
                  </p>
                </div>
              </div>

              <Link
                href="/locais-para-relaxar"
                className="mt-5 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 transition hover:text-orange-500"
              >
                Ver outros locais
                <ArrowRight size={15} />
              </Link>
            </div>
          </aside>
        </div>
      </main>
    </AppShell>
  )
}