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

export default async function ExplorePage() {
  const supabase = await createClient()

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
      cover_image
    `)
    .eq('status', 'published')
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Erro ao carregar experiências:',
      error,
    )
  }

  // ==========================================
  // CARREGAR AVALIAÇÕES EM LOTE
  // ==========================================

  const experienceIds =
    experiences?.map(
      (experience) => experience.id,
    ) || []

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
            {categories.map((category, index) => (
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
            ))}
          </div>
        </section>

        {/* RESULTADOS */}

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="mb-5">
            <h2 className="text-xl font-black">
              Experiências
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              {experiences?.length || 0} experiências disponíveis
            </p>
          </div>

          {experiences && experiences.length > 0 ? (
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {experiences.map((experience) => {
                const ratings =
                  ratingsByExperience.get(
                    experience.id,
                  ) || []

                const rating = ratings.length
                  ? Number(
                      (
                        ratings.reduce(
                          (total, value) =>
                            total + value,
                          0,
                        ) / ratings.length
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
                      experience.province
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
                  />
                )
              })}
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