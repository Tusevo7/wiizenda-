
import Link from 'next/link'
import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import {
  ArrowLeft,
  BadgeCheck,
  Bookmark,
  Building2,
  CalendarDays,
  Grid3X3,
  Heart,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Star,
} from 'lucide-react'
import { notFound } from 'next/navigation'

type AgencyPageProps = {
  params: Promise<{
    slug: string
  }>
}

type Experience = {
  id: string
  title: string
  slug: string
  category: string
  location: string | null
  city: string | null
  province: string | null
  price: number
  cover_image: string | null
}

type Review = {
  id: string
  experience_id: string
  rating: number
  comment: string | null
}

type CommunityPost = {
  id: string
  media_url: string
  media_type: string
  caption: string | null
  location: string | null
  rating: number | null
  created_at: string
}

export default async function AgencyPublicPage({
  params,
}: AgencyPageProps) {
  const { slug } = await params

  const supabase = await createClient()

  // ==========================================
  // AGÊNCIA
  // ==========================================

  const {
    data: agency,
    error,
  } = await supabase
    .from('agencies')
    .select(`
      id,
      owner_id,
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
    .eq('slug', slug)
    .eq('status', 'approved')
    .maybeSingle()

  if (error) {
    console.error(
      'Erro ao carregar agência:',
      error,
    )
  }

  if (!agency) {
    notFound()
  }

  // ==========================================
  // EXPERIÊNCIAS
  // ==========================================

  const {
    data: experiences,
    error: experiencesError,
  } = await supabase
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
    console.error(
      'Erro ao carregar experiências:',
      experiencesError,
    )
  }

  const agencyExperiences =
    (experiences || []) as Experience[]

  const experienceIds =
    agencyExperiences.map(
      (experience) => experience.id,
    )

  // ==========================================
  // AVALIAÇÕES
  // ==========================================

  let reviews: Review[] = []

  if (experienceIds.length > 0) {
    const {
      data: reviewData,
      error: reviewsError,
    } = await supabase
      .from('reviews')
      .select(`
        id,
        experience_id,
        rating,
        comment
      `)
      .in(
        'experience_id',
        experienceIds,
      )

    if (reviewsError) {
      console.error(
        'Erro ao carregar avaliações:',
        reviewsError,
      )
    }

    reviews =
      (reviewData || []) as Review[]
  }

  const averageRating =
    reviews.length > 0
      ? Number(
          (
            reviews.reduce(
              (total, review) =>
                total + Number(review.rating),
              0,
            ) / reviews.length
          ).toFixed(1),
        )
      : 0

  // ==========================================
  // PUBLICAÇÕES DA AGÊNCIA
  // ==========================================

  const {
    data: postData,
    error: postsError,
  } = await supabase
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
    .eq('user_id', agency.owner_id)
    .eq('post_type', 'agency')
    .order('created_at', {
      ascending: false,
    })

  if (postsError) {
    console.error(
      'Erro ao carregar publicações:',
      postsError,
    )
  }

  const posts =
    (postData || []) as CommunityPost[]

  const postIds = posts.map(
    (post) => post.id,
  )

  // ==========================================
  // LIKES
  // ==========================================

  let totalLikes = 0

  if (postIds.length > 0) {
    const { count, error: likesError } =
      await supabase
        .from('community_likes')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .in('post_id', postIds)

    if (likesError) {
      console.error(
        'Erro ao contar likes:',
        likesError,
      )
    }

    totalLikes = count || 0
  }

  // ==========================================
  // COMENTÁRIOS
  // ==========================================

  let totalComments = 0

  if (postIds.length > 0) {
    const {
      count,
      error: commentsError,
    } = await supabase
      .from('community_comments')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('post_id', postIds)

    if (commentsError) {
      console.error(
        'Erro ao contar comentários:',
        commentsError,
      )
    }

    totalComments = count || 0
  }

  // ==========================================
  // GUARDADOS
  // ==========================================

  let totalSaves = 0

  if (postIds.length > 0) {
    const {
      count,
      error: savesError,
    } = await supabase
      .from('community_saves')
      .select('id', {
        count: 'exact',
        head: true,
      })
      .in('post_id', postIds)

    if (savesError) {
      console.error(
        'Erro ao contar guardados:',
        savesError,
      )
    }

    totalSaves = count || 0
  }

  const totalInteractions =
    totalLikes +
    totalComments +
    totalSaves

  // ==========================================
  // HELPERS
  // ==========================================

  function compactNumber(value: number) {
    return new Intl.NumberFormat('pt-AO', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value)
  }

  function getExperienceRating(
    experienceId: string,
  ) {
    const experienceReviews =
      reviews.filter(
        (review) =>
          review.experience_id ===
          experienceId,
      )

    if (experienceReviews.length === 0) {
      return 0
    }

    return Number(
      (
        experienceReviews.reduce(
          (total, review) =>
            total + Number(review.rating),
          0,
        ) / experienceReviews.length
      ).toFixed(1),
    )
  }

  const location =
    agency.address ||
    agency.city ||
    agency.province ||
    'Angola'

  return (
    <AppShell>
      <main className="min-h-screen bg-white">

        {/* ======================================
            HEADER
        ====================================== */}

        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">

          <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4 sm:px-6">

            <Link
              href="/explore"
              className="flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-gray-100"
              aria-label="Voltar"
            >
              <ArrowLeft size={19} />
            </Link>

            <span className="text-base font-black text-gray-950">
              {agency.name}
            </span>

            <div className="w-9" />

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
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-gray-950 via-gray-800 to-orange-500">
                <Building2
                  size={60}
                  className="text-white/30"
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
              <p className="mt-4 max-w-2xl whitespace-pre-line text-sm leading-6 text-gray-700">
                {agency.description}
              </p>
            )}

            {/* LOCALIZAÇÃO */}

            <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">

              <MapPin size={15} />

              <span>{location}</span>

            </div>

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
                  agencyExperiences.length,
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
                  size={15}
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
            INTERAÇÕES
        ====================================== */}

        <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">

          <div className="flex flex-wrap gap-2">

            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <MessageCircle size={14} />
              {compactNumber(totalComments)}
              {' '}
              comentários
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
              <Bookmark size={14} />
              {compactNumber(totalSaves)}
              {' '}
              guardados
            </div>

            <div className="flex items-center gap-1.5 rounded-full bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-600">
              <Heart size={14} />
              {compactNumber(totalInteractions)}
              {' '}
              interações
            </div>

            {reviews.length > 0 && (
              <div className="flex items-center gap-1.5 rounded-full bg-yellow-50 px-3 py-2 text-xs font-semibold text-yellow-700">
                <Star
                  size={14}
                  className="fill-yellow-500 text-yellow-500"
                />
                {reviews.length}
                {' '}
                avaliações
              </div>
            )}

          </div>

        </section>

        {/* ======================================
            CONTACTOS
        ====================================== */}

        {(agency.phone || agency.email) && (
          <section className="mx-auto max-w-5xl px-4 pt-5 sm:px-6">

            <div className="flex flex-col gap-2 sm:flex-row">

              {agency.phone && (
                <a
                  href={`tel:${agency.phone}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  <Phone size={16} />
                  Contactar
                </a>
              )}

              {agency.email && (
                <a
                  href={`mailto:${agency.email}`}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-50"
                >
                  <Mail size={16} />
                  Email
                </a>
              )}

            </div>

          </section>
        )}

        {/* ======================================
            TABS
        ====================================== */}

        <section className="mx-auto mt-7 max-w-5xl">

          <div className="flex border-b border-gray-100">

            <a
              href="#publicacoes"
              className="flex flex-1 items-center justify-center gap-2 border-b-2 border-gray-950 py-4 text-xs font-black uppercase tracking-wider text-gray-950"
            >
              <Grid3X3 size={15} />
              Publicações
            </a>

            <a
              href="#experiencias"
              className="flex flex-1 items-center justify-center gap-2 py-4 text-xs font-black uppercase tracking-wider text-gray-400"
            >
              <Building2 size={15} />
              Experiências
            </a>

          </div>

        </section>

        {/* ======================================
            PUBLICAÇÕES
        ====================================== */}

        <section
          id="publicacoes"
          className="mx-auto max-w-5xl"
        >

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
                      alt={
                        post.caption ||
                        'Publicação da agência'
                      }
                      className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                    />
                  )}

                  <div className="absolute inset-0 bg-black/0 transition group-hover:bg-black/20" />

                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-10 opacity-0 transition group-hover:opacity-100">

                    <div className="flex items-center gap-3 text-xs font-bold text-white">

                      <span className="flex items-center gap-1">
                        <Heart size={13} />
                        Publicação
                      </span>

                      {post.rating && (
                        <span className="flex items-center gap-1">
                          <Star
                            size={13}
                            className="fill-orange-400 text-orange-400"
                          />
                          {post.rating}
                        </span>
                      )}

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
                Esta agência ainda não publicou
                conteúdo na comunidade.
              </p>

            </div>

          )}

        </section>

        {/* ======================================
            EXPERIÊNCIAS
        ====================================== */}

        <section
          id="experiencias"
          className="mx-auto max-w-6xl px-5 py-12 sm:px-6 lg:px-8"
        >

          <div>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-orange-500">
              Experiências
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
              Vive algo com {agency.name}
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              Descobre as experiências publicadas por esta agência.
            </p>

          </div>

          {agencyExperiences.length > 0 ? (

            <div className="mt-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {agencyExperiences.map(
                (experience) => {
                  const rating =
                    getExperienceRating(
                      experience.id,
                    )

                  return (
                    <Link
                      key={experience.id}
                      href={`/experience/${experience.slug}`}
                      className="group overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >

                      <div className="relative h-64 overflow-hidden bg-gray-100">

                        {experience.cover_image ? (
                          <img
                            src={
                              experience.cover_image
                            }
                            alt={
                              experience.title
                            }
                            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center">
                            <Building2
                              size={42}
                              className="text-gray-300"
                            />
                          </div>
                        )}

                        <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold backdrop-blur">
                          {experience.category}
                        </span>

                      </div>

                      <div className="p-5">

                        <h3 className="line-clamp-2 text-lg font-black">
                          {experience.title}
                        </h3>

                        <p className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin size={14} />

                          {experience.location ||
                            experience.city ||
                            experience.province ||
                            'Angola'}
                        </p>

                        <div className="mt-5 flex items-end justify-between gap-3">

                          <div>

                            <p className="text-xs text-gray-400">
                              A partir de
                            </p>

                            <p className="mt-0.5 text-lg font-black text-gray-950">
                              {Number(
                                experience.price,
                              ).toLocaleString(
                                'pt-AO',
                              )}{' '}
                              Kz
                            </p>

                          </div>

                          {rating > 0 && (
                            <span className="flex items-center gap-1 text-sm font-bold text-gray-800">

                              <Star
                                size={14}
                                className="fill-orange-500 text-orange-500"
                              />

                              {rating}

                            </span>
                          )}

                        </div>

                      </div>

                    </Link>
                  )
                },
              )}

            </div>

          ) : (

            <div className="mt-7 rounded-3xl bg-gray-50 p-10 text-center">

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
