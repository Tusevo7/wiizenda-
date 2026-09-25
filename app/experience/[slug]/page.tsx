import Link from 'next/link'
import {
  ArrowLeft,
  Clock3,
  MapPin,
  Star,
  Users,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import AppShell from '@/app/components/app-shell'
import ContactAgencyButton from '@/app/components/contact-agency-button'
import ReviewForm from '@/app/components/review-form'
import ExperienceMusic from '@/app/components/experience-music'

type ExperiencePageProps = {
  params: Promise<{
    slug: string
  }>
}

export default async function ExperiencePage({
  params,
}: ExperiencePageProps) {
  const { slug } = await params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: experience, error } = await supabase
    .from('experiences')
    .select(`
      id,
      title,
      slug,
      description,
      category,
      province,
      city,
      location,
      music_title,
      music_artist,
      music_url,
      music_start_seconds,
      music_duration_seconds,
      price,
      duration_hours,
      capacity,
      cover_image,
      agency_id,
      agencies (
        id,
        name,
        slug,
        logo_url,
        city,
        province
      )
    `)
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error || !experience) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h1 className="text-3xl font-black">
            Experiência não encontrada
          </h1>

          <p className="mt-3 text-gray-500">
            Esta experiência pode ter sido removida ou ainda
            não está publicada.
          </p>

          <Link
            href="/explore"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Voltar a explorar
          </Link>
        </main>
      </AppShell>
    )
  }

  /*
   * Reviews são carregadas separadamente.
   * Não colocamos reviews dentro da query de experiences
   * para evitar problemas de relacionamento no Supabase.
   */
  const {
    data: reviews,
    error: reviewsError,
  } = await supabase
    .from('reviews')
    .select(`
      id,
      rating,
      comment,
      created_at,
      user_id
    `)
    .eq('experience_id', experience.id)
    .order('created_at', {
      ascending: false,
    })

  if (reviewsError) {
    console.error(
      'Erro ao carregar avaliações:',
      reviewsError,
    )
  }

  const experienceReviews = reviews || []

  const reviewCount =
    experienceReviews.length

  const averageRating =
    reviewCount > 0
      ? Number(
          (
            experienceReviews.reduce(
              (total, review) =>
                total + review.rating,
              0,
            ) / reviewCount
          ).toFixed(1),
        )
      : 0

  /*
   * Descobre se o utilizador autenticado tem
   * alguma reserva que já pode ser avaliada.
   */
  let reviewableBookings: {
    booking_id: string
    booking_date: string
    guests: number
    already_reviewed: boolean
  }[] = []

  if (user) {
    const {
      data,
      error,
    } = await supabase.rpc(
      'get_reviewable_bookings',
      {
        p_experience_id: experience.id,
      },
    )

    if (error) {
      console.error(
        'Erro ao verificar reservas avaliáveis:',
        error,
      )
    } else {
      reviewableBookings = data || []
    }
  }

  const availableReviewBooking =
    reviewableBookings.find(
      (booking) =>
        !booking.already_reviewed,
    )

  const price = Number(experience.price)

  const agency = Array.isArray(experience.agencies)
    ? experience.agencies[0]
    : experience.agencies

  return (
    <AppShell>
      <main className="min-h-screen bg-white">
        {/* Voltar */}
        <section className="mx-auto max-w-7xl px-5 pt-5 sm:px-6 lg:px-8">
          <Link
            href="/explore"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>
        </section>

        {/* Imagem + Player de música */}
        <section className="mx-auto mt-5 max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="relative overflow-hidden rounded-[2rem] bg-gray-100">
            <img
              src={
                experience.cover_image ||
                '/placeholder-experience.jpg'
              }
              alt={experience.title}
              className="h-[320px] w-full object-cover sm:h-[480px] lg:h-[560px]"
            />

            {/* Player sobre a imagem */}
            <div className="absolute top-4 left-4 right-4 z-20 sm:top-5 sm:left-5 sm:right-5">
              <ExperienceMusic
                musicTitle={experience.music_title}
                musicArtist={experience.music_artist}
                musicUrl={experience.music_url}
                musicStartSeconds={
                  experience.music_start_seconds
                }
                musicDurationSeconds={
                  experience.music_duration_seconds
                }
              />
            </div>
          </div>
        </section>

        {/* Conteúdo */}
        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[1fr_380px]">
            {/* Principal */}
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
                  {experience.category}
                </span>

                <div className="flex items-center gap-1 text-sm font-semibold">
                  <Star
                    size={16}
                    className={
                      reviewCount > 0
                        ? 'fill-orange-500 text-orange-500'
                        : 'text-gray-300'
                    }
                  />

                  {reviewCount > 0
                    ? averageRating
                    : 'Sem avaliações'}
                </div>
              </div>

              <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                {experience.title}
              </h1>

              <div className="mt-4 flex items-center gap-2 text-gray-500">
                <MapPin size={18} />

                <span>
                  {experience.location ||
                    experience.city ||
                    experience.province}
                </span>
              </div>

              {/* Informações */}
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-gray-50 p-4">
                  <Clock3
                    size={20}
                    className="text-orange-500"
                  />

                  <p className="mt-3 text-xs text-gray-500">
                    Duração
                  </p>

                  <p className="mt-1 font-bold">
                    {experience.duration_hours
                      ? `${experience.duration_hours} horas`
                      : 'A consultar'}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <Users
                    size={20}
                    className="text-orange-500"
                  />

                  <p className="mt-3 text-xs text-gray-500">
                    Capacidade
                  </p>

                  <p className="mt-1 font-bold">
                    {experience.capacity
                      ? `${experience.capacity} pessoas`
                      : 'A consultar'}
                  </p>
                </div>

                <div className="rounded-2xl bg-gray-50 p-4">
                  <MapPin
                    size={20}
                    className="text-orange-500"
                  />

                  <p className="mt-3 text-xs text-gray-500">
                    Localização
                  </p>

                  <p className="mt-1 font-bold">
                    {experience.province}
                  </p>
                </div>
              </div>

              {/* Descrição */}
              <div className="mt-10">
                <h2 className="text-2xl font-black">
                  Sobre esta experiência
                </h2>

                <p className="mt-4 max-w-3xl text-justify leading-8 text-gray-600">
                  {experience.description ||
                    'Esta experiência ainda não possui uma descrição.'}
                </p>
              </div>

              {/* Avaliações */}
              <section className="mt-10 border-t border-gray-100 pt-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                      Avaliações
                    </p>

                    <h2 className="mt-2 text-2xl font-black">
                      O que dizem os viajantes
                    </h2>
                  </div>

                  {reviewCount > 0 && (
                    <div className="flex items-center gap-2 rounded-2xl bg-orange-50 px-4 py-3">
                      <Star
                        size={20}
                        className="fill-orange-500 text-orange-500"
                      />

                      <div>
                        <p className="font-black">
                          {averageRating}/5
                        </p>

                        <p className="text-xs text-gray-500">
                          {reviewCount}{' '}
                          {reviewCount === 1
                            ? 'avaliação'
                            : 'avaliações'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {experienceReviews.length > 0 ? (
                  <div className="mt-6 space-y-4">
                    {experienceReviews.map(
                      (review) => (
                        <article
                          key={review.id}
                          className="rounded-3xl border border-gray-200 bg-white p-5"
                        >
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map(
                              (star) => (
                                <Star
                                  key={star}
                                  size={16}
                                  className={
                                    star <=
                                    review.rating
                                      ? 'fill-orange-500 text-orange-500'
                                      : 'text-gray-300'
                                  }
                                />
                              ),
                            )}
                          </div>

                          {review.comment && (
                            <p className="mt-3 leading-7 text-gray-600">
                              {review.comment}
                            </p>
                          )}

                          <p className="mt-3 text-xs text-gray-400">
                            {new Date(
                              review.created_at,
                            ).toLocaleDateString(
                              'pt-AO',
                            )}
                          </p>
                        </article>
                      ),
                    )}
                  </div>
                ) : (
                  <div className="mt-6 rounded-3xl bg-gray-50 p-6">
                    <p className="font-semibold">
                      Ainda não existem avaliações.
                    </p>

                    <p className="mt-1 text-sm text-gray-500">
                      Sê o primeiro a contar como foi a tua experiência.
                    </p>
                  </div>
                )}

                {/* Formulário para reserva elegível */}
                {availableReviewBooking && (
                  <div className="mt-8">
                    <ReviewForm
                      experienceId={
                        experience.id
                      }
                      bookingId={
                        availableReviewBooking.booking_id
                      }
                    />
                  </div>
                )}
              </section>

              {/* Agência */}
              {agency && (
                <section className="mt-10 border-t border-gray-100 pt-8">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-orange-500">
                    Organizado por
                  </p>

                  <div className="mt-4 rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gray-100">
                          {agency.logo_url ? (
                            <img
                              src={agency.logo_url}
                              alt={agency.name}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xl font-black text-gray-400">
                              {agency.name
                                .charAt(0)
                                .toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-lg font-black">
                              {agency.name}
                            </h2>

                            <span className="rounded-full bg-green-50 px-2.5 py-1 text-[10px] font-bold text-green-700">
                              Verificada
                            </span>
                          </div>

                          <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">
                            <MapPin size={14} />

                            {agency.city ||
                              agency.province ||
                              'Angola'}
                          </p>
                        </div>
                      </div>

                      <Link
                        href={`/agency/${agency.slug}`}
                        className="flex w-full items-center justify-center rounded-2xl border border-gray-200 px-5 py-3 text-sm font-bold transition hover:bg-gray-50 sm:w-auto"
                      >
                        Ver agência
                      </Link>
                    </div>
                  </div>
                </section>
              )}
            </div>

            {/* Card de reserva */}
            <aside className="lg:sticky lg:top-24 lg:h-fit">
              <div className="rounded-[2rem] border border-gray-200 bg-white p-6 shadow-xl shadow-gray-200/40">
                <p className="text-sm text-gray-500">
                  A partir de
                </p>

                <div className="mt-1 flex items-end gap-2">
                  <span className="text-3xl font-black">
                    {price.toLocaleString('pt-AO')} Kz
                  </span>

                  <span className="pb-1 text-sm text-gray-500">
                    / pessoa
                  </span>
                </div>

                <div className="my-6 h-px bg-gray-100" />

                <Link
                  href={`/experience/${experience.slug}/book`}
                  className="flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 active:scale-[0.98]"
                >
                  Reservar experiência
                </Link>

                <ContactAgencyButton
                  agencyId={experience.agency_id}
                  experienceId={experience.id}
                />

                <p className="mt-4 text-center text-xs text-gray-400">
                  Não será cobrado nenhum valor agora.
                </p>
              </div>
            </aside>
          </div>
        </section>
      </main>
    </AppShell>
  )
}