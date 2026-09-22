
import Link from 'next/link'
import { Store } from 'lucide-react'

import AppShell from '@/app/components/app-shell'
import AgencyDashboardClient from '@/app/components/agency-dashboard-client'
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
            className="mt-6 inline-flex rounded-xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
          >
            Entrar
          </Link>
        </main>
      </AppShell>
    )
  }

  const { data: agency, error: agencyError } =
    await supabase
      .from('agencies')
      .select(
        `
          id,
          name,
          description,
          city,
          province,
          status,
          is_verified,
          logo_url,
          phone,
          email,
          address
        `,
      )
      .eq('owner_id', user.id)
      .maybeSingle()

  if (agencyError) {
    console.error('Agency error:', agencyError)
  }

  if (!agency) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16">
          <div className="rounded-2xl border border-gray-200 bg-white p-10 text-center">
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

  const {
    data: experiences,
    error: experiencesError,
  } = await supabase
    .from('experiences')
    .select(
      `
        id,
        title,
        slug,
        price,
        status,
        cover_image,
        city,
        province,
        location,
        activity_start_at,
        activity_end_at,
        created_at
      `,
    )
    .eq('agency_id', agency.id)
    .order('created_at', {
      ascending: false,
    })

  if (experiencesError) {
    console.error(
      'Experiences error:',
      experiencesError,
    )
  }

  const publishedCount =
    experiences?.filter(
      (experience) =>
        experience.status === 'published',
    ).length || 0

  const {
    data: agencyBookings,
    error: bookingsError,
  } = await supabase
    .from('bookings')
    .select(
      `
        id,
        user_id,
        experience_id,
        agency_id,
        booking_date,
        guests,
        unit_price,
        total_price,
        status,
        customer_name,
        customer_phone,
        notes,
        created_at,
        experiences (
          title,
          cover_image
        )
      `,
    )
    .eq('agency_id', agency.id)
    .order('created_at', {
      ascending: false,
    })

  if (bookingsError) {
    console.error(
      'Bookings error:',
      bookingsError,
    )
  }

  const bookingIds =
    agencyBookings?.map(
      (booking) => booking.id,
    ) || []

  let paidPayments: {
    id: string
    booking_id: string
    amount: number | string
    paid_at: string | null
    created_at: string
  }[] = []

  if (bookingIds.length > 0) {
    const {
      data,
      error: paymentsError,
    } = await supabase
      .from('payments')
      .select(
        `
          id,
          booking_id,
          amount,
          paid_at,
          created_at
        `,
      )
      .in('booking_id', bookingIds)
      .eq('status', 'paid')

    if (paymentsError) {
      console.error(
        'Payments error:',
        paymentsError,
      )
    }

    paidPayments = data || []
  }

  const ticketsSold = paidPayments.length

  const revenue = paidPayments.reduce(
    (total, payment) =>
      total + Number(payment.amount || 0),
    0,
  )

  const now = new Date()

  function getLuandaParts(date: Date) {
    const parts =
      new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Africa/Luanda',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
      }).formatToParts(date)

    return {
      year: Number(
        parts.find(
          (part) => part.type === 'year',
        )?.value || 0,
      ),
      month: Number(
        parts.find(
          (part) => part.type === 'month',
        )?.value || 0,
      ),
      day: Number(
        parts.find(
          (part) => part.type === 'day',
        )?.value || 0,
      ),
    }
  }

  const currentDate =
    getLuandaParts(now)

  const monthlyTickets =
    paidPayments.filter((payment) => {
      if (!payment.paid_at) {
        return false
      }

      const date = getLuandaParts(
        new Date(payment.paid_at),
      )

      return (
        date.year === currentDate.year &&
        date.month === currentDate.month
      )
    }).length

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
      .map((booking) => booking.user_id)
      .filter(Boolean) || [],
  ).size

  const experienceIds =
    experiences?.map(
      (experience) => experience.id,
    ) || []

  let averageRating = 0
  let reviewCount = 0

  let reviews: {
    id: string
    rating: number
    comment: string | null
    created_at: string
    user_id: string
    experience_id: string
  }[] = []

  if (experienceIds.length > 0) {
    const {
      data,
      error: reviewsError,
    } = await supabase
      .from('reviews')
      .select(
        `
          id,
          rating,
          comment,
          created_at,
          user_id,
          experience_id
        `,
      )
      .in(
        'experience_id',
        experienceIds,
      )
      .order('created_at', {
        ascending: false,
      })

    if (reviewsError) {
      console.error(
        'Reviews error:',
        reviewsError,
      )
    }

    reviews = data || []

    if (reviews.length > 0) {
      reviewCount = reviews.length

      const totalRating =
        reviews.reduce(
          (total, review) =>
            total +
            Number(review.rating || 0),
          0,
        )

      averageRating =
        totalRating / reviewCount
    }
  }

  function getDateKey(date: Date) {
    const parts = getLuandaParts(date)

    return `${parts.year}-${String(
      parts.month,
    ).padStart(2, '0')}-${String(
      parts.day,
    ).padStart(2, '0')}`
  }

  const salesMap =
    new Map<string, number>()

  paidPayments.forEach((payment) => {
    if (!payment.paid_at) {
      return
    }

    const key = getDateKey(
      new Date(payment.paid_at),
    )

    salesMap.set(
      key,
      (salesMap.get(key) || 0) +
        Number(payment.amount || 0),
    )
  })

  const salesByDay = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(now)

      date.setDate(
        date.getDate() - (6 - index),
      )

      const key = getDateKey(date)

      return {
        date: key,
        amount: salesMap.get(key) || 0,
      }
    },
  )

  const dashboardData = {
    agency: {
      id: agency.id,
      name: agency.name,
      description: agency.description,
      city: agency.city,
      province: agency.province,
      status: agency.status,
      is_verified: agency.is_verified,
      logo_url: agency.logo_url,
      phone: agency.phone,
      email: agency.email,
      address: agency.address,
    },

    experiences: experiences || [],

    publishedCount,

    bookings: agencyBookings || [],

    paidPayments,

    ticketsSold,

    revenue,

    monthlyTickets,

    uniqueCustomers: customers,

    averageRating,

    reviewCount,

    reviews,

    salesChart: salesByDay.map(
      (item) => ({
        date: item.date,
        sales: item.amount,
      }),
    ),
  }

  return (
    <AppShell>
      <AgencyDashboardClient
        data={dashboardData}
      />
    </AppShell>
  )
}
