'use client'

import Link from 'next/link'
import {
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Eye,
  Heart,
  ImagePlus,
  LayoutDashboard,
  Mail,
  MapPin,
  MessageSquare,
  Pencil,
  Phone,
  Plus,
  Settings,
  Star,
  Store,
  Ticket,
  Trash2,
  Upload,
  Users,
  Waves,
  Building2,
  Hotel,
  TreePalm,
  X,
  AlertCircle,
 AtSign,
  Globe,
  MessageCircle,
} from 'lucide-react'
import {
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { createClient } from '@/lib/supabase/client'

type RelaxationPlace = {
  id: string
  agency_id: string
  name: string
  slug: string
  type: string
  description: string | null
  province: string | null
  city: string | null
  address: string | null
  cover_image_url: string | null
  gallery_urls: string[]
  price_from: number | string | null
  price_currency: string
  phone: string | null
  whatsapp: string | null
  email: string | null
  website: string | null
  instagram: string | null
  opening_hours: any
  amenities: string[]
  status: string
  rejection_reason: string | null
  is_featured: boolean
  created_at: string
  updated_at: string
}

type DashboardData = {
  agency: {
    id: string
    name: string
    description: string | null
    city: string | null
    province: string | null
    status: string
    is_verified: boolean
    logo_url: string | null
    phone: string | null
    email: string | null
    address: string | null
  }

  experiences: any[]

  relaxationPlaces: RelaxationPlace[]

  publishedCount: number

  bookings: any[]

  paidPayments: {
    id: string
    booking_id: string
    amount: number | string
    paid_at: string | null
    created_at: string
  }[]

  ticketsSold: number
  revenue: number
  monthlyTickets: number
  uniqueCustomers: number
  averageRating: number
  reviewCount: number

  reviews: any[]

  salesChart: {
    date: string
    sales: number
  }[]
}

type Props = {
  data: DashboardData
}

type MenuKey =
  | 'overview'
  | 'experiences'
  | 'relaxation'
  | 'bookings'
  | 'customers'
  | 'reviews'
  | 'settings'
  | 'help'

const placeTypes = [
  {
    value: 'resort',
    label: 'Resort',
    icon: Waves,
  },
  {
    value: 'hotel',
    label: 'Hotel',
    icon: Hotel,
  },
  {
    value: 'lodge',
    label: 'Lodge',
    icon: TreePalm,
  },
  {
    value: 'spa',
    label: 'Spa',
    icon: Heart,
  },
  {
    value: 'beach_resort',
    label: 'Beach Resort',
    icon: Waves,
  },
  {
    value: 'casa_de_campo',
    label: 'Casa de Campo',
    icon: Building2,
  },
  {
    value: 'eco_lodge',
    label: 'Eco Lodge',
    icon: TreePalm,
  },
  {
    value: 'complexo_turistico',
    label: 'Complexo Turístico',
    icon: Building2,
  },
  {
    value: 'outro',
    label: 'Outro',
    icon: Store,
  },
]

const availableAmenities = [
  'Piscina',
  'Restaurante',
  'Bar',
  'Estacionamento',
  'Wi-Fi',
  'Área infantil',
  'Praia',
  'Jardim',
  'Quartos',
  'Ar condicionado',
  'Eventos',
  'Massagem',
]

export default function AgencyDashboardClient({
  data,
}: Props) {
  const [activeMenu, setActiveMenu] =
    useState<MenuKey>('overview')

  const [showPlaceForm, setShowPlaceForm] =
    useState(false)

  const [editingPlace, setEditingPlace] =
    useState<RelaxationPlace | null>(null)

  const [savingPlace, setSavingPlace] =
    useState(false)

  const [uploadingImage, setUploadingImage] =
    useState(false)

  const [selectedImage, setSelectedImage] =
    useState<File | null>(null)

  const imageInputRef =
    useRef<HTMLInputElement | null>(null)

  const [placeForm, setPlaceForm] = useState({
    name: '',
    type: 'resort',
    description: '',
    province: '',
    city: '',
    address: '',
    price_from: '',
    phone: '',
    whatsapp: '',
    email: '',
    website: '',
    instagram: '',
    amenities: [] as string[],
    cover_image_url: '',
  })

  const [message, setMessage] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  const safeData: DashboardData = {
    ...data,

    experiences: data?.experiences ?? [],

    relaxationPlaces:
      data?.relaxationPlaces ?? [],

    bookings: data?.bookings ?? [],

    paidPayments: data?.paidPayments ?? [],

    reviews: data?.reviews ?? [],

    salesChart: data?.salesChart ?? [],

    publishedCount:
      data?.publishedCount ?? 0,

    ticketsSold:
      data?.ticketsSold ?? 0,

    revenue:
      data?.revenue ?? 0,

    monthlyTickets:
      data?.monthlyTickets ?? 0,

    uniqueCustomers:
      data?.uniqueCustomers ?? 0,

    averageRating:
      data?.averageRating ?? 0,

    reviewCount:
      data?.reviewCount ?? 0,
  }

  const chartMax = useMemo(() => {
    const values =
      safeData.salesChart.map((item) =>
        Number(item.sales || 0),
      )

    const max = Math.max(...values, 0)

    return max > 0 ? max : 1
  }, [safeData.salesChart])

  const chartTotal = useMemo(() => {
    return safeData.salesChart.reduce(
      (total, item) =>
        total + Number(item.sales || 0),
      0,
    )
  }, [safeData.salesChart])

  const money = (
    value: number | string,
  ) => {
    return new Intl.NumberFormat('pt-AO', {
      style: 'currency',
      currency: 'AOA',
      maximumFractionDigits: 0,
    }).format(Number(value || 0))
  }

  const number = (
    value: number | string,
  ) => {
    return new Intl.NumberFormat(
      'pt-AO',
    ).format(Number(value || 0))
  }

  const formatDate = (
    value?: string | null,
  ) => {
    if (!value) return '—'

    return new Intl.DateTimeFormat(
      'pt-AO',
      {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'Africa/Luanda',
      },
    ).format(new Date(value))
  }

  const getExperience = (
    booking: any,
  ) => {
    const experience =
      booking?.experiences

    if (Array.isArray(experience)) {
      return experience[0] ?? null
    }

    return experience ?? null
  }

  const statusLabel = (
    status?: string,
  ) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmada'
      case 'pending':
        return 'Pendente'
      case 'cancelled':
        return 'Cancelada'
      case 'paid':
        return 'Paga'
      case 'published':
        return 'Publicada'
      case 'draft':
        return 'Rascunho'
      case 'approved':
        return 'Aprovado'
      case 'rejected':
        return 'Rejeitado'
      case 'suspended':
        return 'Suspenso'
      default:
        return status || '—'
    }
  }

  const statusClass = (
    status?: string,
  ) => {
    switch (status) {
      case 'confirmed':
      case 'paid':
      case 'published':
      case 'approved':
        return 'bg-emerald-50 text-emerald-700'

      case 'pending':
      case 'draft':
        return 'bg-amber-50 text-amber-700'

      case 'cancelled':
      case 'rejected':
        return 'bg-red-50 text-red-700'

      case 'suspended':
        return 'bg-gray-100 text-gray-600'

      default:
        return 'bg-gray-100 text-gray-600'
    }
  }

  const placeTypeLabel = (
    type: string,
  ) => {
    return (
      placeTypes.find(
        (item) => item.value === type,
      )?.label || type
    )
  }

  const placeTypeIcon = (
    type: string,
  ) => {
    const item = placeTypes.find(
      (place) =>
        place.value === type,
    )

    const Icon =
      item?.icon || Store

    return <Icon size={18} />
  }

  const menuItems: {
    key: MenuKey
    label: string
    icon: ReactNode
  }[] = [
    {
      key: 'overview',
      label: 'Visão geral',
      icon: <LayoutDashboard size={18} />,
    },
    {
      key: 'experiences',
      label: 'Experiências',
      icon: <Store size={18} />,
    },
    {
      key: 'relaxation',
      label: 'Locais para Relaxar',
      icon: <Waves size={18} />,
    },
    {
      key: 'bookings',
      label: 'Reservas',
      icon: <CalendarDays size={18} />,
    },
    {
      key: 'customers',
      label: 'Clientes',
      icon: <Users size={18} />,
    },
    {
      key: 'reviews',
      label: 'Avaliações',
      icon: <Star size={18} />,
    },
    {
      key: 'settings',
      label: 'Configurações',
      icon: <Settings size={18} />,
    },
    {
      key: 'help',
      label: 'Ajuda',
      icon: <CircleHelp size={18} />,
    },
  ]

  const customerRows = useMemo(() => {
    const map = new Map<string, any>()

    safeData.bookings.forEach(
      (booking) => {
        if (!booking?.user_id) return

        if (!map.has(booking.user_id)) {
          map.set(booking.user_id, {
            id: booking.user_id,
            name:
              booking.customer_name ||
              'Cliente',
            phone:
              booking.customer_phone ||
              '—',
            bookings: 0,
            total: 0,
          })
        }

        const customer =
          map.get(booking.user_id)

        customer.bookings += 1

        customer.total += Number(
          booking.total_price || 0,
        )
      },
    )

    return Array.from(
      map.values(),
    )
  }, [safeData.bookings])

  const pageTitle = {
    overview: 'Visão geral',
    experiences: 'Experiências',
    relaxation:
      'Locais para Relaxar',
    bookings: 'Reservas',
    customers: 'Clientes',
    reviews: 'Avaliações',
    settings: 'Configurações',
    help: 'Ajuda',
  }[activeMenu]

  function MetricCard({
    title,
    value,
    icon,
    description,
  }: {
    title: string
    value: string
    icon: ReactNode
    description: string
  }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-gray-500">
              {title}
            </p>

            <p className="mt-2 text-2xl font-black tracking-tight text-gray-950">
              {value}
            </p>
          </div>

          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            {icon}
          </div>
        </div>

        <p className="mt-4 text-xs text-gray-400">
          {description}
        </p>
      </div>
    )
  }

  function Sidebar() {
    return (
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-gray-200 bg-white lg:flex lg:flex-col">
        <div className="border-b border-gray-100 p-5">
          <Link
            href="/"
            className="flex items-center"
          >
            <span className="text-2xl font-black tracking-tight text-gray-950">
              wizenda
            </span>

            <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
          </Link>

          <div className="mt-6 flex items-center gap-3">
            {safeData.agency.logo_url ? (
              <img
                src={
                  safeData.agency.logo_url
                }
                alt={
                  safeData.agency.name
                }
                className="h-11 w-11 rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 font-black text-orange-500">
                {safeData.agency.name
                  ?.charAt(0)
                  ?.toUpperCase()}
              </div>
            )}

            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-gray-900">
                {safeData.agency.name}
              </p>

              <div className="mt-1 flex items-center gap-1">
                {safeData.agency
                  .is_verified && (
                  <>
                    <CheckCircle2
                      size={13}
                      className="text-emerald-500"
                    />

                    <span className="text-xs text-emerald-600">
                      Verificada
                    </span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto p-4">
          {menuItems.map(
            (item) => {
              const active =
                activeMenu ===
                item.key

              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() =>
                    setActiveMenu(
                      item.key,
                    )
                  }
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-semibold transition ${
                    active
                      ? 'bg-orange-50 text-orange-600'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              )
            },
          )}
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="rounded-2xl bg-gray-50 p-4">
            <p className="text-xs font-bold text-gray-900">
              Precisas de ajuda?
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Fala com a equipa Wizenda sempre que precisares.
            </p>

            <button
              type="button"
              onClick={() =>
                setActiveMenu('help')
              }
              className="mt-3 flex items-center gap-1 text-xs font-bold text-orange-500"
            >
              Abrir ajuda
              <ChevronRight
                size={14}
              />
            </button>
          </div>
        </div>
      </aside>
    )
  }

  function Overview() {
    const recentBookings =
      safeData.bookings.slice(0, 5)

    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard
            title="Receita total"
            value={money(
              safeData.revenue,
            )}
            icon={
              <BarChart3
                size={20}
              />
            }
            description="Total recebido por pagamentos confirmados"
          />

          <MetricCard
            title="Bilhetes vendidos"
            value={number(
              safeData.ticketsSold,
            )}
            icon={
              <Ticket size={20} />
            }
            description={`${number(
              safeData.monthlyTickets,
            )} este mês`}
          />

          <MetricCard
            title="Clientes"
            value={number(
              safeData.uniqueCustomers,
            )}
            icon={
              <Users size={20} />
            }
            description="Clientes com pagamentos confirmados"
          />

          <MetricCard
            title="Avaliação média"
            value={safeData.averageRating.toFixed(
              1,
            )}
            icon={
              <Star size={20} />
            }
            description={`${number(
              safeData.reviewCount,
            )} avaliações recebidas`}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Vendas
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Últimos 7 dias
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-black text-gray-950">
                  {money(
                    chartTotal,
                  )}
                </p>

                <p className="text-xs text-gray-400">
                  total no período
                </p>
              </div>
            </div>

            <div className="mt-8 flex h-64 items-end gap-3">
              {safeData.salesChart.map(
                (item) => {
                  const amount =
                    Number(
                      item.sales ||
                        0,
                    )

                  const height =
                    amount > 0
                      ? Math.max(
                          (amount /
                            chartMax) *
                            100,
                          5,
                        )
                      : 3

                  return (
                    <div
                      key={
                        item.date
                      }
                      className="flex h-full flex-1 flex-col items-center justify-end gap-2"
                    >
                      <div className="flex w-full flex-1 items-end">
                        <div
                          className="w-full rounded-t-xl bg-orange-500 transition hover:bg-orange-600"
                          style={{
                            height: `${height}%`,
                          }}
                          title={money(
                            amount,
                          )}
                        />
                      </div>

                      <span className="text-[10px] font-medium text-gray-400">
                        {new Intl.DateTimeFormat(
                          'pt-AO',
                          {
                            weekday:
                              'short',
                            day: '2-digit',
                            timeZone:
                              'Africa/Luanda',
                          },
                        )
                          .format(
                            new Date(
                              `${item.date}T12:00:00`,
                            ),
                          )
                          .replace(
                            '.',
                            '',
                          )}
                      </span>
                    </div>
                  )
                },
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-gray-950">
                  Experiências
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Estado atual
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setActiveMenu(
                    'experiences',
                  )
                }
                className="text-xs font-bold text-orange-500"
              >
                Ver todas
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {safeData.experiences
                .slice(0, 5)
                .map(
                  (
                    experience,
                  ) => (
                    <div
                      key={
                        experience.id
                      }
                      className="flex items-center gap-3 rounded-xl border border-gray-100 p-3"
                    >
                      {experience.cover_image ? (
                        <img
                          src={
                            experience.cover_image
                          }
                          alt={
                            experience.title
                          }
                          className="h-12 w-12 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-lg bg-gray-100" />
                      )}

                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {
                            experience.title
                          }
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {money(
                            experience.price,
                          )}
                        </p>
                      </div>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                          experience.status,
                        )}`}
                      >
                        {statusLabel(
                          experience.status,
                        )}
                      </span>
                    </div>
                  ),
                )}

              {safeData
                .experiences
                .length ===
                0 && (
                <div className="rounded-xl bg-gray-50 p-6 text-center">
                  <p className="text-sm text-gray-500">
                    Ainda não tens experiências.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-gray-100 p-6">
            <div>
              <h2 className="text-lg font-black text-gray-950">
                Reservas recentes
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Últimas reservas recebidas
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setActiveMenu(
                  'bookings',
                )
              }
              className="text-xs font-bold text-orange-500"
            >
              Ver todas
            </button>
          </div>

          {recentBookings.length >
          0 ? (
            <div className="divide-y divide-gray-100">
              {recentBookings.map(
                (booking) => {
                  const experience =
                    getExperience(
                      booking,
                    )

                  return (
                    <div
                      key={
                        booking.id
                      }
                      className="flex flex-wrap items-center gap-4 p-5"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 font-bold text-orange-500">
                        {(
                          booking.customer_name ||
                          'C'
                        )
                          .charAt(
                            0,
                          )
                          .toUpperCase()}
                      </div>

                      <div className="min-w-[160px] flex-1">
                        <p className="text-sm font-bold text-gray-900">
                          {booking.customer_name ||
                            'Cliente'}
                        </p>

                        <p className="mt-1 text-xs text-gray-400">
                          {experience?.title ||
                            'Experiência'}
                        </p>
                      </div>

                      <div className="text-sm text-gray-600">
                        {number(
                          booking.guests,
                        )}{' '}
                        pessoa(s)
                      </div>

                      <div className="text-sm font-bold text-gray-900">
                        {money(
                          booking.total_price,
                        )}
                      </div>

                      <span
                        className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass(
                          booking.status,
                        )}`}
                      >
                        {statusLabel(
                          booking.status,
                        )}
                      </span>
                    </div>
                  )
                },
              )}
            </div>
          ) : (
            <div className="p-10 text-center">
              <CalendarDays
                size={32}
                className="mx-auto text-gray-300"
              />

              <p className="mt-3 text-sm text-gray-500">
                Ainda não existem reservas.
              </p>
            </div>
          )}
        </section>
      </div>
    )
  }

  function Experiences() {
    return (
      <div className="space-y-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-black text-gray-950">
              As tuas experiências
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gere tudo o que a tua agência publica no Wizenda.
            </p>
          </div>

          <Link
            href="/agency/experiences/new"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
          >
            <Plus size={17} />
            Nova experiência
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {safeData.experiences.map(
            (experience) => (
              <div
                key={experience.id}
                className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
              >
                {experience.cover_image ? (
                  <img
                    src={
                      experience.cover_image
                    }
                    alt={
                      experience.title
                    }
                    className="h-44 w-full object-cover"
                  />
                ) : (
                  <div className="h-44 w-full bg-gray-100" />
                )}

                <div className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-black text-gray-950">
                      {
                        experience.title
                      }
                    </h3>

                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold ${statusClass(
                        experience.status,
                      )}`}
                    >
                      {statusLabel(
                        experience.status,
                      )}
                    </span>
                  </div>

                  <p className="mt-2 text-sm text-gray-500">
                    {experience.city ||
                      experience.province ||
                      experience.location ||
                      'Angola'}
                  </p>

                  <div className="mt-5 flex items-center justify-between">
                    <p className="font-black text-gray-950">
                      {money(
                        experience.price,
                      )}
                    </p>

                    <Link
                      href={`/agency/experiences/${experience.id}/edit`}
                      className="inline-flex items-center gap-1 rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-gray-700 hover:bg-gray-200"
                    >
                      <Pencil
                        size={14}
                      />
                      Editar
                    </Link>
                  </div>
                </div>
              </div>
            ),
          )}

          {safeData.experiences
            .length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center md:col-span-2 xl:col-span-3">
              <Store
                size={35}
                className="mx-auto text-gray-300"
              />

              <h3 className="mt-4 font-bold text-gray-900">
                Ainda não tens experiências
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                Cria a primeira experiência da tua agência.
              </p>

              <Link
                href="/agency/experiences/new"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white"
              >
                <Plus size={17} />
                Criar experiência
              </Link>
            </div>
          )}
        </div>
      </div>
    )
  }

  function openNewPlace() {
    setEditingPlace(null)

    setPlaceForm({
      name: '',
      type: 'resort',
      description: '',
      province: '',
      city: '',
      address: '',
      price_from: '',
      phone: '',
      whatsapp: '',
      email: '',
      website: '',
      instagram: '',
      amenities: [],
      cover_image_url: '',
    })

    setSelectedImage(null)
    setMessage(null)
    setShowPlaceForm(true)
  }

  function openEditPlace(
    place: RelaxationPlace,
  ) {
    setEditingPlace(place)

    setPlaceForm({
      name: place.name || '',
      type: place.type || 'resort',
      description:
        place.description || '',
      province:
        place.province || '',
      city: place.city || '',
      address:
        place.address || '',
      price_from:
        place.price_from != null
          ? String(
              place.price_from,
            )
          : '',
      phone: place.phone || '',
      whatsapp:
        place.whatsapp || '',
      email: place.email || '',
      website:
        place.website || '',
      instagram:
        place.instagram || '',
      amenities:
        place.amenities || [],
      cover_image_url:
        place.cover_image_url ||
        '',
    })

    setSelectedImage(null)
    setMessage(null)
    setShowPlaceForm(true)
  }

  function closePlaceForm() {
    if (savingPlace) return

    setShowPlaceForm(false)
    setEditingPlace(null)
    setSelectedImage(null)
    setMessage(null)
  }

  function toggleAmenity(
    amenity: string,
  ) {
    setPlaceForm((current) => {
      const exists =
        current.amenities.includes(
          amenity,
        )

      return {
        ...current,
        amenities: exists
          ? current.amenities.filter(
              (item) =>
                item !==
                amenity,
            )
          : [
              ...current.amenities,
              amenity,
            ],
      }
    })
  }

  async function uploadPlaceImage(
    file: File,
  ) {
    const supabase =
      createClient()

    setUploadingImage(true)
    setMessage(null)

    try {
      const extension =
        file.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg'

      const fileName = `${safeData.agency.id}/${crypto.randomUUID()}.${extension}`

      const {
        error,
      } = await supabase.storage
        .from(
          'relaxation-places',
        )
        .upload(
          fileName,
          file,
          {
            cacheControl:
              '3600',
            upsert: false,
            contentType:
              file.type,
          },
        )

      if (error) {
        throw error
      }

      const {
        data,
      } = supabase.storage
        .from(
          'relaxation-places',
        )
        .getPublicUrl(
          fileName,
        )

      setPlaceForm(
        (current) => ({
          ...current,
          cover_image_url:
            data.publicUrl,
        }),
      )

      setSelectedImage(file)

      setMessage({
        type: 'success',
        text: 'Imagem carregada com sucesso.',
      })
    } catch (error: any) {
      console.error(
        'Upload image error:',
        error,
      )

      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Não foi possível carregar a imagem.',
      })
    } finally {
      setUploadingImage(false)
    }
  }

  async function savePlace() {
    if (!placeForm.name.trim()) {
      setMessage({
        type: 'error',
        text: 'Indica o nome do local.',
      })

      return
    }

    if (!placeForm.province.trim()) {
      setMessage({
        type: 'error',
        text: 'Indica a província.',
      })

      return
    }

    if (!placeForm.city.trim()) {
      setMessage({
        type: 'error',
        text: 'Indica a cidade.',
      })

      return
    }

    const supabase =
      createClient()

    setSavingPlace(true)
    setMessage(null)

    try {
      const slugBase =
        placeForm.name
          .toLowerCase()
          .normalize('NFD')
          .replace(
            /[\u0300-\u036f]/g,
            '',
          )
          .replace(
            /[^a-z0-9]+/g,
            '-',
          )
          .replace(
            /^-+|-+$/g,
            '',
          )

      const slug = `${slugBase}-${safeData.agency.id.slice(
        0,
        8,
      )}`

      const payload = {
        agency_id:
          safeData.agency.id,

        name: placeForm.name.trim(),

        slug,

        type: placeForm.type,

        description:
          placeForm.description.trim() ||
          null,

        province:
          placeForm.province.trim() ||
          null,

        city:
          placeForm.city.trim() ||
          null,

        address:
          placeForm.address.trim() ||
          null,

        cover_image_url:
          placeForm.cover_image_url ||
          null,

        gallery_urls:
          editingPlace?.gallery_urls ||
          [],

        price_from:
          placeForm.price_from
            ? Number(
                placeForm.price_from,
              )
            : null,

        price_currency: 'AOA',

        phone:
          placeForm.phone.trim() ||
          null,

        whatsapp:
          placeForm.whatsapp.trim() ||
          null,

        email:
          placeForm.email.trim() ||
          null,

        website:
          placeForm.website.trim() ||
          null,

        instagram:
          placeForm.instagram.trim() ||
          null,

        opening_hours:
          editingPlace?.opening_hours ||
          null,

        amenities:
          placeForm.amenities,

        status:
          editingPlace?.status ||
          'pending',
      }

      if (editingPlace) {
        const {
          error,
        } = await supabase
          .from(
            'relaxation_places',
          )
          .update({
            ...payload,
            updated_at:
              new Date().toISOString(),
          })
          .eq(
            'id',
            editingPlace.id,
          )

        if (error) {
          throw error
        }

        setMessage({
          type: 'success',
          text: 'Local atualizado com sucesso.',
        })
      } else {
        const {
          data: created,
          error,
        } = await supabase
          .from(
            'relaxation_places',
          )
          .insert(
            payload,
          )
          .select()
          .single()

        if (error) {
          throw error
        }

        if (created) {
          safeData.relaxationPlaces =
            [
              created,
              ...safeData.relaxationPlaces,
            ]
        }

        setMessage({
          type: 'success',
          text: 'Local enviado para aprovação do Wizenda.',
        })
      }

      setShowPlaceForm(false)
      setEditingPlace(null)
      setSelectedImage(null)

      window.location.reload()
    } catch (error: any) {
      console.error(
        'Save relaxation place error:',
        error,
      )

      setMessage({
        type: 'error',
        text:
          error?.message ||
          'Não foi possível guardar o local.',
      })
    } finally {
      setSavingPlace(false)
    }
  }

  async function deletePlace(
    place: RelaxationPlace,
  ) {
    const confirmed =
      window.confirm(
        `Queres eliminar "${place.name}"?`,
      )

    if (!confirmed) return

    const supabase =
      createClient()

    try {
      const {
        error,
      } = await supabase
        .from(
          'relaxation_places',
        )
        .delete()
        .eq(
          'id',
          place.id,
        )

      if (error) {
        throw error
      }

      window.location.reload()
    } catch (error) {
      console.error(
        'Delete place error:',
        error,
      )

      setMessage({
        type: 'error',
        text: 'Não foi possível eliminar o local.',
      })
    }
  }

  function RelaxationPlaces() {
    return (
      <div className="space-y-5">
        {showPlaceForm ? (
          <PlaceForm />
        ) : (
          <>
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-black text-gray-950">
                  Locais para Relaxar
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Adiciona os locais da tua agência para os viajantes descobrirem no Wizenda.
                </p>
              </div>

              <button
                type="button"
                onClick={
                  openNewPlace
                }
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
              >
                <Plus size={17} />
                Adicionar local
              </button>
            </div>

            {message && (
              <div
                className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
                  message.type ===
                  'success'
                    ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}
              >
                {message.type ===
                'success' ? (
                  <CheckCircle2
                    size={18}
                  />
                ) : (
                  <AlertCircle
                    size={18}
                  />
                )}

                {message.text}
              </div>
            )}

            {safeData
              .relaxationPlaces
              .length === 0 ? (
              <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                  <Waves
                    size={27}
                  />
                </div>

                <h3 className="mt-5 font-black text-gray-950">
                  Ainda não tens locais
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                  Adiciona resorts, hotéis, spas ou outros locais onde os viajantes possam relaxar.
                </p>

                <button
                  type="button"
                  onClick={
                    openNewPlace
                  }
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                >
                  <Plus size={17} />
                  Adicionar primeiro local
                </button>
              </div>
            ) : (
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {safeData.relaxationPlaces.map(
                  (place) => (
                    <div
                      key={
                        place.id
                      }
                      className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
                    >
                      <div className="relative h-48 bg-gray-100">
                        {place.cover_image_url ? (
                          <img
                            src={
                              place.cover_image_url
                            }
                            alt={
                              place.name
                            }
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full items-center justify-center text-gray-300">
                            <ImagePlus
                              size={38}
                            />
                          </div>
                        )}

                        <div className="absolute left-3 top-3 flex items-center gap-2">
                          <span className="flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold text-gray-700 shadow-sm">
                            {placeTypeIcon(
                              place.type,
                            )}

                            {placeTypeLabel(
                              place.type,
                            )}
                          </span>
                        </div>

                        <span
                          className={`absolute right-3 top-3 rounded-full px-3 py-1.5 text-[10px] font-bold shadow-sm ${statusClass(
                            place.status,
                          )}`}
                        >
                          {statusLabel(
                            place.status,
                          )}
                        </span>
                      </div>

                      <div className="p-5">
                        <h3 className="font-black text-gray-950">
                          {
                            place.name
                          }
                        </h3>

                        <div className="mt-2 flex items-center gap-1.5 text-sm text-gray-500">
                          <MapPin
                            size={15}
                            className="shrink-0 text-orange-500"
                          />

                          <span className="truncate">
                            {place.city ||
                              '—'}
                            {place.province
                              ? `, ${place.province}`
                              : ''}
                          </span>
                        </div>

                        {place.price_from !=
                          null && (
                          <div className="mt-3 flex items-center gap-1.5 text-sm">
                            <Ticket
                              size={15}
                              className="text-orange-500"
                            />

                            <span className="font-bold text-gray-900">
                              A partir de{' '}
                              {money(
                                place.price_from,
                              )}
                            </span>
                          </div>
                        )}

                        {place.rejection_reason && (
                          <div className="mt-3 rounded-xl bg-red-50 p-3 text-xs leading-5 text-red-700">
                            <div className="flex items-start gap-2">
                              <AlertCircle
                                size={15}
                                className="mt-0.5 shrink-0"
                              />

                              <span>
                                {
                                  place.rejection_reason
                                }
                              </span>
                            </div>
                          </div>
                        )}

                        <div className="mt-5 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openEditPlace(
                                place,
                              )
                            }
                            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gray-100 px-3 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-200"
                          >
                            <Pencil
                              size={14}
                            />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              deletePlace(
                                place,
                              )
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-100"
                            title="Eliminar"
                          >
                            <Trash2
                              size={16}
                            />
                          </button>
                        </div>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  function PlaceForm() {
    return (
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-gray-950">
              {editingPlace
                ? 'Editar local'
                : 'Adicionar local'}
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Preenche as informações que os viajantes vão ver.
            </p>
          </div>

          <button
            type="button"
            onClick={
              closePlaceForm
            }
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>

        {message && (
          <div
            className={`flex items-center gap-3 rounded-xl border p-4 text-sm ${
              message.type ===
              'success'
                ? 'border-emerald-100 bg-emerald-50 text-emerald-700'
                : 'border-red-100 bg-red-50 text-red-700'
            }`}
          >
            {message.type ===
            'success' ? (
              <CheckCircle2
                size={18}
              />
            ) : (
              <AlertCircle
                size={18}
              />
            )}

            {message.text}
          </div>
        )}

        <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Store size={19} />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Informações do local
                  </h3>

                  <p className="text-xs text-gray-400">
                    Dados principais
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Nome do local"
                  icon={
                    <Store
                      size={16}
                    />
                  }
                  value={
                    placeForm.name
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        name: value,
                      }),
                    )
                  }
                  placeholder="Ex.: Resort Kalandula"
                  required
                />

                <div>
                  <label className="mb-2 block text-xs font-bold text-gray-700">
                    Tipo de local
                  </label>

                  <div className="relative">
                    <Store
                      size={16}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <select
                      value={
                        placeForm.type
                      }
                      onChange={(
                        event,
                      ) =>
                        setPlaceForm(
                          (
                            current,
                          ) => ({
                            ...current,
                            type: event
                              .target
                              .value,
                          }),
                        )
                      }
                      className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-10 py-3 text-sm font-medium text-gray-900 outline-none focus:border-orange-400"
                    >
                      {placeTypes.map(
                        (type) => (
                          <option
                            key={
                              type.value
                            }
                            value={
                              type.value
                            }
                          >
                            {
                              type.label
                            }
                          </option>
                        ),
                      )}
                    </select>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <label className="mb-2 block text-xs font-bold text-gray-700">
                  Descrição
                </label>

                <textarea
                  value={
                    placeForm.description
                  }
                  onChange={(
                    event,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        description:
                          event
                            .target
                            .value,
                      }),
                    )
                  }
                  rows={5}
                  placeholder="Descreve o local, ambiente, atividades e o que o visitante pode encontrar..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <MapPin
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Localização
                  </h3>

                  <p className="text-xs text-gray-400">
                    Onde o visitante encontra o local
                  </p>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field
                  label="Província"
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  value={
                    placeForm.province
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        province:
                          value,
                      }),
                    )
                  }
                  placeholder="Ex.: Malanje"
                  required
                />

                <Field
                  label="Cidade / Município"
                  icon={
                    <Building2
                      size={16}
                    />
                  }
                  value={
                    placeForm.city
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        city: value,
                      }),
                    )
                  }
                  placeholder="Ex.: Kalandula"
                  required
                />
              </div>

              <div className="mt-4">
                <Field
                  label="Endereço"
                  icon={
                    <MapPin
                      size={16}
                    />
                  }
                  value={
                    placeForm.address
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        address:
                          value,
                      }),
                    )
                  }
                  placeholder="Rua, referência ou localização"
                />
              </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Heart
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Comodidades
                  </h3>

                  <p className="text-xs text-gray-400">
                    O que existe no local
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {availableAmenities.map(
                  (amenity) => {
                    const active =
                      placeForm.amenities.includes(
                        amenity,
                      )

                    return (
                      <button
                        key={
                          amenity
                        }
                        type="button"
                        onClick={() =>
                          toggleAmenity(
                            amenity,
                          )
                        }
                        className={`rounded-xl border px-3 py-2 text-xs font-bold transition ${
                          active
                            ? 'border-orange-500 bg-orange-50 text-orange-600'
                            : 'border-gray-200 bg-white text-gray-600 hover:border-orange-200'
                        }`}
                      >
                        {amenity}
                      </button>
                    )
                  },
                )}
              </div>
            </section>
          </div>

          <div className="space-y-5">
            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <ImagePlus
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Imagem principal
                  </h3>

                  <p className="text-xs text-gray-400">
                    Esta será a imagem apresentada aos viajantes
                  </p>
                </div>
              </div>

              <input
                ref={
                  imageInputRef
                }
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
                onChange={async (
                  event,
                ) => {
                  const file =
                    event
                      .target
                      .files?.[0]

                  if (!file) return

                  if (
                    file.size >
                    5 *
                      1024 *
                      1024
                  ) {
                    setMessage({
                      type: 'error',
                      text: 'A imagem deve ter no máximo 5 MB.',
                    })

                    return
                  }

                  await uploadPlaceImage(
                    file,
                  )
                }}
              />

              <button
                type="button"
                onClick={() =>
                  imageInputRef.current?.click()
                }
                disabled={
                  uploadingImage
                }
                className="group relative block w-full overflow-hidden rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 text-left hover:border-orange-300"
              >
                {placeForm.cover_image_url ? (
                  <>
                    <img
                      src={
                        placeForm.cover_image_url
                      }
                      alt="Imagem do local"
                      className="h-56 w-full object-cover"
                    />

                    <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition group-hover:opacity-100">
                      <div className="flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-bold text-gray-900">
                        <Upload
                          size={16}
                        />
                        Alterar imagem
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="flex h-56 flex-col items-center justify-center px-5 text-center">
                    <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-orange-500 shadow-sm">
                      {uploadingImage ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-orange-200 border-t-orange-500" />
                      ) : (
                        <Upload
                          size={23}
                        />
                      )}
                    </div>

                    <p className="mt-4 text-sm font-bold text-gray-900">
                      {uploadingImage
                        ? 'A carregar imagem...'
                        : 'Carregar imagem'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      JPG, PNG ou WEBP • Máx. 5 MB
                    </p>
                  </div>
                )}
              </button>

              {selectedImage && (
                <p className="mt-2 truncate text-xs text-gray-400">
                  {selectedImage.name}
                </p>
              )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Ticket
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Preço
                  </h3>

                  <p className="text-xs text-gray-400">
                    Valor inicial, se aplicável
                  </p>
                </div>
              </div>

              <Field
                label="Preço a partir de"
                icon={
                  <Ticket
                    size={16}
                  />
                }
                type="number"
                value={
                  placeForm.price_from
                }
                onChange={(
                  value,
                ) =>
                  setPlaceForm(
                    (
                      current,
                    ) => ({
                      ...current,
                      price_from:
                        value,
                    }),
                  )
                }
                placeholder="Ex.: 15000"
              />
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  <Phone
                    size={19}
                  />
                </div>

                <div>
                  <h3 className="font-black text-gray-950">
                    Contactos
                  </h3>

                  <p className="text-xs text-gray-400">
                    Como os visitantes podem contactar
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <Field
                  label="Telefone"
                  icon={
                    <Phone
                      size={16}
                    />
                  }
                  value={
                    placeForm.phone
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        phone: value,
                      }),
                    )
                  }
                  placeholder="+244 ..."
                />

                <Field
                  label="WhatsApp"
                  icon={
                    <MessageCircle
                      size={16}
                    />
                  }
                  value={
                    placeForm.whatsapp
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        whatsapp:
                          value,
                      }),
                    )
                  }
                  placeholder="+244 ..."
                />

                <Field
                  label="Email"
                  icon={
                    <Mail
                      size={16}
                    />
                  }
                  type="email"
                  value={
                    placeForm.email
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        email: value,
                      }),
                    )
                  }
                  placeholder="contacto@empresa.ao"
                />

                <Field
                  label="Website"
                  icon={
                    <Globe
                      size={16}
                    />
                  }
                  value={
                    placeForm.website
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        website:
                          value,
                      }),
                    )
                  }
                  placeholder="https://..."
                />

                <Field
                  label="Instagram"
                  icon={
                   <AtSign size={18} />
                  }
                  value={
                    placeForm.instagram
                  }
                  onChange={(
                    value,
                  ) =>
                    setPlaceForm(
                      (
                        current,
                      ) => ({
                        ...current,
                        instagram:
                          value,
                      }),
                    )
                  }
                  placeholder="@nomedolocal"
                />
              </div>
            </section>
          </div>
        </div>

        <div className="sticky bottom-4 z-20 flex flex-col justify-end gap-3 rounded-2xl border border-gray-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:flex-row">
          <button
            type="button"
            onClick={
              closePlaceForm
            }
            disabled={
              savingPlace
            }
            className="rounded-xl bg-gray-100 px-5 py-3 text-sm font-bold text-gray-700 hover:bg-gray-200 disabled:opacity-50"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={
              savePlace
            }
            disabled={
              savingPlace ||
              uploadingImage
            }
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {savingPlace ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                A guardar...
              </>
            ) : (
              <>
                <CheckCircle2
                  size={17}
                />
                {editingPlace
                  ? 'Guardar alterações'
                  : 'Enviar para aprovação'}
              </>
            )}
          </button>
        </div>
      </div>
    )
  }

  function Field({
    label,
    icon,
    value,
    onChange,
    placeholder,
    type = 'text',
    required = false,
  }: {
    label: string
    icon: ReactNode
    value: string
    onChange: (
      value: string,
    ) => void
    placeholder?: string
    type?: string
    required?: boolean
  }) {
    return (
      <div>
        <label className="mb-2 block text-xs font-bold text-gray-700">
          {label}
          {required && (
            <span className="ml-1 text-orange-500">
              *
            </span>
          )}
        </label>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {icon}
          </span>

          <input
            type={type}
            value={value}
            onChange={(
              event,
            ) =>
              onChange(
                event.target
                  .value,
              )
            }
            placeholder={
              placeholder
            }
            className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-50"
          />
        </div>
      </div>
    )
  }

  function Bookings() {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-black text-gray-950">
            Reservas
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Consulta e acompanha as reservas dos teus clientes.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {safeData.bookings.map(
            (booking) => {
              const experience =
                getExperience(
                  booking,
                )

              return (
                <div
                  key={
                    booking.id
                  }
                  className="flex flex-wrap items-center gap-4 p-5"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-50 font-bold text-orange-500">
                    {(
                      booking.customer_name ||
                      'C'
                    )
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="min-w-[180px] flex-1">
                    <p className="font-bold text-gray-900">
                      {booking.customer_name ||
                        'Cliente'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {booking.customer_phone ||
                        'Sem telefone'}
                    </p>
                  </div>

                  <div className="min-w-[160px]">
                    <p className="text-sm font-semibold text-gray-800">
                      {experience?.title ||
                        'Experiência'}
                    </p>

                    <p className="mt-1 text-xs text-gray-400">
                      {formatDate(
                        booking.booking_date,
                      )}
                    </p>
                  </div>

                  <div className="text-sm text-gray-600">
                    {number(
                      booking.guests,
                    )}{' '}
                    pessoa(s)
                  </div>

                  <div className="font-bold text-gray-900">
                    {money(
                      booking.total_price,
                    )}
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${statusClass(
                      booking.status,
                    )}`}
                  >
                    {statusLabel(
                      booking.status,
                    )}
                  </span>
                </div>
              )
            },
          )}

          {safeData.bookings
            .length === 0 && (
            <div className="p-12 text-center text-sm text-gray-500">
              Ainda não existem reservas.
            </div>
          )}
        </div>
      </div>
    )
  }

  function Customers() {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <h2 className="text-xl font-black text-gray-950">
            Clientes
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Clientes que já fizeram reservas na tua agência.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {customerRows.map(
            (customer) => (
              <div
                key={
                  customer.id
                }
                className="flex flex-wrap items-center gap-4 p-5"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 font-bold text-gray-700">
                  {customer.name
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="min-w-[180px] flex-1">
                  <p className="font-bold text-gray-900">
                    {
                      customer.name
                    }
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {
                      customer.phone
                    }
                  </p>
                </div>

                <div className="text-sm text-gray-600">
                  {number(
                    customer.bookings,
                  )}{' '}
                  reserva(s)
                </div>

                <div className="font-bold text-gray-900">
                  {money(
                    customer.total,
                  )}
                </div>
              </div>
            ),
          )}

          {customerRows
            .length === 0 && (
            <div className="p-12 text-center text-sm text-gray-500">
              Ainda não existem clientes.
            </div>
          )}
        </div>
      </div>
    )
  }

  function Reviews() {
    return (
      <div className="space-y-5">
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-5">
            <div>
              <p className="text-4xl font-black text-gray-950">
                {safeData.averageRating.toFixed(
                  1,
                )}
              </p>

              <div className="mt-2 flex items-center gap-1">
                {[
                  1,
                  2,
                  3,
                  4,
                  5,
                ].map(
                  (item) => (
                    <Star
                      key={
                        item
                      }
                      size={
                        16
                      }
                      className={
                        item <=
                        Math.round(
                          safeData.averageRating,
                        )
                          ? 'fill-orange-400 text-orange-400'
                          : 'text-gray-200'
                      }
                    />
                  ),
                )}
              </div>
            </div>

            <div>
              <p className="font-bold text-gray-900">
                Avaliação média
              </p>

              <p className="mt-1 text-sm text-gray-500">
                {number(
                  safeData.reviewCount,
                )}{' '}
                avaliações
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {safeData.reviews.map(
            (review) => (
              <div
                key={
                  review.id
                }
                className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-1">
                    {[
                      1,
                      2,
                      3,
                      4,
                      5,
                    ].map(
                      (item) => (
                        <Star
                          key={
                            item
                          }
                          size={
                            15
                          }
                          className={
                            item <=
                            Number(
                              review.rating,
                            )
                              ? 'fill-orange-400 text-orange-400'
                              : 'text-gray-200'
                          }
                        />
                      ),
                    )}
                  </div>

                  <span className="text-xs text-gray-400">
                    {formatDate(
                      review.created_at,
                    )}
                  </span>
                </div>

                <p className="mt-4 text-sm leading-6 text-gray-600">
                  {review.comment ||
                    'Sem comentário.'}
                </p>
              </div>
            ),
          )}

          {safeData.reviews
            .length === 0 && (
            <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center">
              <Star
                size={35}
                className="mx-auto text-gray-300"
              />

              <p className="mt-4 text-sm text-gray-500">
                Ainda não existem avaliações.
              </p>
            </div>
          )}
        </div>
      </div>
    )
  }

  function SettingsPage() {
    return (
      <div className="grid gap-5 lg:grid-cols-2">
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-950">
            Dados da agência
          </h2>

          <div className="mt-6 space-y-4">
            <Info
              label="Nome"
              value={
                safeData.agency.name
              }
            />

            <Info
              label="Email"
              value={
                safeData.agency.email
              }
            />

            <Info
              label="Telefone"
              value={
                safeData.agency.phone
              }
            />

            <Info
              label="Cidade"
              value={
                safeData.agency.city
              }
            />

            <Info
              label="Província"
              value={
                safeData.agency
                  .province
              }
            />

            <Info
              label="Endereço"
              value={
                safeData.agency
                  .address
              }
            />
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-black text-gray-950">
            Estado da conta
          </h2>

          <div className="mt-6 rounded-2xl bg-gray-50 p-5">
            <div className="flex items-center gap-3">
              {safeData.agency
                .is_verified ? (
                <CheckCircle2
                  size={22}
                  className="text-emerald-500"
                />
              ) : (
                <Eye
                  size={22}
                  className="text-amber-500"
                />
              )}

              <div>
                <p className="font-bold text-gray-900">
                  {safeData.agency
                    .is_verified
                    ? 'Agência verificada'
                    : 'Verificação pendente'}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Estado atual da tua agência no Wizenda.
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>
    )
  }

  function Help() {
    return (
      <div className="grid gap-5 md:grid-cols-2">
        <HelpCard
          icon={
            <MessageSquare
              size={21}
            />
          }
          title="Falar com o Wizenda"
          text="Precisas de ajuda com reservas, pagamentos ou experiências?"
        />

        <HelpCard
          icon={
            <Store size={21} />
          }
          title="Publicar experiências"
          text="Cria experiências com datas, horários, imagens e preços."
        />

        <HelpCard
          icon={
            <Waves size={21} />
          }
          title="Locais para Relaxar"
          text="Adiciona resorts, hotéis, spas e outros locais turísticos."
        />

        <HelpCard
          icon={
            <Settings
              size={21}
            />
          }
          title="Configurações"
          text="Mantém os dados da tua agência atualizados."
        />
      </div>
    )
  }

  function Info({
    label,
    value,
  }: {
    label: string
    value: string | null
  }) {
    return (
      <div className="border-b border-gray-100 pb-3">
        <p className="text-xs font-medium text-gray-400">
          {label}
        </p>

        <p className="mt-1 text-sm font-semibold text-gray-900">
          {value ||
            'Não informado'}
        </p>
      </div>
    )
  }

  function HelpCard({
    icon,
    title,
    text,
  }: {
    icon: ReactNode
    title: string
    text: string
  }) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          {icon}
        </div>

        <h3 className="mt-5 font-black text-gray-950">
          {title}
        </h3>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          {text}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f7f7f8]">
      <Sidebar />

      <main className="min-h-screen lg:ml-64">
        <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/90 backdrop-blur-xl">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-6 lg:px-8">
            <div>
              <h1 className="text-lg font-black text-gray-950 sm:text-xl">
                {pageTitle}
              </h1>

              <p className="hidden text-xs text-gray-400 sm:block">
                {safeData.agency.name}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="hidden rounded-full bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-500 sm:block">
                {safeData.agency
                  .is_verified
                  ? 'Agência verificada'
                  : 'Conta ativa'}
              </div>

              <Link
                href="/agency/experiences/new"
                className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-3 py-2.5 text-xs font-bold text-white hover:bg-orange-600 sm:px-4 sm:text-sm"
              >
                <Plus
                  size={16}
                />

                <span className="hidden sm:inline">
                  Nova experiência
                </span>

                <span className="sm:hidden">
                  Nova
                </span>
              </Link>
            </div>
          </div>

          <div className="flex gap-1 overflow-x-auto border-t border-gray-100 px-5 py-2 lg:hidden">
            {menuItems.map(
              (item) => {
                const active =
                  activeMenu ===
                  item.key

                return (
                  <button
                    key={
                      item.key
                    }
                    type="button"
                    onClick={() =>
                      setActiveMenu(
                        item.key,
                      )
                    }
                    className={`flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold ${
                      active
                        ? 'bg-orange-50 text-orange-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                )
              },
            )}
          </div>
        </header>

        <div className="mx-auto max-w-[1500px] p-5 sm:p-6 lg:p-8">
          {activeMenu ===
            'overview' && (
            <Overview />
          )}

          {activeMenu ===
            'experiences' && (
            <Experiences />
          )}

          {activeMenu ===
            'relaxation' && (
            <RelaxationPlaces />
          )}

          {activeMenu ===
            'bookings' && (
            <Bookings />
          )}

          {activeMenu ===
            'customers' && (
            <Customers />
          )}

          {activeMenu ===
            'reviews' && (
            <Reviews />
          )}

          {activeMenu ===
            'settings' && (
            <SettingsPage />
          )}

          {activeMenu ===
            'help' && (
            <Help />
          )}
        </div>
      </main>
    </div>
  )
}