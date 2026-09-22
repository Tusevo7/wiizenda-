
import { createClient } from '@/lib/supabase/server'
import ExperienceCard from './experience-card'

type Experience = {
  id: string
  title: string
  slug: string
  location: string | null
  price: number
  cover_image: string | null
  activity_start_at: string
  activity_end_at: string
  agency_id: string | null
}

type Agency = {
  id: string
  name: string
  logo_url: string | null
}

type Review = {
  experience_id: string
  rating: number
}

function shuffleExperiences(
  experiences: Experience[],
) {
  const shuffled = [...experiences]

  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(
      Math.random() * (i + 1),
    )

    ;[
      shuffled[i],
      shuffled[randomIndex],
    ] = [
      shuffled[randomIndex],
      shuffled[i],
    ]
  }

  return shuffled
}

export default async function FeaturedExperiences() {
  const supabase = await createClient()

  const now = new Date().toISOString()

  const {
    data: experiences,
    error,
  } = await supabase
    .from('experiences')
    .select(`
      id,
      title,
      slug,
      location,
      price,
      cover_image,
      activity_start_at,
      activity_end_at,
      agency_id
    `)
    .eq('status', 'published')
    .gt('activity_end_at', now)

  if (error) {
    console.error(
      'Erro ao carregar experiências:',
      error,
    )

    return null
  }

  if (!experiences || experiences.length === 0) {
    return (
      <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-gray-50 p-8 text-center">
          <p className="font-semibold">
            Ainda não existem passeios disponíveis.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            As agências ainda não publicaram novas atividades.
          </p>
        </div>
      </section>
    )
  }

  const typedExperiences =
    experiences as Experience[]

  /*
   * ============================
   * CARREGAR AGÊNCIAS
   * ============================
   */

  const agencyIds = Array.from(
    new Set(
      typedExperiences
        .map(
          (experience) =>
            experience.agency_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        ),
    ),
  )

  let agencies: Agency[] = []

  if (agencyIds.length > 0) {
    const {
      data: agencyData,
      error: agencyError,
    } = await supabase
      .from('agencies')
      .select(`
        id,
        name,
        logo_url
      `)
      .in('id', agencyIds)

    if (agencyError) {
      console.error(
        'Erro ao carregar agências:',
        agencyError,
      )
    } else {
      agencies =
        (agencyData ?? []) as Agency[]
    }
  }

  const agencyMap = new Map(
    agencies.map((agency) => [
      agency.id,
      agency,
    ]),
  )

  /*
   * ============================
   * CARREGAR AVALIAÇÕES
   * ============================
   */

  const experienceIds =
    typedExperiences.map(
      (experience) => experience.id,
    )

  const {
    data: reviews,
    error: reviewsError,
  } = await supabase
    .from('reviews')
    .select(`
      experience_id,
      rating
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

  const typedReviews =
    (reviews ?? []) as Review[]

  /*
   * ============================
   * CALCULAR MÉDIA
   * ============================
   */

  const ratingMap = new Map<
    string,
    number
  >()

  for (const experienceId of experienceIds) {
    const experienceReviews =
      typedReviews.filter(
        (review) =>
          review.experience_id ===
          experienceId,
      )

    if (
      experienceReviews.length === 0
    ) {
      ratingMap.set(
        experienceId,
        0,
      )

      continue
    }

    const total =
      experienceReviews.reduce(
        (sum, review) =>
          sum + Number(review.rating),
        0,
      )

    const average =
      total /
      experienceReviews.length

    ratingMap.set(
      experienceId,
      Number(average.toFixed(1)),
    )
  }

  /*
   * ============================
   * ORDEM ALEATÓRIA
   * ============================
   */

  const shuffledExperiences =
    shuffleExperiences(
      typedExperiences,
    )

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">

      {/* Cabeçalho */}
      <div className="flex items-end justify-between">
        <div>
          <div className="flex items-center gap-2">
         

            <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
              Descobre experiências
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Passeios e atividades publicados pelas agências.
          </p>
        </div>

        <a
          href="/explore"
          className="hidden items-center gap-1 text-sm font-bold text-orange-500 transition hover:text-orange-600 sm:flex"
        >
          Ver tudo
        </a>
      </div>

      {/* Feed */}
      <div className="mt-6 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {shuffledExperiences.map(
          (experience) => {
            const agency =
              experience.agency_id
                ? agencyMap.get(
                    experience.agency_id,
                  )
                : null

            return (
              <ExperienceCard
                key={experience.id}
                id={experience.id}
                slug={experience.slug}
                title={experience.title}
                location={
                  experience.location ||
                  'Angola'
                }
                price={`${Number(
                  experience.price,
                ).toLocaleString(
                  'pt-AO',
                )} Kz`}
                rating={
                  ratingMap.get(
                    experience.id,
                  ) ?? 0
                }
                image={
                  experience.cover_image ||
                  '/placeholder-experience.jpg'
                }
                activityStartAt={
                  experience.activity_start_at
                }
                agencyName={
                  agency?.name ||
                  'Agência'
                }
                agencyLogo={
                  agency?.logo_url ||
                  null
                }
              />
            )
          },
        )}
      </div>

    </section>
  )
}
