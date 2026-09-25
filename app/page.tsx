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

        {/* PESQUISA */}
        <section className="relative z-10 mx-auto max-w-4xl px-5 pt-5 sm:-mt-8 sm:px-6">

          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-2 shadow-md shadow-gray-900/5">

            {/* ÍCONE */}
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gray-50">
              <Search
                size={20}
                className="text-gray-500"
              />
            </div>

            {/* CAMPO */}
            <div className="min-w-0 flex-1">
              <HomeSearch />
            </div>

            {/* PESQUISAR */}
            <Link
              href="/explore"
              aria-label="Pesquisar"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white transition hover:bg-orange-600 active:scale-95"
            >
              <Search size={19} />
            </Link>

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
              className="hidden items-center gap-1 text-sm font-bold text-orange-500 transition hover:text-orange-600 sm:flex"
            >
              Ver tudo
              <ChevronRight size={16} />
            </Link>

          </div>

          <div className="mt-5 flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

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

        {/* FEED DE EXPERIÊNCIAS */}
        <section className="pt-9">
          <FeaturedExperiences />
        </section>

        {/* PUBLICIDADE DINÂMICA */}
        <section className="mx-auto max-w-7xl px-5 pt-2 sm:px-6 lg:px-8">

          <div className="mb-4 flex items-center justify-between">

       

            <span className="rounded-[4px] bg-gray-100 px-3 py-1 text-[10px] font-bold text-gray-500">
              Patrocinado
            </span>

          </div>

          <AdvertisementCarousel />

        </section>

        {/* =====================================================
            LUGARES PARA O FIM DE SEMANA
        ====================================================== */}
        <WeekendPlaces />

        {/* =====================================================
            SOBA IA
        ====================================================== */}
        <Link
          href="/soba"
          aria-label="Abrir Soba IA"
          className="group fixed bottom-24 right-5 z-[9999] transition-transform duration-300 hover:-translate-y-1 active:scale-95 sm:bottom-24 sm:right-8"
        >
          <div className="relative">

            {/* ORBE */}
            <div className="h-[58px] w-[58px] overflow-hidden rounded-full shadow-2xl shadow-black/30 sm:h-[100px] sm:w-[100px]">
              <WizendaAiOrb />
            </div>

           {/* LABEL */}
<div className="absolute -left-2 top-1/2 -translate-x-full -translate-y-1/2 whitespace-nowrap rounded-full bg-gray-950 px-4 py-2 text-xs font-bold text-white shadow-xl">
  Soba IA
</div>

          </div>
        </Link>

      </main>
    </AppShell>
  )
}