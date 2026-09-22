
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  BadgeCheck,
  Building2,
  Grid3X3,
  Heart,
  MapPin,
  MessageCircle,
  Bookmark,
  Star,
  Pencil,
  Mail,
  Phone,
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

  // ==========================================
  // AGÊNCIA
  // ==========================================

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
  // EXPERIÊNCIAS
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
      status,
      activity_start_at
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

  const experienceIds =
    agencyExperiences.map(
      (experience) => experience.id,
    )

  // ==========================================
  // AVALIAÇÕES RECEBIDAS
  // ==========================================

  let receivedReviews: {
    id: string
    user_id: string
    experience_id: string
    rating: number
    comment: string | null
  }[] = []

  if (experienceIds.length > 0) {
    const { data } = await supabase
      .from('reviews')
      .select(`
        id,
        user_id,
        experience_id,
        rating,
        comment
      `)
      .in(
        'experience_id',
        experienceIds,
      )

    receivedReviews = data || []
  }

  const averageRating =
    receivedReviews.length > 0
      ? Number(
          (
            receivedReviews.reduce(
              (total, review) =>
                total + Number(review.rating),
              0,
            ) / receivedReviews.length
          ).toFixed(1),
        )
      : 0

  // ==========================================
  // PUBLICAÇÕES / REVIEWS DA AGÊNCIA
  // ==========================================

  const { data: agencyPosts } =
    await supabase
      .from('community_posts')
      .select(`
        id,
        media_url,
        media_type,
        caption,
        location,
        rating,
        created_at
      `)
      .eq('user_id', user.id)
      .eq('post_type', 'agency')
      .order('created_at', {
        ascending: false,
      })

  const posts = agencyPosts || []

  const postIds = posts.map(
    (post) => post.id,
  )

  // ==========================================
  // LIKES
  // ==========================================

  let totalLikes = 0

  if (postIds.length > 0) {
    const { count } = await supabase
      .from('community_likes')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('post_id', postIds)

    totalLikes = count || 0
  }

  // ==========================================
  // COMENTÁRIOS
  // ==========================================

  let totalComments = 0

  if (postIds.length > 0) {
    const { count } = await supabase
      .from('community_comments')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('post_id', postIds)

    totalComments = count || 0
  }

  // ==========================================
  // GUARDADOS
  // ==========================================

  let totalSaves = 0

  if (postIds.length > 0) {
    const { count } = await supabase
      .from('community_saves')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('post_id', postIds)

    totalSaves = count || 0
  }

  const totalInteractions =
    totalLikes +
    totalComments +
    totalSaves

  // ==========================================
  // FORMATAÇÃO
  // ==========================================

  function compactNumber(value: number) {
    return new Intl.NumberFormat('pt-AO', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  return (
    <main className="min-h-screen bg-white">

      {/* ======================================
          HEADER
      ====================================== */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">

          <Link
            href="/agency"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-950"
          >
            ← Painel
          </Link>

          <span className="text-base font-black text-gray-950">
            Perfil
          </span>

          <Link
            href="/agency/profile/edit"
            aria-label="Editar perfil"
            className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <Pencil size={17} />
          </Link>

        </div>

      </header>

      {/* ======================================
          PERFIL
      ====================================== */}

      <section className="mx-auto max-w-5xl px-4 pt-4 sm:px-6">

        {/* CAPA */}

        <div className="relative h-52 overflow-hidden rounded-3xl bg-gray-100 sm:h-72 md:h-80">

          {agency.cover_image ? (
            <img
              src={agency.cover_image}
              alt={`Capa da ${agency.name}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600">
              <Building2
                size={50}
                className="text-white/60"
              />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        </div>

        {/* INFORMAÇÕES */}

        <div className="relative px-1 sm:px-5">

          {/* LOGO */}

          <div className="-mt-14 flex items-end justify-between sm:-mt-16">

            <div className="h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-orange-50 shadow-xl sm:h-32 sm:w-32">

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

            <div className="flex flex-wrap items-center gap-2">

              <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                {agency.name}
              </h1>

              {agency.is_verified && (
                <BadgeCheck
                  size={21}
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

          {/* MOBILE EDITAR */}

          <Link
            href="/agency/profile/edit"
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 py-2.5 text-sm font-bold text-gray-800 sm:hidden"
          >
            <Pencil size={15} />
            Editar perfil
          </Link>

        </div>

      </section>

      {/* ======================================
          ESTATÍSTICAS
      ====================================== */}

      <section className="mx-auto mt-7 max-w-5xl border-y border-gray-100">

        <div className="grid grid-cols-4">

          <div className="px-2 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {compactNumber(posts.length)}
            </p>

            <p className="mt-1 text-[11px] text-gray-500">
              Publicações
            </p>
          </div>

          <div className="border-x border-gray-100 px-2 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {compactNumber(
                publishedExperiences.length,
              )}
            </p>

            <p className="mt-1 text-[11px] text-gray-500">
              Experiências
            </p>
          </div>

          <div className="border-r border-gray-100 px-2 py-5 text-center">
            <p className="text-xl font-black text-gray-950">
              {compactNumber(totalLikes)}
            </p>

            <p className="mt-1 flex items-center justify-center gap-1 text-[11px] text-gray-500">
              <Heart size={11} />
              Likes
            </p>
          </div>

          <div className="px-2 py-5 text-center">
            <div className="flex items-center justify-center gap-1">
              <Star
                size={16}
                className="fill-orange-400 text-orange-400"
              />

              <p className="text-xl font-black text-gray-950">
                {averageRating || '—'}
              </p>
            </div>

            <p className="mt-1 text-[11px] text-gray-500">
              Avaliação
            </p>
          </div>

        </div>

      </section>

      {/* ======================================
          SEGUNDA LINHA DE MÉTRICAS
      ====================================== */}

      <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">

        <div className="flex flex-wrap items-center gap-2">

          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            <MessageCircle size={14} />
            {compactNumber(totalComments)} comentários
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            <Bookmark size={14} />
            {compactNumber(totalSaves)} guardados
          </div>

          <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600">
            <Heart size={14} />
            {compactNumber(totalInteractions)} interações
          </div>

        </div>

      </section>

      {/* ======================================
          TABS
      ====================================== */}

      <section className="mx-auto mt-6 max-w-5xl">

        <div className="flex border-b border-gray-100">

          <div className="flex flex-1 items-center justify-center gap-2 border-b-2 border-gray-950 py-4 text-xs font-black uppercase tracking-wider text-gray-950">
            <Grid3X3 size={15} />
            Publicações
          </div>

          <div className="flex flex-1 items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-wider text-gray-400">
            <Building2 size={15} />
            Experiências
          </div>

        </div>

      </section>

      {/* ======================================
          PUBLICAÇÕES DA AGÊNCIA
      ====================================== */}

      <section className="mx-auto max-w-5xl px-1 sm:px-4">

        {posts.length > 0 ? (

          <div className="grid grid-cols-2 gap-1 py-1 sm:grid-cols-3 sm:gap-2">

            {posts.map((post) => (
              <Link
                key={post.id}
                href={`/review/${post.id}`}
                className="group relative aspect-square overflow-hidden bg-gray-100"
              >

                {post.media_type === 'video' ? (
                  <video
                    src={post.media_url}
                    className="h-full w-full object-cover"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={post.media_url}
                    alt={post.caption || 'Publicação'}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                  />
                )}

                {/* OVERLAY */}

                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 opacity-0 transition group-hover:opacity-100">

                  <div className="flex items-center gap-3 text-xs font-bold text-white">

                    {post.rating && (
                      <span className="flex items-center gap-1">
                        <Star
                          size={13}
                          className="fill-orange-400 text-orange-400"
                        />
                        {post.rating}
                      </span>
                    )}

                    <span className="flex items-center gap-1">
                      <Heart size={13} />
                      {/* O número individual será mostrado
                          quando abrirmos o post */}
                    </span>

                  </div>

                </div>

              </Link>
            ))}

          </div>

        ) : (

          <div className="px-5 py-20 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Grid3X3
                size={25}
                className="text-gray-400"
              />
            </div>

            <h2 className="mt-5 text-lg font-black">
              Ainda não existem publicações
            </h2>

            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
              As publicações e reviews da agência
              aparecerão aqui.
            </p>

          </div>

        )}

      </section>

      {/* ======================================
          CONTACTOS
      ====================================== */}

      {(agency.phone ||
        agency.email ||
        agency.address) && (
        <section className="mx-auto max-w-5xl px-4 pb-12 pt-10 sm:px-6">

          <div className="rounded-3xl bg-gray-50 p-5">

            <h2 className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">
              Contactos da agência
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
