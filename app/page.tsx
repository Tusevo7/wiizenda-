
import Link from 'next/link'
import {
  ChevronRight,
  Search,
} from 'lucide-react'

import AppShell from './components/app-shell'
import CategoryChip from './components/category-chip'
import HomeSearch from './components/home-search'
import FeaturedExperiences from './components/featured-experiences'
import AdvertisementCarousel from './components/home/advertisement-carousel'
import WeekendPlaces from './components/home/weekend-places'
import WizendaAiOrb from './components/wizenda-ai-orb'

type ExperienceCategory =
  | 'Praia'
  | 'Aventura'
  | 'Natureza'
  | 'Cultura'
  | 'Gastronomia'

const categories: ExperienceCategory[] = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

export default function Home() {
  return (
    <AppShell>
      <main className="min-h-screen bg-[#FAFAFA] pb-6">

        {/* =====================================================
            INTRO DESKTOP
        ====================================================== */}
        <section className="hidden bg-gray-950 sm:block">
          <div className="mx-auto max-w-7xl px-6 py-14 lg:px-8">
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


        {/* =====================================================
            PESQUISA
        ====================================================== */}
        <section
          className="
            relative z-10 mx-auto
            max-w-4xl
            px-4 pt-3
            sm:-mt-8 sm:px-6 sm:pt-5
          "
        >

          <div
            className="
              flex items-center gap-2
              rounded-xl
              border border-gray-200
              bg-white
              p-1.5
              shadow-sm
              sm:gap-3 sm:rounded-2xl sm:p-2
            "
          >

            {/* ÍCONE */}
            <div
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-lg bg-gray-50
                sm:h-11 sm:w-11 sm:rounded-xl
              "
            >
              <Search
                size={18}
                className="text-gray-500"
              />
            </div>

            {/* INPUT */}
            <div className="min-w-0 flex-1">
              <HomeSearch />
            </div>

            {/* BOTÃO */}
            <Link
              href="/explore"
              aria-label="Pesquisar"
              className="
                flex h-10 w-10 shrink-0
                items-center justify-center
                rounded-lg
                bg-orange-500
                text-white
                transition
                hover:bg-orange-600
                active:scale-95
                sm:h-11 sm:w-11 sm:rounded-xl
              "
            >
              <Search size={18} />
            </Link>

          </div>

        </section>


        {/* =====================================================
            CATEGORIAS
        ====================================================== */}
        <section
          className="
            mx-auto max-w-7xl
            px-4 pt-5
            sm:px-6 sm:pt-8
            lg:px-8
          "
        >

          <div className="flex items-center justify-between">

            <div>
              <h2
                className="
                  text-lg font-black
                  tracking-tight text-gray-950
                  sm:text-2xl
                "
              >
                Explora por categoria
              </h2>

              <p className="mt-0.5 text-xs text-gray-500 sm:mt-1 sm:text-sm">
                Encontra algo que combina contigo.
              </p>
            </div>

            <Link
              href="/explore"
              className="
                hidden items-center gap-1
                text-sm font-bold
                text-orange-500
                transition hover:text-orange-600
                sm:flex
              "
            >
              Ver tudo
              <ChevronRight size={16} />
            </Link>

          </div>


          {/* CATEGORIAS */}
          <div
            className="
              mt-3 flex gap-2
              overflow-x-auto pb-1
              [scrollbar-width:none]
              [&::-webkit-scrollbar]:hidden
              sm:mt-5 sm:gap-3 sm:pb-2
            "
          >

            {categories.map(
              (category, index) => (
                <CategoryChip
                  key={category}
                  name={category}
                  active={index === 0}
                />
              ),
            )}

          </div>

        </section>
{/* =====================================================
    EXPERIÊNCIAS
====================================================== */}
<section className="pt-3 sm:pt-6">
  <FeaturedExperiences />
</section>


{/* =====================================================
    PUBLICIDADE
====================================================== */}
<section
  className="
    mx-auto max-w-7xl
    px-4
    pt-1
    sm:px-6
    sm:pt-5
    lg:px-8
  "
>
  <div className="mb-1.5 flex items-center justify-between sm:mb-3">
    <span
      className="
        rounded-[4px]
        bg-gray-100
        px-2 py-1
        text-[9px]
        font-bold
        text-gray-500
        sm:px-3 sm:text-[10px]
      "
    >
      Patrocinado
    </span>
  </div>

  <div className="overflow-hidden rounded-xl sm:rounded-2xl">
    <AdvertisementCarousel />
  </div>
</section>


{/* =====================================================
    FIM DE SEMANA
====================================================== */}
<section className="pt-5 sm:pt-8">
  <WeekendPlaces />
</section>


        {/* =====================================================
            SOBA IA
        ====================================================== */}
        <Link
          href="/soba"
          aria-label="Abrir Soba IA"
          className="
            group fixed
            bottom-20 right-4
            z-[9999]
            transition-transform
            duration-300
            hover:-translate-y-1
            active:scale-95
            sm:bottom-24
            sm:right-8
          "
        >

          <div className="relative">

            {/* ORBE */}
            <div
              className="
                h-[56px] w-[56px]
                overflow-hidden
                rounded-full
                shadow-2xl
                shadow-black/30
                sm:h-[100px]
                sm:w-[100px]
              "
            >
              <WizendaAiOrb />
            </div>

            {/* LABEL */}
            <div
              className="
                absolute
                -left-2
                top-1/2
                -translate-x-full
                -translate-y-1/2
                whitespace-nowrap
                rounded-full
                bg-gray-950
                px-3 py-1.5
                text-[11px]
                font-bold
                text-white
                shadow-xl
                sm:px-4
                sm:py-2
                sm:text-xs
              "
            >
              Soba IA
            </div>

          </div>

        </Link>

      </main>
    </AppShell>
  )
}
