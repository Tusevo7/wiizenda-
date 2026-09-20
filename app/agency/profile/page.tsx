
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import {
  Building2,
  MapPin,
  Phone,
  Mail,
  Pencil,
} from 'lucide-react'

export default async function AgencyProfilePage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  if (profile?.role === 'traveler') {
    redirect('/profile')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select(`
      id,
      name,
      slug,
      description,
      logo_url,
      cover_image,
      phone,
      email,
      province,
      city,
      address,
      status
    `)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!agency) {
    return (
      <main className="min-h-screen bg-gray-50 px-6 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">

            <Building2
              size={40}
              className="mx-auto text-gray-400"
            />

            <h1 className="mt-4 text-2xl font-black">
              Agência não encontrada
            </h1>

            <p className="mt-2 text-sm text-gray-500">
              A tua conta ainda não está associada a uma agência.
            </p>

            <Link
              href="/agency"
              className="mt-6 inline-flex rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
            >
              Voltar ao painel
            </Link>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="mx-auto max-w-4xl px-5 py-8 sm:px-6">

        {/* VOLTAR */}
        <Link
          href="/agency"
          className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
        >
          ← Voltar ao painel
        </Link>

        {/* PERFIL */}
        <div className="mt-6 rounded-[2rem] border border-gray-100 bg-white shadow-sm">

          {/* =========================
              CAPA
          ========================== */}
          <div className="relative h-64 overflow-hidden rounded-t-[2rem] bg-gray-100 sm:h-72">

            {agency.cover_image ? (
              <img
                src={agency.cover_image}
                alt={`Capa da ${agency.name}`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-orange-500 to-orange-600">

                <div className="text-center text-white">

                  <Building2
                    size={42}
                    className="mx-auto opacity-80"
                  />

                  <p className="mt-2 text-sm font-semibold opacity-80">
                    Adicione uma foto de capa
                  </p>

                </div>

              </div>
            )}

          </div>

          {/* =========================
              CONTEÚDO
          ========================== */}
          <div className="px-6 pb-8 sm:px-8">

            {/* =========================
                LOGO SOBRE A CAPA
            ========================== */}
            <div className="relative z-10 -mt-14 flex items-end justify-between">

              {/* LOGO */}
              <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[2rem] border-4 border-white bg-orange-100 text-4xl font-black text-orange-600 shadow-lg">

                {agency.logo_url ? (
                  <img
                    src={agency.logo_url}
                    alt={`Logo da ${agency.name}`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  agency.name
                    .charAt(0)
                    .toUpperCase()
                )}

              </div>

              {/* EDITAR */}
              <Link
                href="/agency/profile/edit"
                className="mb-1 flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-bold text-gray-700 shadow-sm transition hover:bg-gray-50"
              >
                <Pencil size={16} />

                Editar perfil
              </Link>

            </div>

            {/* =========================
                NOME
            ========================== */}
            <div className="mt-5">

              <div className="flex flex-wrap items-center gap-2">

                <h1 className="text-3xl font-black tracking-tight text-gray-950">
                  {agency.name}
                </h1>

                <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">
                  {agency.status === 'approved'
                    ? 'Aprovada'
                    : agency.status === 'pending'
                      ? 'Pendente'
                      : agency.status}
                </span>

              </div>

              {agency.description && (
                <p className="mt-3 max-w-2xl text-gray-500">
                  {agency.description}
                </p>
              )}

            </div>

            {/* =========================
                INFORMAÇÕES
            ========================== */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">

              {/* LOCALIZAÇÃO */}
              {(agency.city || agency.province) && (
                <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

                  <MapPin
                    size={19}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Localização
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {[agency.city, agency.province]
                        .filter(Boolean)
                        .join(', ')}
                    </p>

                  </div>

                </div>
              )}

              {/* ENDEREÇO */}
              {agency.address && (
                <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

                  <Building2
                    size={19}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Endereço
                    </p>

                    <p className="mt-1 text-sm font-semibold text-gray-800">
                      {agency.address}
                    </p>

                  </div>

                </div>
              )}

              {/* TELEFONE */}
              {agency.phone && (
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
                      {agency.phone}
                    </p>

                  </div>

                </div>
              )}

              {/* EMAIL */}
              {agency.email && (
                <div className="flex items-start gap-3 rounded-2xl bg-gray-50 p-4">

                  <Mail
                    size={19}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />

                  <div>

                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Email
                    </p>

                    <p className="mt-1 break-all text-sm font-semibold text-gray-800">
                      {agency.email}
                    </p>

                  </div>

                </div>
              )}

            </div>

          </div>
        </div>

      </section>

    </main>
  )
}
