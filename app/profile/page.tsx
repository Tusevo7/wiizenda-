import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Heart,
  Bookmark,
  CalendarCheck,
  Pencil,
  LogOut,
  ArrowLeft,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'full_name, role, avatar_url, phone, city, traveler_type',
    )
    .eq('id', user.id)
    .single()

  if (profile?.role === 'agency') {
    redirect('/agency/profile')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const displayName =
    profile?.full_name?.trim() ||
    'Viajante Wizenda'

  const initial =
    displayName.charAt(0).toUpperCase()

  return (
    <main className="min-h-screen bg-gray-50">

      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">

        {/* TOPO */}
        <div className="mb-6">

          <Link
            href="/"
            aria-label="Voltar para a página inicial"
            className="mb-5 inline-flex h-10 w-10 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-700 shadow-sm transition hover:bg-gray-50 hover:text-gray-950 active:scale-95"
          >
            <ArrowLeft size={19} />
          </Link>

          <div className="flex items-center justify-between">

            <div>
              <p className="text-sm font-medium text-gray-500">
                A minha conta
              </p>

              <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
                Perfil
              </h1>
            </div>

            <Link
              href="/profile/edit"
              className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
            >
              <Pencil size={16} />
              Editar
            </Link>

          </div>

        </div>

        {/* PERFIL PRINCIPAL */}
        <section className="overflow-hidden rounded-[2rem] border border-gray-100 bg-white shadow-sm">

          {/* TOPO */}
          <div className="h-28 bg-gradient-to-br from-orange-500 to-orange-600" />

          {/* DADOS */}
          <div className="px-6 pb-7 sm:px-8">

            <div className="-mt-12 flex items-end justify-between">

              {/* AVATAR */}
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-orange-100 text-3xl font-black text-orange-600 shadow-lg">

                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={displayName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  initial
                )}

              </div>

              {/* TIPO */}
              <span className="mb-2 rounded-full bg-orange-50 px-3 py-1.5 text-xs font-bold text-orange-600">
                Viajante
              </span>

            </div>

            {/* NOME */}
            <div className="mt-4">

              <h2 className="text-2xl font-black text-gray-950">
                {displayName}
              </h2>

              {profile?.traveler_type && (
                <p className="mt-1 text-sm font-medium text-gray-500">
                  {profile.traveler_type}
                </p>
              )}

            </div>

          </div>
        </section>

        {/* INFORMAÇÕES */}
        <section className="mt-5 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm sm:p-7">

          <div className="mb-6">
            <h2 className="text-lg font-black text-gray-950">
              Informações pessoais
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Os teus dados de viajante.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">

            {/* EMAIL */}
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

              <Mail
                size={19}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <div className="min-w-0">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                  {user.email}
                </p>
              </div>

            </div>

            {/* TELEFONE */}
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

              <Phone
                size={19}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Telefone
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {profile?.phone || 'Não informado'}
                </p>
              </div>

            </div>

            {/* CIDADE */}
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

              <MapPin
                size={19}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Cidade
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {profile?.city || 'Não informada'}
                </p>
              </div>

            </div>

            {/* TIPO DE VIAJANTE */}
            <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

              <User
                size={19}
                className="mt-0.5 shrink-0 text-orange-500"
              />

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Perfil de viajante
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-800">
                  {profile?.traveler_type || 'Não definido'}
                </p>
              </div>

            </div>

          </div>

        </section>

        {/* ATALHOS */}
        <section className="mt-5 grid gap-4 sm:grid-cols-2">

          {/* RESERVAS */}
          <Link
            href="/bookings"
            className="group flex items-center gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <CalendarCheck size={22} />
            </div>

            <div className="flex-1">
              <h3 className="font-black text-gray-950">
                Minhas reservas
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Consulta as tuas viagens.
              </p>
            </div>

            <span className="text-gray-300 transition group-hover:text-orange-500">
              →
            </span>

          </Link>

          {/* FAVORITOS */}
          <Link
            href="/favorites"
            className="group flex items-center gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Heart size={22} />
            </div>

            <div className="flex-1">
              <h3 className="font-black text-gray-950">
                Favoritos
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Experiências que guardaste.
              </p>
            </div>

            <span className="text-gray-300 transition group-hover:text-orange-500">
              →
            </span>

          </Link>

          {/* GUARDADOS */}
          <Link
            href="/review/saved"
            className="group flex items-center gap-4 rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
              <Bookmark
                size={22}
                fill="currentColor"
              />
            </div>

            <div className="flex-1">
              <h3 className="font-black text-gray-950">
                Guardados
              </h3>

              <p className="mt-1 text-sm text-gray-500">
                Publicações que guardaste.
              </p>
            </div>

            <span className="text-gray-300 transition group-hover:text-orange-500">
              →
            </span>

          </Link>

        </section>

        {/* CONTA */}
        <section className="mt-5 rounded-[2rem] border border-gray-100 bg-white p-6 shadow-sm">

          <h2 className="text-lg font-black text-gray-950">
            Conta
          </h2>

          <div className="mt-4">

            <form
              action="/auth/signout"
              method="post"
            >
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold text-red-500 transition hover:bg-red-50"
              >
                <LogOut size={19} />
                Terminar sessão
              </button>
            </form>

          </div>

        </section>

      </div>

    </main>
  )
}