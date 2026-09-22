import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
  BadgeCheck,
  Grid3X3,
} from 'lucide-react'

export default async function AgencyProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'traveler') {
    redirect('/profile')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const { data: agency } = await supabase
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
      status,
      is_verified
    `)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!agency) {
    return (
      <main className="min-h-screen bg-[#fafafa] px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <Building2
              size={40}
              className="mx-auto text-gray-400"
            />

            <h1 className="mt-4 text-2xl font-black">
              Agência não encontrada
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              A tua conta ainda não está associada a uma agência.
            </p>

            <Link
              href="/agency"
              className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Voltar ao painel
            </Link>
          </div>
        </div>
      </main>
    )
  }

  // ==========================================
  // EXPERIÊNCIAS DA AGÊNCIA
  // ==========================================

  const { data: experiences } = await supabase
    .from('experiences')
    .select(`
      id,
      title,
      slug,
      cover_image,
      price,
      location,
      city,
      province,
      activity_start_at,
      activity_end_at,
      status
    `)
    .eq('agency_id', agency.id)
    .order('created_at', {
      ascending: false,
    })

  const agencyExperiences = experiences || []

  const publishedExperiences =
    agencyExperiences.filter(
      (experience) =>
        experience.status === 'published',
    )

  return (
    <main className="min-h-screen bg-white">

      {/* ==========================================
          HEADER
      ========================================== */}

      <section className="border-b border-gray-100 bg-white">

        <div className="mx-auto max-w-5xl px-4 py-4 sm:px-6">

          <div className="flex items-center justify-between">

            <Link
              href="/agency"
              className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              ← Painel
            </Link>

            <Link
              href="/agency/profile/edit"
              className="flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
            >
              <Pencil size={15} />
              Editar
            </Link>

          </div>

        </div>

      </section>

      {/* ==========================================
          PERFIL
      ========================================== */}

      <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">

        {/* CAPA */}

        <div className="relative h-56 overflow-hidden rounded-3xl bg-gray-100 sm:h-72 md:h-80">

          {agency.cover_image ? (
            <img
              src={agency.cover_image}
              alt={`Capa da ${agency.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">

              <Building2
                size={48}
                className="text-white/70"
              />

            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        </div>

        {/* INFORMAÇÕES PRINCIPAIS */}

        <div className="relative px-1 sm:px-4">

          {/* AVATAR */}

          <div className="-mt-14 flex items-end justify-between sm:-mt-16">

            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-orange-50 shadow-lg sm:h-32 sm:w-32">

              {agency.logo_url ? (
                <img
                  src={agency.logo_url}
                  alt={`Logo da ${agency.name}`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-4xl font-black text-orange-500">
                  {agency.name
                    .charAt(0)
                    .toUpperCase()}
                </div>
              )}

            </div>

            <Link
              href="/agency/profile/edit"
              className="mb-2 hidden rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-bold text-gray-800 shadow-sm transition hover:bg-gray-50 sm:block"
            >
              Editar perfil
            </Link>

          </div>

          {/* NOME */}

          <div className="mt-4">

            <div className="flex items-center gap-2">

              <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                {agency.name}
              </h1>

              {agency.is_verified && (
                <BadgeCheck
                  size={22}
                  className="fill-orange-500 text-white"
                />
              )}

            </div>

            <p className="mt-1 text-sm text-gray-500">
              @{agency.slug}
            </p>

          </div>

          {/* BIO */}

          {agency.description && (
            <p className="mt-4 max-w-2xl text-sm leading-6 text-gray-700">
              {agency.description}
            </p>
          )}

          {/* LOCALIZAÇÃO */}

          {(agency.city || agency.province) && (
            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">

              <MapPin size={15} />

              <span>
                {[agency.city, agency.province]
                  .filter(Boolean)
                  .join(', ')}
              </span>

            </div>
          )}

          {/* BOTÃO MOBILE */}

          <Link
            href="/agency/profile/edit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-800 transition hover:bg-gray-50 sm:hidden"
          >
            <Pencil size={15} />
            Editar perfil
          </Link>

        </div>

      </section>

      {/* ==========================================
          ESTATÍSTICAS
      ========================================== */}

      <section className="mx-auto mt-7 max-w-5xl border-y border-gray-100 sm:px-4">

        <div className="grid grid-cols-3">

          <div className="px-3 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {publishedExperiences.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Experiências
            </p>
          </div>

          <div className="border-x border-gray-100 px-3 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {agencyExperiences.length}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Publicadas
            </p>
          </div>

          <div className="px-3 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {agency.is_verified ? '✓' : '—'}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Verificada
            </p>
          </div>

        </div>

      </section>

      {/* ==========================================
          CONTEÚDO
      ========================================== */}

      <section className="mx-auto max-w-5xl px-4 sm:px-6">

        {/* TAB */}

        <div className="flex justify-center border-b border-gray-100">

          <div className="flex items-center gap-2 border-b-2 border-gray-950 px-5 py-4 text-xs font-black uppercase tracking-wider text-gray-950">
            <Grid3X3 size={15} />
            Experiências
          </div>

        </div>

        {/* GRID */}

        {publishedExperiences.length > 0 ? (

          <div className="grid grid-cols-2 gap-1 py-1 sm:grid-cols-3 sm:gap-2">

            {publishedExperiences.map(
              (experience) => (
                <Link
                  key={experience.id}
                  href={`/experience/${experience.slug}`}
                  className="group relative aspect-square overflow-hidden bg-gray-100"
                >

                  {experience.cover_image ? (
                    <img
                      src={experience.cover_image}
                      alt={experience.title}
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gray-100">
                      <Building2
                        size={28}
                        className="text-gray-300"
                      />
                    </div>
                  )}

                  {/* OVERLAY */}

                  <div className="absolute inset-0 flex items-end bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 transition group-hover:opacity-100">

                    <div className="w-full p-4 text-white">

                      <p className="line-clamp-2 text-sm font-bold">
                        {experience.title}
                      </p>

                      <p className="mt-1 text-xs text-white/80">
                        {Number(
                          experience.price,
                        ).toLocaleString(
                          'pt-AO',
                        )}{' '}
                        Kz
                      </p>

                    </div>

                  </div>

                </Link>
              ),
            )}

          </div>

        ) : (

          <div className="py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Grid3X3
                size={25}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-lg font-black">
              Ainda não existem experiências
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              Quando esta agência publicar experiências,
              elas aparecerão aqui.
            </p>

            <Link
              href="/agency/experiences/new"
              className="mt-5 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Criar experiência
            </Link>

          </div>

        )}

      </section>

      {/* ==========================================
          CONTACTOS
      ========================================== */}

      {(agency.phone ||
        agency.email ||
        agency.address) && (
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6">

          <div className="rounded-3xl bg-gray-50 p-5">

            <h2 className="text-sm font-black uppercase tracking-wider text-gray-500">
              Contactos
            </h2>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">

              {agency.phone && (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4">

                  <Phone
                    size={18}
                    className="text-orange-500"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Telefone
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {agency.phone}
                    </p>
                  </div>

                </div>
              )}

              {agency.email && (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4">

                  <Mail
                    size={18}
                    className="text-orange-500"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Email
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {agency.email}
                    </p>
                  </div>

                </div>
              )}

              {agency.address && (
                <div className="flex items-center gap-3 rounded-2xl bg-white p-4">

                  <MapPin
                    size={18}
                    className="text-orange-500"
                  />

                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase text-gray-400">
                      Endereço
                    </p>

                    <p className="mt-1 truncate text-sm font-semibold text-gray-800">
                      {agency.address}
                    </p>
                  </div>

                </div>
              )}

            </div>

          </div>

        </section>
      )}

    </main>
  )
}