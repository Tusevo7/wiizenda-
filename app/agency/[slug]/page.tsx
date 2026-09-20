import Link from 'next/link'
import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  Building2,
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  Star,
} from 'lucide-react'
import { notFound } from 'next/navigation'

type AgencyPageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function AgencyPublicPage({
  params,
}: AgencyPageProps) {
  const { slug } = await params

  const supabase = await createClient()

  const { data: agency, error } = await supabase
    .from('agencies')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      cover_image,
      phone,
      email,
      province,
      city,
      address,
      status
    `)
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) {
    console.error(error)
  }

  if (!agency) {
    notFound()
  }

  const { data: experiences, error: experiencesError } =
    await supabase
      .from('experiences')
      .select(`
        id,
        title,
        slug,
        category,
        location,
        city,
        province,
        price,
        cover_image
      `)
      .eq('agency_id', agency.id)
      .eq('status', 'published')
      .order('created_at', {
        ascending: false,
      })

  if (experiencesError) {
    console.error(experiencesError)
  }

  const location =
    agency.address ||
    agency.city ||
    agency.province ||
    'Angola'

  return (
    <AppShell>
      <main className="min-h-screen bg-gray-50">
        {/* Capa */}
        <section className="relative">
          <div className="h-64 w-full overflow-hidden bg-gray-200 sm:h-80 lg:h-[420px]">
            {agency.cover_image ? (
              <img
                src={agency.cover_image}
                alt={agency.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-orange-500">
                <Building2
                  size={80}
                  className="text-white/30"
                />
              </div>
            )}
          </div>

          <div className="absolute left-5 top-5 sm:left-8">
            <Link
              href="/explore"
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white/90 shadow-lg backdrop-blur transition hover:bg-white"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </Link>
          </div>
        </section>

        {/* Informações principais */}
        <section className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
          <div className="relative -mt-12 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-lg sm:-mt-16 sm:p-8">
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              {/* Logo */}
              <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-4 border-white bg-gray-100 shadow-md sm:h-28 sm:w-28">
                {agency.logo_url ? (
                  <img
                    src={agency.logo_url}
                    alt={agency.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Building2
                    size={38}
                    className="text-gray-400"
                  />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                    {agency.name}
                  </h1>

                  <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                    Agência verificada
                  </span>
                </div>

                <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <MapPin size={15} />
                    {location}
                  </span>

                  <span className="flex items-center gap-1.5">
                    <Star
                      size={15}
                      className="fill-orange-500 text-orange-500"
                    />
                    4.9
                  </span>

                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={15} />
                    {experiences?.length || 0}{' '}
                    {experiences?.length === 1
                      ? 'experiência'
                      : 'experiências'}
                  </span>
                </div>
              </div>
            </div>

            {agency.description && (
              <div className="mt-7 border-t border-gray-100 pt-6">
                <h2 className="font-black">
                  Sobre a agência
                </h2>

                <p className="mt-3 max-w-3xl whitespace-pre-line text-sm leading-7 text-gray-600">
                  {agency.description}
                </p>
              </div>
            )}

            {/* Contactos */}
            {(agency.phone || agency.email) && (
              <div className="mt-6 flex flex-col gap-3 border-t border-gray-100 pt-6 sm:flex-row">
                {agency.phone && (
                  <a
                    href={`tel:${agency.phone}`}
                    className="flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                  >
                    <Phone size={17} />
                    Contactar agência
                  </a>
                )}

                {agency.email && (
                  <a
                    href={`mailto:${agency.email}`}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                  >
                    <Mail size={17} />
                    Enviar email
                  </a>
                )}
              </div>
            )}
          </div>
        </section>

        {/* Experiências */}
        <section className="mx-auto max-w-6xl px-5 py-10 sm:px-6 lg:px-8">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
              Experiências
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Experiências desta agência
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Descobre o que podes viver com {agency.name}.
            </p>
          </div>

          {experiences && experiences.length > 0 ? (
            <div className="mt-7 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {experiences.map((experience) => (
                <Link
                  key={experience.id}
                  href={`/experience/${experience.slug}`}
                  className="group overflow-hidden rounded-[1.75rem] border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                >
                  <div className="relative h-60 overflow-hidden bg-gray-100">
                    {experience.cover_image ? (
                      <img
                        src={experience.cover_image}
                        alt={experience.title}
                        className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-gray-300">
                        <Building2 size={42} />
                      </div>
                    )}

                    <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur">
                      {experience.category}
                    </span>
                  </div>

                  <div className="p-5">
                    <h3 className="text-lg font-black">
                      {experience.title}
                    </h3>

                    <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                      <MapPin size={14} />
                      {experience.location ||
                        experience.city ||
                        experience.province}
                    </p>

                    <div className="mt-4 flex items-center justify-between">
                      <p className="text-sm text-gray-500">
                        A partir de{' '}
                        <span className="font-black text-gray-950">
                          {Number(
                            experience.price,
                          ).toLocaleString('pt-AO')}{' '}
                          Kz
                        </span>
                      </p>

                      <span className="flex items-center gap-1 text-sm font-bold">
                        <Star
                          size={14}
                          className="fill-orange-500 text-orange-500"
                        />
                        4.9
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mt-7 rounded-3xl bg-white p-10 text-center shadow-sm">
              <Building2
                size={32}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-black">
                Ainda não existem experiências
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Esta agência ainda não publicou experiências.
              </p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}