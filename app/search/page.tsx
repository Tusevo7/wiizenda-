
import AppShell from '@/app/components/app-shell'
import ExperienceCard from '@/app/components/experience-card'
import LocationFilter from '@/app/components/location-filter'
import PriceFilter from '@/app/components/price-filter'
import SearchPageBar from '@/app/components/search-page-bar'
import ActiveFilters from '@/app/components/active-filters'
import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

type SearchPageProps = {
  searchParams: Promise<{
    q?: string
    category?: string
    province?: string
    maxPrice?: string
  }>
}

type Agency = {
  id: string
  name: string
  logo_url: string | null
}

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams

  const query = params.q?.trim() || ''
  const category = params.category?.trim() || ''
  const province = params.province?.trim() || ''
  const maxPrice = params.maxPrice?.trim() || ''

  const supabase = await createClient()

  let experiences: any[] = []

  if (
    query ||
    category ||
    province ||
    maxPrice
  ) {
    let request = supabase
      .from('experiences')
      .select(`
        id,
        slug,
        title,
        province,
        city,
        location,
        price,
        cover_image,
        category,
        activity_start_at,
        agency_id
      `)
      .eq('status', 'published')

    if (query) {
      request = request.or(
        `title.ilike.%${query}%,province.ilike.%${query}%,city.ilike.%${query}%,location.ilike.%${query}%,category.ilike.%${query}%`,
      )
    }

    if (category) {
      request = request.eq('category', category)
    }

    if (province) {
      request = request.eq('province', province)
    }

    if (maxPrice) {
      request = request.lte(
        'price',
        Number(maxPrice),
      )
    }

    const {
      data,
      error,
    } = await request.order(
      'created_at',
      {
        ascending: false,
      },
    )

    if (error) {
      console.error(
        'Erro ao pesquisar experiências:',
        error,
      )
    }

    if (!error && data) {
      experiences = data
    }
  }

  // ==========================================
  // CARREGAR AVALIAÇÕES EM LOTE
  // ==========================================

  const experienceIds = experiences.map(
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
  // CARREGAR AGÊNCIAS EM LOTE
  // ==========================================

  const agencyIds = Array.from(
    new Set(
      experiences
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
        (agencyData || []) as Agency[]
    }
  }

  const agencyMap = new Map(
    agencies.map((agency) => [
      agency.id,
      agency,
    ]),
  )

  // ==========================================
  // TÍTULO
  // ==========================================

  const heading = query
    ? `Resultados para "${query}"`
    : category
      ? `Experiências de ${category}`
      : province
        ? `Experiências em ${province}`
        : maxPrice
          ? `Experiências até ${Number(
              maxPrice,
            ).toLocaleString('pt-AO')} Kz`
          : 'Explorar experiências'

  const hasFilters =
    !!query ||
    !!category ||
    !!province ||
    !!maxPrice

  return (
    <AppShell>
      <main className="min-h-screen bg-white">
        <section className="mx-auto max-w-7xl px-5 py-10 sm:px-6 lg:px-8">

          <div>
            <Link
              href="/"
              className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
            >
              ← Voltar
            </Link>

            <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">
              {heading}
            </h1>

            <p className="mt-2 text-gray-500">
              {hasFilters
                ? `${experiences.length} ${
                    experiences.length === 1
                      ? 'experiência encontrada'
                      : 'experiências encontradas'
                  }`
                : 'Descobre experiências incríveis em Angola.'}
            </p>

            <div className="mt-6 max-w-2xl">
              <SearchPageBar />
            </div>

            <ActiveFilters />

            <div className="mt-6 flex flex-col gap-3 sm:flex-row">
              <div className="w-full max-w-sm">
                <LocationFilter />
              </div>

              <div className="w-full max-w-sm">
                <PriceFilter />
              </div>
            </div>
          </div>

          {experiences.length > 0 ? (
            <div className="mt-8 grid gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
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
              })}
            </div>
          ) : hasFilters ? (
            <div className="mt-12 rounded-[2rem] bg-gray-50 px-6 py-16 text-center">
              <div className="mx-auto max-w-md">
                <h2 className="text-xl font-black">
                  Nenhuma experiência encontrada
                </h2>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  Não encontramos experiências
                  com os filtros selecionados.
                  Tenta alterar a categoria,
                  localização ou preço.
                </p>

                <Link
                  href="/"
                  className="mt-6 inline-flex rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                >
                  Explorar experiências
                </Link>
              </div>
            </div>
          ) : (
            <div className="mt-12 rounded-[2rem] bg-gray-50 px-6 py-16 text-center">
              <h2 className="text-xl font-black">
                Começa a explorar
              </h2>

              <p className="mt-2 text-sm text-gray-500">
                Pesquisa por praia, aventura,
                natureza, Luanda, Mussulo ou
                outro destino.
              </p>
            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
