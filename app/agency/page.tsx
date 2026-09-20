
import Link from 'next/link'
import {
  CalendarDays,
  ChevronRight,
  Plus,
  Star,
  Store,
} from 'lucide-react'

import AppShell from '@/app/components/app-shell'
import AgencyDashboardMetrics from '@/app/components/agency-dashboard-metrics'
import { createClient } from '@/lib/supabase/server'

export default async function AgencyPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-4xl px-5 py-16 text-center">
          <h1 className="text-3xl font-black">
            Acesso restrito
          </h1>

          <p className="mt-3 text-gray-500">
            Inicia sessão para aceder ao painel da agência.
          </p>

          <Link
            href="/login"
            className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white"
          >
            Entrar
          </Link>
        </main>
      </AppShell>
    )
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select(
      'id, name, description, city, province, status',
    )
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!agency) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-[2rem] bg-gray-50 p-8 text-center">
            <Store
              size={40}
              className="mx-auto text-orange-500"
            />

            <h1 className="mt-5 text-2xl font-black">
              Ainda não tens uma agência
            </h1>

            <p className="mx-auto mt-3 max-w-md text-gray-500">
              Cria o perfil da tua agência para começares
              a publicar experiências no Wizenda.
            </p>
          </div>
        </main>
      </AppShell>
    )
  }

  const { data: experiences } = await supabase
    .from('experiences')
    .select(
      'id, title, slug, price, status, cover_image, city, province',
    )
    .eq('agency_id', agency.id)
    .order('created_at', {
      ascending: false,
    })

  const publishedCount =
    experiences?.filter(
      (experience) =>
        experience.status === 'published',
    ).length || 0

  /*
   * Reservas da agência
   */
  const { data: agencyBookings } = await supabase
    .from('bookings')
    .select('id, user_id')
    .eq('agency_id', agency.id)

  const bookingIds =
    agencyBookings?.map(
      (booking) => booking.id,
    ) || []

  let paidPayments: {
    id: string
    booking_id: string
    amount: number | string
    paid_at: string | null
  }[] = []

  if (bookingIds.length > 0) {
    const { data } = await supabase
      .from('payments')
      .select(
        'id, booking_id, amount, paid_at',
      )
      .in('booking_id', bookingIds)
      .eq('status', 'paid')

    paidPayments = data || []
  }

  const ticketsSold = paidPayments.length

  const revenue = paidPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0,
  )

  /*
   * Vendas deste mês
   */
  const now = new Date()

  const luandaDate = new Intl.DateTimeFormat(
    'en-CA',
    {
      timeZone: 'Africa/Luanda',
      year: 'numeric',
      month: '2-digit',
    },
  ).formatToParts(now)

  const currentYear = Number(
    luandaDate.find(
      (part) => part.type === 'year',
    )?.value,
  )

  const currentMonth = Number(
    luandaDate.find(
      (part) => part.type === 'month',
    )?.value,
  )

  const monthlyTickets = paidPayments.filter(
    (payment) => {
      if (!payment.paid_at) {
        return false
      }

      const paidDate = new Date(
        payment.paid_at,
      )

      const parts = new Intl.DateTimeFormat(
        'en-CA',
        {
          timeZone: 'Africa/Luanda',
          year: 'numeric',
          month: '2-digit',
        },
      ).formatToParts(paidDate)

      const year = Number(
        parts.find(
          (part) => part.type === 'year',
        )?.value,
      )

      const month = Number(
        parts.find(
          (part) => part.type === 'month',
        )?.value,
      )

      return (
        year === currentYear &&
        month === currentMonth
      )
    },
  ).length

  /*
   * Clientes únicos com pagamentos aprovados
   */
  const paidBookingIds = new Set(
    paidPayments.map(
      (payment) => payment.booking_id,
    ),
  )

  const customers = new Set(
    agencyBookings
      ?.filter((booking) =>
        paidBookingIds.has(booking.id),
      )
      .map(
        (booking) => booking.user_id,
      ) || [],
  ).size

  /*
   * Avaliação média das experiências da agência
   */
  const experienceIds =
    experiences?.map(
      (experience) => experience.id,
    ) || []

  let averageRating = 0
  let reviewCount = 0

  if (experienceIds.length > 0) {
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .in('experience_id', experienceIds)

    if (reviews && reviews.length > 0) {
      reviewCount = reviews.length

      const totalRating = reviews.reduce(
        (total, review) =>
          total + Number(review.rating || 0),
        0,
      )

      averageRating =
        totalRating / reviewCount
    }
  }

  return (
    <AppShell>
      <main className="min-h-screen bg-gray-50/50">
        <section className="border-b border-gray-100 bg-white">
          <div className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
                  Painel da agência
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {agency.name}
                </h1>

                <p className="mt-2 text-gray-500">
                  {agency.city ||
                    agency.province ||
                    'Angola'}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/agency/bookings"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 font-bold text-gray-900 transition hover:bg-gray-50 active:scale-[0.98]"
                >
                  <CalendarDays size={19} />
                  Ver reservas
                </Link>

                <Link
                  href="/agency/experiences/new"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-bold text-white transition hover:bg-orange-600 active:scale-[0.98]"
                >
                  <Plus size={19} />
                  Nova experiência
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <Store
                size={20}
                className="text-orange-500"
              />

              <p className="mt-4 text-sm text-gray-500">
                Experiências
              </p>

              <p className="mt-1 text-3xl font-black">
                {experiences?.length || 0}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <Store
                size={20}
                className="text-green-500"
              />

              <p className="mt-4 text-sm text-gray-500">
                Publicadas
              </p>

              <p className="mt-1 text-3xl font-black">
                {publishedCount}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <CalendarDays
                size={20}
                className="text-blue-500"
              />

              <p className="mt-4 text-sm text-gray-500">
                Reservas
              </p>

              <p className="mt-1 text-3xl font-black">
                {agencyBookings?.length || 0}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5">
              <Star
                size={20}
                className="fill-orange-500 text-orange-500"
              />

              <p className="mt-4 text-sm text-gray-500">
                Avaliação
              </p>

              <p className="mt-1 text-3xl font-black">
                {reviewCount > 0
                  ? averageRating.toFixed(1)
                  : '—'}
              </p>

              {reviewCount > 0 && (
                <p className="mt-1 text-xs font-medium text-gray-400">
                  {reviewCount}{' '}
                  {reviewCount === 1
                    ? 'avaliação'
                    : 'avaliações'}
                </p>
              )}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-8 sm:px-6 lg:px-8">
          <div className="mb-5">
            <h2 className="text-2xl font-black">
              Desempenho comercial
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Acompanha as vendas e os pagamentos da tua agência.
            </p>
          </div>

          <AgencyDashboardMetrics
            ticketsSold={ticketsSold}
            monthlyTickets={monthlyTickets}
            revenue={revenue}
            customers={customers}
          />
        </section>

        <section className="mx-auto max-w-7xl px-5 pb-12 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between">
            <div>
              <h2 className="text-2xl font-black">
                Minhas experiências
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Gere aquilo que a tua agência oferece.
              </p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {experiences &&
            experiences.length > 0 ? (
              experiences.map((experience) => (
                <div
                  key={experience.id}
                  className="flex items-center gap-4 rounded-3xl border border-gray-100 bg-white p-4"
                >
                  <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {experience.cover_image && (
                      <img
                        src={experience.cover_image}
                        alt={experience.title}
                        className="h-full w-full object-cover"
                      />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-bold">
                      {experience.title}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      {Number(
                        experience.price,
                      ).toLocaleString('pt-AO')}{' '}
                      Kz
                    </p>

                    <span
                      className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                        experience.status ===
                        'published'
                          ? 'bg-green-50 text-green-600'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {experience.status ===
                      'published'
                        ? 'Publicada'
                        : 'Rascunho'}
                    </span>
                  </div>

                  <Link
                    href={`/agency/experiences/${experience.id}/edit`}
                    className="shrink-0 rounded-full bg-gray-100 p-3 transition hover:bg-orange-50 hover:text-orange-500"
                  >
                    <ChevronRight size={20} />
                  </Link>
                </div>
              ))
            ) : (
              <div className="rounded-3xl bg-white p-10 text-center">
                <h3 className="font-bold">
                  Ainda não tens experiências
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  Cria a primeira experiência da tua
                  agência.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  )
}
