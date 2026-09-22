
import AppShell from '../components/app-shell'
import ExperienceCard from '../components/experience-card'
import { createClient } from '@/lib/supabase/server'

export default async function FavoritesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-12">
          <div className="rounded-3xl bg-gray-50 p-8 text-center">
            <h1 className="text-2xl font-black">
              Os teus favoritos
            </h1>

            <p className="mt-2 text-gray-500">
              Entra na tua conta para veres as experiências guardadas.
            </p>

            <a
              href="/login"
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
            >
              Entrar
            </a>
          </div>
        </main>
      </AppShell>
    )
  }

  const {
    data: favorites,
    error,
  } = await supabase
    .from('favorites')
    .select(`
      id,
      created_at,
      experiences (
        id,
        title,
        slug,
        location,
        city,
        province,
        price,
        cover_image,
        activity_start_at,
        agency_id
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(
      'Erro ao carregar favoritos:',
      error,
    )
  }

  const experiences =
    favorites
      ?.map((favorite) => favorite.experiences)
      .filter(Boolean) || []

  // ==========================================
  // CARREGAR AVALIAÇÕES EM LOTE
  // ==========================================

  const experienceIds = experiences.map(
    (experience: any) => experience.id,
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
      experiences
        .map(
          (experience: any) =>
            experience.agency_id,
        )
        .filter(
          (id): id is string =>
            Boolean(id),
        ),
    ),
  )

  let agencies: {
    id: string
    name: string
    logo_url: string | null
  }[] = []

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
      agencies = agencyData || []
    }
  }

  const agencyMap = new Map(
    agencies.map((agency) => [
      agency.id,
      agency,
    ]),
  )

  return (
    <AppShell>
      <main className="min-h-screen">

        <section className="mx-auto max-w-7xl px-5 pb-6 pt-8 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Guardados
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            Os teus favoritos
          </h1>

          <p className="mt-3 text-gray-500">
            Lugares e experiências que queres viver.
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-6 sm:px-6 lg:px-8">
          {experiences.length > 0 ? (
            <>
              <div className="mb-5">
                <h2 className="text-xl font-black">
                  {experiences.length}{' '}
                  {experiences.length === 1
                    ? 'experiência guardada'
                    : 'experiências guardadas'}
                </h2>
              </div>

              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {experiences.map(
                  (experience: any) => {
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
            </>
          ) : (
            <div className="rounded-[2rem] bg-gray-50 px-6 py-16 text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white shadow-sm">
                <span className="text-2xl">
                  ♡
                </span>
              </div>

              <h2 className="mt-5 text-xl font-black">
                Ainda não tens favoritos
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                Quando encontrares uma experiência
                que gostes, toca no coração para
                guardá-la aqui.
              </p>

              <a
                href="/explore"
                className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                Explorar experiências
              </a>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
