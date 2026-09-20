
import Link from 'next/link'
import {
  ArrowRight,
  CalendarDays,
  ChevronRight,
  MapPin,
  Search,
  Star,
} from 'lucide-react'

import AppShell from './components/app-shell'
import CategoryChip from './components/category-chip'
import HomeSearch from './components/home-search'
import FeaturedExperiences from './components/featured-experiences'

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

const popularExperiences = [
  {
    title: 'Ilha do Mussulo',
    location: 'Luanda',
    rating: '4.8',
    reviews: '128 avaliações',
  },
  {
    title: 'Cabo Ledo',
    location: 'Luanda',
    rating: '4.7',
    reviews: '96 avaliações',
  },
  {
    title: 'Serra da Leba',
    location: 'Huíla',
    rating: '4.9',
    reviews: '84 avaliações',
  },
  {
    title: 'Quedas de Kalandula',
    location: 'Malanje',
    rating: '4.8',
    reviews: '72 avaliações',
  },
]

const weekendPlaces = [
  {
    name: 'Mussulo',
    location: 'Luanda',
    type: 'Praia',
  },
  {
    name: 'Serra da Leba',
    location: 'Huíla',
    type: 'Natureza',
  },
  {
    name: 'Cabo Ledo',
    location: 'Luanda',
    type: 'Praia',
  },
]

export default function Home() {
  return (
    <AppShell>
      <main className="min-h-screen bg-[#FAFAFA] pb-8">

        {/* DESKTOP INTRO */}
        <section className="hidden bg-gray-950 sm:block">
          <div className="mx-auto max-w-7xl px-6 py-16 lg:px-8">

            <div className="max-w-3xl">

              <span className="inline-flex rounded-full bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-400">
                Descobre Angola 🇦🇴
              </span>

              <h1 className="mt-5 text-5xl font-black leading-[1.02] tracking-tight text-white lg:text-6xl">
                A tua próxima
                <br />
                experiência
                <br />
                <span className="text-orange-500">
                  começa aqui.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-lg leading-8 text-gray-300">
                Descobre lugares, experiências, eventos e
                destinos incríveis em Angola.
              </p>

            </div>

          </div>
        </section>

        {/* SEARCH */}
        <section className="relative z-10 mx-auto max-w-7xl px-5 pt-5 sm:-mt-8 sm:px-6 lg:px-8">

          <div className="rounded-[4px] border border-gray-100 bg-white p-3 shadow-sm sm:p-4">

            <HomeSearch />

            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-[4px] bg-orange-500 px-4 py-2.5 text-sm font-bold text-white"
              >
                <MapPin size={15} />
                Província
              </button>

              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-[4px] bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                <CalendarDays size={15} />
                Data
              </button>

              <button
                type="button"
                className="flex shrink-0 items-center gap-2 rounded-[4px] bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-700"
              >
                <Search size={15} />
                Explorar
              </button>

            </div>

          </div>

        </section>

        {/* CATEGORIAS */}
        <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between">

            <div>
              <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                Explora por categoria
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Encontra algo que combina contigo.
              </p>
            </div>

            <Link
              href="/explore"
              className="hidden items-center gap-1 text-sm font-bold text-orange-500 sm:flex"
            >
              Ver tudo
              <ChevronRight size={16} />
            </Link>

          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {categories.map((category, index) => (
              <CategoryChip
                key={category}
                name={category}
                active={index === 0}
              />
            ))}

          </div>

        </section>

        {/* EXPERIÊNCIAS POPULARES */}
        <section className="mx-auto max-w-7xl px-5 pt-9 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between">

            <div>
              <div className="flex items-center gap-2">

                <span className="text-xl">
                  🔥
                </span>

                <h2 className="text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                  Experiências populares
                </h2>

              </div>

              <p className="mt-1 text-sm text-gray-500">
                As mais avaliadas pela comunidade.
              </p>
            </div>

            <Link
              href="/explore?sort=popular"
              className="flex items-center gap-1 text-sm font-bold text-orange-500"
            >
              Ver
              <ChevronRight size={16} />
            </Link>

          </div>

          <div className="mt-5 flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {popularExperiences.map((experience) => (
              <Link
                key={experience.title}
                href="/explore"
                className="group min-w-[205px] overflow-hidden rounded-[4px] border border-gray-100 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-md"
              >

                <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-orange-100 via-orange-50 to-gray-100">

                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin
                      size={30}
                      className="text-orange-300"
                    />
                  </div>

                  <div className="absolute left-3 top-3 rounded-[4px] bg-white/90 px-2.5 py-1 text-xs font-bold text-gray-800 backdrop-blur">
                    Popular
                  </div>

                </div>

                <div className="p-3.5">

                  <h3 className="truncate text-sm font-black text-gray-950">
                    {experience.title}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    {experience.location}
                  </div>

                  <div className="mt-2 flex items-center gap-1">

                    <Star
                      size={13}
                      fill="currentColor"
                      className="text-orange-500"
                    />

                    <span className="text-xs font-bold text-gray-800">
                      {experience.rating}
                    </span>

                    <span className="text-[11px] text-gray-400">
                      · {experience.reviews}
                    </span>

                  </div>

                </div>

              </Link>
            ))}

          </div>

        </section>

        {/* PUBLICIDADE */}
        <section className="mx-auto max-w-7xl px-5 pt-8 sm:px-6 lg:px-8">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                Espaço comercial
              </p>

              <h2 className="mt-1 text-lg font-black text-gray-950">
                Publicidade
              </h2>
            </div>

            <span className="rounded-[4px] bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500">
              Patrocinado
            </span>

          </div>

          {/* CARROSSEL — 395 × 167 */}
          <div className="flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            <article className="relative h-[167px] w-[395px] min-w-[395px] overflow-hidden rounded-[4px] bg-gray-950">

              <div className="absolute inset-0 bg-gradient-to-r from-gray-950 via-gray-900/90 to-orange-950" />

              <div className="relative flex h-full flex-col justify-between p-5">

                <div>
                  <span className="inline-flex rounded-[4px] bg-orange-500 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                    Patrocinado
                  </span>

                  <h3 className="mt-3 max-w-[270px] text-xl font-black leading-tight text-white">
                    A tua marca pode aparecer aqui.
                  </h3>

                  <p className="mt-1 max-w-[280px] text-xs text-gray-300">
                    Promove a tua empresa para quem está a descobrir Angola.
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-fit items-center gap-1.5 rounded-[4px] bg-white px-3.5 py-2 text-xs font-black text-gray-950"
                >
                  Anunciar
                  <ArrowRight size={13} />
                </button>

              </div>

            </article>

            <article className="relative h-[167px] w-[395px] min-w-[395px] overflow-hidden rounded-[4px] bg-orange-500">

              <div className="relative flex h-full flex-col justify-between p-5">

                <div>
                  <span className="inline-flex rounded-[4px] bg-white/20 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-white">
                    Patrocinado
                  </span>

                  <h3 className="mt-3 max-w-[280px] text-xl font-black leading-tight text-white">
                    Chega a novos clientes através da Wizenda.
                  </h3>

                  <p className="mt-1 text-xs text-orange-50">
                    Espaços publicitários para empresas e marcas.
                  </p>
                </div>

                <button
                  type="button"
                  className="flex w-fit items-center gap-1.5 rounded-[4px] bg-white px-3.5 py-2 text-xs font-black text-gray-950"
                >
                  Saber mais
                  <ArrowRight size={13} />
                </button>

              </div>

            </article>

          </div>

        </section>

        {/* EXPERIÊNCIAS */}
        <section className="pt-10">

          <div className="mx-auto max-w-7xl px-5 sm:px-6 lg:px-8">

            <div className="flex items-end justify-between">

              <div>
                <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                  Experiências
                </p>

                <h2 className="mt-1 text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                  Vive algo diferente
                </h2>
              </div>

              <Link
                href="/explore"
                className="flex items-center gap-1 text-sm font-bold text-orange-500"
              >
                Explorar
                <ChevronRight size={16} />
              </Link>

            </div>

          </div>

          <div className="mt-5">
            <FeaturedExperiences />
          </div>

        </section>

        {/* FIM DE SEMANA */}
        <section className="mx-auto max-w-7xl px-5 pt-10 sm:px-6 lg:px-8">

          <div className="flex items-end justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-orange-500">
                Para o fim de semana
              </p>

              <h2 className="mt-1 text-xl font-black tracking-tight text-gray-950 sm:text-2xl">
                Escapa da rotina 🌴
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Lugares para descansar, explorar e aproveitar.
              </p>
            </div>

            <Link
              href="/explore?category=resorts"
              className="flex items-center gap-1 text-sm font-bold text-orange-500"
            >
              Ver tudo
              <ChevronRight size={16} />
            </Link>

          </div>

          <div className="mt-5 flex gap-4 overflow-x-auto pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

            {weekendPlaces.map((place) => (
              <Link
                key={place.name}
                href="/explore"
                className="group min-w-[245px] overflow-hidden rounded-[4px] border border-gray-100 bg-white shadow-sm"
              >

                <div className="relative aspect-[4/3] bg-gradient-to-br from-orange-100 to-gray-100">

                  <div className="absolute left-3 top-3 rounded-[4px] bg-white/90 px-3 py-1.5 text-[10px] font-black uppercase text-gray-700 backdrop-blur">
                    {place.type}
                  </div>

                  <div className="absolute inset-0 flex items-center justify-center">
                    <MapPin
                      size={34}
                      className="text-orange-300"
                    />
                  </div>

                </div>

                <div className="p-4">

                  <h3 className="font-black text-gray-950">
                    {place.name}
                  </h3>

                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    <MapPin size={12} />
                    {place.location}
                  </div>

                </div>

              </Link>
            ))}

          </div>

        </section>

      </main>
    </AppShell>
  )
}
