import { createClient } from '@/lib/supabase/server'
import ExperienceCard from './experience-card'

export default async function FeaturedExperiences() {
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
      price,
      cover_image
    `)
    .eq('status', 'published')
    .order('created_at', {
      ascending: false,
    })
    .limit(10)

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
        <div className="rounded-3xl bg-gray-50 p-8 text-center">
          <p className="font-semibold">
            Ainda não existem experiências publicadas.
          </p>

          <p className="mt-1 text-sm text-gray-500">
            Em breve teremos novidades.
          </p>
        </div>
      </section>
    )
  }

  const experienceIds = experiences.map(
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
    .in('experience_id', experienceIds)

  if (reviewsError) {
    console.error(
      'Erro ao carregar avaliações:',
      reviewsError,
    )
  }

  const ratingsByExperience =
    new Map<string, number[]>()

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

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">
            Experiências populares
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Lugares que merecem estar na tua lista.
          </p>
        </div>
      </div>

      <div className="mt-6 flex gap-5 overflow-x-auto pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
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
                experience.location || 'Angola'
              }
              price={`${Number(
                experience.price,
              ).toLocaleString('pt-AO')} Kz`}
              rating={rating}
              image={
                experience.cover_image ||
                '/placeholder-experience.jpg'
              }
            />
          )
        })}
      </div>
    </section>
  )
}