import { createClient } from '@/lib/supabase/server'
import AdminDashboardClient from '@/app/components/admin-dashboard-client'

export default async function AdminPage() {
  const supabase = await createClient()

  const now = new Date()

  const startOfMonth = new Date(
    now.getFullYear(),
    now.getMonth(),
    1,
  ).toISOString()

  const startOfSixMonthsAgo = new Date(
    now.getFullYear(),
    now.getMonth() - 5,
    1,
  ).toISOString()

  // =========================================================
  // UTILIZADORES
  // =========================================================

  const { count: totalUsers } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })

  const { count: activeUsersMonth } = await supabase
    .from('profiles')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .gte('created_at', startOfMonth)

  const { data: users } = await supabase
    .from('profiles')
    .select(`
      id,
      full_name,
      role,
      phone,
      city,
      created_at
    `)
    .order('created_at', {
      ascending: false,
    })
    .limit(100)

  // =========================================================
  // EMPRESAS / AGÊNCIAS
  // =========================================================

  const { count: totalAgencies } = await supabase
    .from('agencies')
    .select('*', {
      count: 'exact',
      head: true,
    })

  const { data: agencies } = await supabase
    .from('agencies')
    .select(`
      id,
      owner_id,
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
      status,
      is_verified,
      verification_status,
      legal_name,
      nif,
      responsible_name,
      responsible_document,
      verified_at,
      verified_by,
      rejection_reason,
      suspension_reason,
      suspended_at,
      blocked_at,
      created_at,
      updated_at
    `)
    .order('created_at', {
      ascending: false,
    })

  // =========================================================
  // EXPERIÊNCIAS / CONTEÚDO
  // =========================================================

  const { data: experiences } = await supabase
    .from('experiences')
    .select(`
      id,
      agency_id,
      title,
      slug,
      description,
      category,
      province,
      city,
      location,
      price,
      duration_hours,
      capacity,
      cover_image,
      status,
      activity_start_at,
      activity_end_at,
      created_at,
      updated_at,
      agencies (
        id,
        name,
        logo_url,
        is_verified,
        verification_status
      )
    `)
    .order('created_at', {
      ascending: false,
    })

  // =========================================================
  // RESERVAS
  // =========================================================

  const { count: bookingsMonth } = await supabase
    .from('bookings')
    .select('*', {
      count: 'exact',
      head: true,
    })
    .gte('created_at', startOfMonth)

  // =========================================================
  // PAGAMENTOS / RECEITA
  // =========================================================

  const { data: totalPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')

  const totalRevenue =
    totalPayments?.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    ) || 0

  const { data: monthlyPayments } = await supabase
    .from('payments')
    .select('amount')
    .eq('status', 'paid')
    .gte('created_at', startOfMonth)

  const monthlyRevenue =
    monthlyPayments?.reduce(
      (sum, payment) =>
        sum + Number(payment.amount || 0),
      0,
    ) || 0

  // =========================================================
  // CRESCIMENTO DOS UTILIZADORES
  // =========================================================

  const { data: growthUsers } = await supabase
    .from('profiles')
    .select('created_at')
    .gte('created_at', startOfSixMonthsAgo)

  const growthData = Array.from(
    { length: 6 },
    (_, index) => {
      const date = new Date(
        now.getFullYear(),
        now.getMonth() - (5 - index),
        1,
      )

      const year = date.getFullYear()
      const month = date.getMonth()

      const value =
        growthUsers?.filter((user) => {
          const created = new Date(user.created_at)

          return (
            created.getFullYear() === year &&
            created.getMonth() === month
          )
        }).length || 0

      return {
        month: new Intl.DateTimeFormat(
          'pt-PT',
          {
            month: 'short',
          },
        )
          .format(date)
          .replace('.', ''),
        value,
      }
    },
  )

  // =========================================================
  // RESERVAS POR CATEGORIA
  // =========================================================

  const { data: bookings } = await supabase
    .from('bookings')
    .select(`
      id,
      experience_id,
      total_price,
      created_at
    `)

  const experienceIds = Array.from(
    new Set(
      (bookings || [])
        .map((booking) => booking.experience_id)
        .filter(Boolean),
    ),
  )

  const { data: bookingExperiences } =
    experienceIds.length > 0
      ? await supabase
          .from('experiences')
          .select('id, category')
          .in('id', experienceIds)
      : { data: [] }

  const experienceCategoryMap = new Map(
    (bookingExperiences || []).map(
      (experience) => [
        experience.id,
        experience.category,
      ],
    ),
  )

  const reservationCategoryMap: Record<
    string,
    number
  > = {}

  const revenueCategoryMap: Record<
    string,
    number
  > = {}

  for (const booking of bookings || []) {
    const category =
      experienceCategoryMap.get(
        booking.experience_id,
      ) || 'Outros'

    reservationCategoryMap[category] =
      (reservationCategoryMap[category] || 0) + 1

    revenueCategoryMap[category] =
      (revenueCategoryMap[category] || 0) +
      Number(booking.total_price || 0)
  }

  const reservationCategories =
    Object.entries(
      reservationCategoryMap,
    ).map(([name, value]) => ({
      name,
      value,
    }))

  const revenueCategories =
    Object.entries(
      revenueCategoryMap,
    ).map(([name, value]) => ({
      name,
      value,
    }))

  // =========================================================
  // PROVÍNCIAS
  // =========================================================

 const { data: provincias, error: provinciasError } =
  await supabase
    .from('provincias')
    .select(`
      id,
      nome,
      slug,
      descricao,
      imagem,
      imagem_capa,
      publicada,
      created_at,
      updated_at
    `)
    .order('created_at', {
      ascending: false,
    })

console.log('PROVINCIAS:', provincias)
console.log('ERRO PROVINCIAS:', provinciasError)

  // =========================================================
  // ATIVIDADES RECENTES
  // =========================================================

  const { data: recentBookings } =
    await supabase
      .from('bookings')
      .select(`
        id,
        created_at,
        total_price,
        status
      `)
      .order('created_at', {
        ascending: false,
      })
      .limit(5)

  const recentActivities =
    (recentBookings || []).map(
      (booking) => ({
        title: 'Nova reserva',
        description: `Reserva no valor de ${Number(
          booking.total_price || 0,
        ).toLocaleString('pt-PT')} Kz`,
        time: new Intl.DateTimeFormat(
          'pt-PT',
          {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          },
        ).format(
          new Date(booking.created_at),
        ),
      }),
    )

  // =========================================================
  // CONVERSAS
  // =========================================================

  const { data: conversations } =
    await supabase
      .from('conversations')
      .select(`
        id,
        user_id,
        agency_id,
        experience_id,
        created_at,
        updated_at,
        customer_name,
        customer_phone
      `)
      .order('updated_at', {
        ascending: false,
      })
      .limit(100)

  const conversationIds =
    (conversations || []).map(
      (conversation) => conversation.id,
    )

  const { data: conversationMessages } =
    conversationIds.length > 0
      ? await supabase
          .from('messages')
          .select(`
            id,
            conversation_id,
            sender_id,
            message,
            read,
            created_at
          `)
          .in(
            'conversation_id',
            conversationIds,
          )
          .order('created_at', {
            ascending: true,
          })
      : { data: [] }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <AdminDashboardClient
      stats={{
        totalUsers: totalUsers || 0,
        activeUsersMonth:
          activeUsersMonth || 0,
        totalAgencies:
          totalAgencies || 0,
        bookingsMonth:
          bookingsMonth || 0,
        totalRevenue,
        monthlyRevenue,
        pointsGenerated: 0,
        pointsUsed: 0,
      }}
      growthData={growthData}
      reservationCategories={
        reservationCategories
      }
      revenueCategories={
        revenueCategories
      }
      recentActivities={
        recentActivities
      }
      users={users || []}
      agencies={agencies || []}
      experiences={experiences || []}
      provincias={provincias || []}
      conversations={conversations || []}
      conversationMessages={
        conversationMessages || []
      }
    />
  )
}