
import AppShell from '../components/app-shell'
import SearchBar from '../components/search-bar'
import ExperienceCard from '../components/experience-card'
import { createClient } from '@/lib/supabase/server'

const categories = [
  'Todas',
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

type Experience = {
  id: string
  title: string
  slug: string
  location: string | null
  city: string | null
  province: string | null
  price: number
  cover_image: string | null
  activity_start_at: string | null
  activity_end_at: string | null
  agency_id: string | null
}

type Agency = {
  id: string
  name: string
}

export default async function ExplorePage() {
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
      city,
      province,
      price,
      cover_image,
      activity_start_at,
      activity_end_at,
      agency_id
    `)
    .eq('status', 'published')
    .gt('activity_end_at', now)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Erro ao carregar experiências:',
      error,
    )
  }

  const typedExperiences =
    (experiences || []) as Experience[]

  // ==========================================
  // CARREGAR AVALIAÇÕES EM LOTE
  // ==========================================

  const experienceIds =
    typedExperiences.map(
      (experience) => experience.id,
    )

  const ratingsByExperience =
    new Map<string, number[]>()

  if (experienceIds.length > 0) {
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

    for (const review of reviews || []) {
      const current =
        ratingsByExperience.get(
          review.experience_id,
        ) || []

      current.push(review.rating)

      ratingsByExperience.set(
        review.experience_id,
        current,
      )
    }
  }

  // ==========================================
  // CARREGAR AGÊNCIAS
  // ==========================================

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
        name
      `)
      .in('id', agencyIds)

    if (agencyError) {
      console.error(
        'Erro ao carregar agências:',
        agencyError,
      )
    } else {
      agencies =
        (agencyData || []) as Agency[]
    }
  }

  const agencyMap = new Map(
    agencies.map((agency) => [
      agency.id,
      agency.name,
    ]),
  )

  return (
    <AppShell>
      <main className="min-h-screen">

        {/* HEADER */}

        <section className="mx-auto max-w-7xl px-5 pb-6 pt-8 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Explorar
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            Descobre o teu próximo lugar.
          </h1>

          <p className="mt-3 max-w-xl text-gray-500">
            Explora experiências, destinos e aventuras
            incríveis em Angola.
          </p>

          <div className="mt-7 max-w-2xl">
            <SearchBar
              placeholder="Pesquisar experiências..."
            />
          </div>
        </section>

        {/* CATEGORIAS */}

        <section className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">
          <div className="flex gap-2 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {categories.map(
              (category, index) => (
                <button
                  key={category}
                  className={`shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition ${
                    index === 0
                      ? 'bg-gray-950 text-white'
                      : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                  }`}
                >
                  {category}
                </button>
              ),
            )}
          </div>
        </section>

        {/* RESULTADOS */}

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-5">
            <h2 className="text-xl font-black">
              Experiências
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {typedExperiences.length} experiências disponíveis
            </p>
          </div>

          {typedExperiences.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {typedExperiences.map(
                (experience) => {
                  const ratings =
                    ratingsByExperience.get(
                      experience.id,
                    ) || []

                  const rating =
                    ratings.length
                      ? Number(
                          (
                            ratings.reduce(
                              (
                                total,
                                value,
                              ) =>
                                total + value,
                              0,
                            ) /
                            ratings.length
                          ).toFixed(1),
                        )
                      : 0

                  return (
                    <ExperienceCard
                      key={experience.id}
                      id={experience.id}
                      slug={experience.slug}
                      title={experience.title}
                      location={
                        experience.location ||
                        experience.city ||
                        experience.province ||
                        'Angola'
                      }
                      price={`${Number(
                        experience.price,
                      ).toLocaleString(
                        'pt-AO',
                      )} Kz`}
                      rating={rating}
                      image={
                        experience.cover_image ||
                        '/placeholder-experience.jpg'
                      }
                      activityStartAt={
                        experience.activity_start_at ||
                        ''
                      }
                      agencyName={
                        experience.agency_id
                          ? agencyMap.get(
                              experience.agency_id,
                            ) ??
                            'Agência'
                          : 'Agência'
                      }
                    />
                  )
                },
              )}
            </div>
          ) : (
            <div className="rounded-3xl bg-gray-50 p-10 text-center">
              <h3 className="font-bold">
                Ainda não existem experiências.
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Em breve teremos novas experiências em Angola.
              </p>
            </div>
          )}
        </section>

      </main>
    </AppShell>
  )
}
