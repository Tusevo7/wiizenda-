'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  Clock3,
  Edit3,
  Plus,
  ShieldCheck,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type WeekendPlace = {
  id: string
  business_name: string
  slug: string
  category: string
  cover_image: string | null
  city: string | null
  province: string | null
  status: string
  subscription_plan: string | null
  subscription_expires_at: string | null
  is_featured: boolean
}

export default function BusinessDashboard() {
  const [place, setPlace] =
    useState<WeekendPlace | null>(null)

  const [loading, setLoading] =
    useState(true)

  const [userEmail, setUserEmail] =
    useState<string | null>(null)

  useEffect(() => {
    async function loadDashboard() {
      const supabase = createClient()

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser()

      if (!user) {
        setLoading(false)
        return
      }

      setUserEmail(
        user.email || null,
      )

      const {
        data,
        error,
      } = await supabase
        .from('weekend_places')
        .select(`
          id,
          business_name,
          slug,
          category,
          cover_image,
          city,
          province,
          status,
          subscription_plan,
          subscription_expires_at,
          is_featured
        `)
        .eq('owner_id', user.id)
        .order('created_at', {
          ascending: false,
        })
        .limit(1)
        .maybeSingle()

      if (error) {
        console.error(
          'Erro ao carregar painel:',
          error,
        )
      }

      setPlace(data || null)
      setLoading(false)
    }

    void loadDashboard()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]">

        <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">

          <div className="animate-pulse">

            <div className="h-5 w-24 rounded bg-gray-200" />

            <div className="mt-8 h-9 w-64 rounded bg-gray-200" />

            <div className="mt-3 h-4 w-96 max-w-full rounded bg-gray-200" />

            <div className="mt-8 h-64 rounded-3xl bg-gray-200" />

          </div>

        </div>

      </main>
    )
  }

  if (!place) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]">

        <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-5 py-10">

          <div className="w-full rounded-3xl bg-white p-7 text-center shadow-sm sm:p-10">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Building2 size={28} />
            </div>

            <h1 className="mt-5 text-2xl font-black text-gray-950">
              Cria o teu negócio
            </h1>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
              Ainda não tens nenhum lugar cadastrado
              na Wizenda. Cria a página do teu negócio
              para começares a aparecer para viajantes.
            </p>

            <Link
              href="/business/register"
              className="mt-7 inline-flex items-center gap-2 rounded-2xl bg-orange-500 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
            >
              <Plus size={18} />
              Cadastrar negócio
            </Link>

          </div>

        </div>

      </main>
    )
  }

  const statusLabel =
    place.status === 'active'
      ? 'Ativo'
      : place.status === 'pending'
        ? 'Em análise'
        : place.status === 'rejected'
          ? 'Rejeitado'
          : 'Inativo'

  const statusClass =
    place.status === 'active'
      ? 'bg-green-50 text-green-700'
      : place.status === 'pending'
        ? 'bg-yellow-50 text-yellow-700'
        : place.status === 'rejected'
          ? 'bg-red-50 text-red-700'
          : 'bg-gray-100 text-gray-600'

  const expirationDate =
    place.subscription_expires_at
      ? new Date(
          place.subscription_expires_at,
        ).toLocaleDateString(
          'pt-AO',
          {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          },
        )
      : null

  return (
    <main className="min-h-screen bg-[#FAFAFA]">

      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">

        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-6 lg:px-8">

          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Wizenda
          </Link>

          <div className="text-right">

            <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">
              Conta
            </p>

            <p className="max-w-[180px] truncate text-xs font-bold text-gray-700">
              {userEmail}
            </p>

          </div>

        </div>

      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">

        {/* TÍTULO */}
        <div>

          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
            Área do negócio
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Olá, {place.business_name}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Gere a presença do teu negócio na Wizenda.
          </p>

        </div>

        {/* CARD PRINCIPAL */}
        <section className="mt-8 overflow-hidden rounded-3xl bg-white shadow-sm">

          <div className="grid lg:grid-cols-[280px_1fr]">

            {/* IMAGEM */}
            <div className="relative h-56 lg:h-full lg:min-h-[300px]">

              <img
                src={
                  place.cover_image ||
                  '/placeholder-experience.jpg'
                }
                alt={place.business_name}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

              <span
                className={`absolute left-4 top-4 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-wide ${statusClass}`}
              >
                {statusLabel}
              </span>

            </div>

            {/* INFO */}
            <div className="p-5 sm:p-7">

              <div className="flex flex-wrap items-start justify-between gap-4">

                <div>

                  <p className="text-xs font-bold uppercase tracking-wide text-orange-500">
                    {place.category}
                  </p>

                  <h2 className="mt-1 text-2xl font-black text-gray-950">
                    {place.business_name}
                  </h2>

                  <p className="mt-2 text-sm text-gray-500">
                    {[
                      place.city,
                      place.province,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      'Localização não definida'}
                  </p>

                </div>

                <Link
                  href={`/weekend/${place.slug}`}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-4 py-2.5 text-xs font-bold text-gray-700 transition hover:border-orange-200 hover:text-orange-500"
                >
                  Ver página
                  <ChevronRight size={15} />
                </Link>

              </div>

              {/* ESTADO */}
              <div className="mt-7 grid gap-3 sm:grid-cols-2">

                <div className="rounded-2xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <ShieldCheck
                      size={17}
                      className="text-orange-500"
                    />

                    <span className="text-xs font-bold text-gray-500">
                      Plano
                    </span>

                  </div>

                  <p className="mt-2 text-base font-black text-gray-950">
                    {place.subscription_plan ||
                      'Sem plano'}
                  </p>

                </div>

                <div className="rounded-2xl bg-gray-50 p-4">

                  <div className="flex items-center gap-2">

                    <Clock3
                      size={17}
                      className="text-orange-500"
                    />

                    <span className="text-xs font-bold text-gray-500">
                      Validade
                    </span>

                  </div>

                  <p className="mt-2 text-sm font-black text-gray-950">
                    {expirationDate ||
                      'Ainda não definida'}
                  </p>

                </div>

              </div>

              {/* DESTAQUE */}
              {place.is_featured && (
                <div className="mt-4 rounded-2xl bg-orange-50 p-4">

                  <p className="text-xs font-black text-orange-600">
                    ⭐ O teu negócio está em destaque
                  </p>

                  <p className="mt-1 text-xs leading-5 text-orange-700/80">
                    O teu estabelecimento pode aparecer
                    em posições de maior visibilidade na Wizenda.
                  </p>

                </div>
              )}

              {/* AÇÕES */}
              <div className="mt-6 flex flex-col gap-2 sm:flex-row">

                <Link
                  href={`/business/dashboard/${place.id}/edit`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-3 text-sm font-black text-white transition hover:bg-gray-800"
                >
                  <Edit3 size={16} />
                  Editar negócio
                </Link>

                <Link
                  href="/business/plans"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 py-3 text-sm font-black text-gray-700 transition hover:border-orange-200 hover:text-orange-500"
                >
                  Gerir plano
                  <ChevronRight size={16} />
                </Link>

              </div>

            </div>

          </div>

        </section>

        {/* PRÓXIMAS FUNÇÕES */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">

          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-xs font-black text-gray-950">
              Perfil
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Atualiza fotos, descrição, contactos e localização.
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-xs font-black text-gray-950">
              Assinatura
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Escolhe o plano e acompanha a validade da tua presença.
            </p>

          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-5">

            <p className="text-xs font-black text-gray-950">
              Estatísticas
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Futuramente poderás acompanhar visualizações e contactos.
            </p>

          </div>

        </div>

      </div>

    </main>
  )
}