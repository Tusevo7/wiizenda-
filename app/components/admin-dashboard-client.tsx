'use client'

import {
  BarChart3,
  Bell,
  Building2,
  CalendarCheck,
  CheckCircle2,
  ChevronRight,
  FileText,
  LayoutDashboard,
  LockKeyhole,
  Medal,
  Music,
  RotateCcw,
  Settings,
  ShieldCheck,
  Trash2,
  TrendingUp,
  UserCog,
  Users,
  XCircle,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MenuKey =
  | 'overview'
  | 'users'
  | 'companies'
  | 'content'
  | 'music'
  | 'bookings'
  | 'points'
  | 'notifications'
  | 'security'
  | 'reports'
  | 'admins'
  | 'settings'

type StatIcon = typeof Users

type AdminUser = {
  id: string
  full_name: string | null
  role: string
  phone: string | null
  city: string | null
  created_at: string
}

type AdminAgency = {
  id: string
  owner_id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  cover_image: string | null
  phone: string | null
  email: string | null
  province: string | null
  city: string | null
  address: string | null
  status: string
  is_verified: boolean
  verification_status: string
  legal_name: string | null
  nif: string | null
  responsible_name: string | null
  responsible_document: string | null
  verified_at: string | null
  verified_by: string | null
  rejection_reason: string | null
  suspension_reason: string | null
  suspended_at: string | null
  blocked_at: string | null
  created_at: string
  updated_at: string
}

type ExperienceAgency = {
  id: string
  name: string
  logo_url: string | null
  is_verified: boolean
  verification_status: string
  status?: string
}

type AdminExperience = {
  id: string
  agency_id: string | null
  title: string
  slug: string
  description: string | null
  category: string
  province: string
  city: string | null
  location: string | null
  price: number | string
  duration_hours: number | string | null
  capacity: number | null
  cover_image: string | null
  status: string
  activity_start_at: string | null
  activity_end_at: string | null
  created_at: string
  updated_at: string
  agencies:
    | ExperienceAgency
    | ExperienceAgency[]
    | null
}

type MusicTrack = {
  id: string
  title: string
  artist: string | null
  genre: string | null
  audio_url: string
  cover_url: string | null
  duration_seconds: number | null
  preview_start_seconds: number | null
  preview_duration_seconds: number | null
  is_active: boolean
  created_at: string
}

type DashboardProps = {
  stats: {
    totalUsers: number
    activeUsersMonth: number
    totalAgencies: number
    bookingsMonth: number
    totalRevenue: number
    monthlyRevenue: number
    pointsGenerated: number
    pointsUsed: number
  }

  growthData: {
    month: string
    value: number
  }[]

  reservationCategories: {
    name: string
    value: number
  }[]

  revenueCategories: {
    name: string
    value: number
  }[]

  recentActivities: {
    title: string
    description: string
    time: string
  }[]

  users?: AdminUser[]

  agencies?: AdminAgency[]

  experiences?: AdminExperience[]
}

const menuSections = [
  {
    label: 'Principal',
    items: [
      {
        key: 'overview' as MenuKey,
        label: 'Visão geral',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    label: 'Gestão',
    items: [
      {
        key: 'users' as MenuKey,
        label: 'Usuários',
        icon: Users,
      },
      {
        key: 'companies' as MenuKey,
        label: 'Empresas',
        icon: Building2,
      },
      {
        key: 'content' as MenuKey,
        label: 'Conteúdo',
        icon: FileText,
      },
      {
        key: 'music' as MenuKey,
        label: 'Músicas',
        icon: Music,
      },
      {
        key: 'bookings' as MenuKey,
        label: 'Reservas',
        icon: CalendarCheck,
      },
      {
        key: 'points' as MenuKey,
        label: 'Pontos',
        icon: Medal,
      },
    ],
  },
  {
    label: 'Sistema',
    items: [
      {
        key: 'notifications' as MenuKey,
        label: 'Notificações',
        icon: Bell,
      },
      {
        key: 'security' as MenuKey,
        label: 'Segurança',
        icon: LockKeyhole,
      },
      {
        key: 'reports' as MenuKey,
        label: 'Relatórios',
        icon: BarChart3,
      },
    ],
  },
  {
    label: 'Administração',
    items: [
      {
        key: 'admins' as MenuKey,
        label: 'Gestão de Admins',
        icon: UserCog,
      },
      {
        key: 'settings' as MenuKey,
        label: 'Configurações',
        icon: Settings,
      },
    ],
  },
]

function formatNumber(value: number) {
  return value.toLocaleString('pt-AO')
}

function formatKz(value: number) {
  if (value >= 1_000_000) {
    return `${(value / 1_000_000).toFixed(1)} M Kz`
  }

  if (value >= 1_000) {
    return `${(value / 1_000).toFixed(1)} mil Kz`
  }

  return `${value.toLocaleString('pt-AO')} Kz`
}

function formatDate(date: string | null) {
  if (!date) return '—'

  return new Intl.DateTimeFormat('pt-PT', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date))
}

function formatDuration(seconds: number | null) {
  if (!seconds || seconds <= 0) {
    return '—'
  }

  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)

  return `${minutes}:${remainingSeconds
    .toString()
    .padStart(2, '0')}`
}

function getAgency(
  agency:
    | ExperienceAgency
    | ExperienceAgency[]
    | null,
) {
  if (Array.isArray(agency)) {
    return agency[0] || null
  }

  return agency
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'published':
      return 'Publicada'

    case 'suspended':
      return 'Suspensa'

    case 'rejected':
      return 'Removida'

    case 'draft':
      return 'Rascunho'

    case 'expired':
      return 'Expirada'

    default:
      return status
  }
}

function getStatusClasses(status: string) {
  switch (status) {
    case 'published':
      return 'bg-green-50 text-green-700 border-green-100'

    case 'suspended':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100'

    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-100'

    case 'draft':
      return 'bg-gray-100 text-gray-600 border-gray-200'

    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function getVerificationLabel(status: string) {
  switch (status) {
    case 'approved':
      return 'Aprovada'

    case 'under_review':
      return 'Em análise'

    case 'rejected':
      return 'Rejeitada'

    case 'suspended':
      return 'Suspensa'

    case 'blocked':
      return 'Bloqueada'

    case 'pending':
      return 'Pendente'

    default:
      return status
  }
}

function getVerificationClasses(status: string) {
  switch (status) {
    case 'approved':
      return 'bg-green-50 text-green-700 border-green-100'

    case 'under_review':
      return 'bg-blue-50 text-blue-700 border-blue-100'

    case 'rejected':
      return 'bg-red-50 text-red-700 border-red-100'

    case 'suspended':
      return 'bg-yellow-50 text-yellow-700 border-yellow-100'

    case 'blocked':
      return 'bg-gray-900 text-white border-gray-900'

    default:
      return 'bg-gray-100 text-gray-600 border-gray-200'
  }
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string
  value: string
  icon: StatIcon
}) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-gray-500">
            {label}
          </p>

          <p className="mt-3 text-2xl font-black tracking-tight text-gray-950">
            {value}
          </p>
        </div>

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
          <Icon size={20} />
        </div>
      </div>
    </div>
  )
}

function GrowthChart({
  data,
}: {
  data: {
    month: string
    value: number
  }[]
}) {
  const max = Math.max(
    ...data.map((item) => item.value),
    1,
  )

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-950">
          Crescimento mensal
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          Novos usuários registados nos últimos 6 meses.
        </p>
      </div>

      <div className="flex h-64 items-end gap-3 sm:gap-5">
        {data.map((item) => {
          const height =
            item.value === 0
              ? 3
              : Math.max(
                  (item.value / max) * 100,
                  8,
                )

          return (
            <div
              key={item.month}
              className="flex h-full flex-1 flex-col justify-end"
            >
              <div className="mb-2 text-center text-xs font-semibold text-gray-700">
                {formatNumber(item.value)}
              </div>

              <div className="flex h-48 items-end">
                <div
                  className="w-full rounded-t-xl bg-orange-500 transition-all"
                  style={{
                    height: `${height}%`,
                  }}
                />
              </div>

              <div className="mt-3 text-center text-xs font-medium text-gray-400">
                {item.month}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CategoryChart({
  title,
  description,
  data,
  money = false,
}: {
  title: string
  description: string
  data: {
    name: string
    value: number
  }[]
  money?: boolean
}) {
  const max = Math.max(
    ...data.map((item) => item.value),
    1,
  )

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <h3 className="text-base font-bold text-gray-950">
          {title}
        </h3>

        <p className="mt-1 text-sm text-gray-500">
          {description}
        </p>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center text-sm text-gray-400">
          Ainda não existem dados.
        </div>
      ) : (
        <div className="space-y-5">
          {data.map((item) => {
            const width =
              item.value === 0
                ? 0
                : Math.max(
                    (item.value / max) * 100,
                    5,
                  )

            return (
              <div key={item.name}>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <span className="text-sm font-medium text-gray-700">
                    {item.name}
                  </span>

                  <span className="text-sm font-bold text-gray-950">
                    {money
                      ? formatKz(item.value)
                      : formatNumber(item.value)}
                  </span>
                </div>

                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div
                    className="h-full rounded-full bg-orange-500"
                    style={{
                      width: `${width}%`,
                    }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

function CompaniesSection({
  agencies,
  onSelect,
}: {
  agencies: AdminAgency[]
  onSelect: (agency: AdminAgency) => void
}) {
  const approved = agencies.filter(
    (agency) =>
      agency.verification_status ===
      'approved',
  ).length

  const pending = agencies.filter(
    (agency) =>
      agency.verification_status ===
      'pending',
  ).length

  const underReview = agencies.filter(
    (agency) =>
      agency.verification_status ===
      'under_review',
  ).length

  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-950">
              Empresas
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gestão, verificação e segurança das agências da Wizenda.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-100">
            <span className="text-gray-500">
              Total:
            </span>{' '}
            <span className="font-bold text-gray-950">
              {agencies.length}
            </span>
          </div>
        </div>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Total de empresas
          </p>

          <p className="mt-2 text-2xl font-black text-gray-950">
            {agencies.length}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Aprovadas
          </p>

          <p className="mt-2 text-2xl font-black text-green-600">
            {approved}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Pendentes
          </p>

          <p className="mt-2 text-2xl font-black text-gray-950">
            {pending}
          </p>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
          <p className="text-sm text-gray-500">
            Em análise
          </p>

          <p className="mt-2 text-2xl font-black text-blue-600">
            {underReview}
          </p>
        </div>
      </div>

      {agencies.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <Building2 size={28} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-950">
            Ainda não existem empresas
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            As empresas registadas na Wizenda aparecerão aqui.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {agencies.map((agency) => (
            <div
              key={agency.id}
              className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
            >
              <div className="flex flex-col lg:flex-row">
                <div className="flex h-40 w-full shrink-0 items-center justify-center bg-gray-50 lg:h-auto lg:w-52">
                  {agency.logo_url ? (
                    <img
                      src={agency.logo_url}
                      alt={agency.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                      <Building2 size={28} />
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1 p-5 sm:p-6">
                  <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-bold ${getVerificationClasses(
                            agency.verification_status,
                          )}`}
                        >
                          {getVerificationLabel(
                            agency.verification_status,
                          )}
                        </span>

                        {agency.is_verified &&
                          agency.status ===
                            'approved' &&
                          agency.verification_status ===
                            'approved' && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                              <CheckCircle2 size={13} />
                              Agência verificada
                            </span>
                          )}

                        {agency.status ===
                          'suspended' && (
                          <span className="rounded-full border border-yellow-100 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                            Conta suspensa
                          </span>
                        )}

                        {agency.status ===
                          'blocked' && (
                          <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
                            Conta bloqueada
                          </span>
                        )}
                      </div>

                      <h3 className="mt-3 text-xl font-black tracking-tight text-gray-950">
                        {agency.name}
                      </h3>

                      {agency.legal_name && (
                        <p className="mt-1 text-sm text-gray-500">
                          {agency.legal_name}
                        </p>
                      )}

                      <div className="mt-5 grid gap-4 text-sm sm:grid-cols-2 xl:grid-cols-3">
                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            NIF
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {agency.nif ||
                              'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            Responsável
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {agency.responsible_name ||
                              'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            Telefone
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {agency.phone ||
                              'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            E-mail
                          </p>

                          <p className="mt-1 break-all font-semibold text-gray-800">
                            {agency.email ||
                              'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            Localização
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {[
                              agency.city,
                              agency.province,
                            ]
                              .filter(Boolean)
                              .join(', ') ||
                              agency.address ||
                              'Não informado'}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-400">
                            Registada em
                          </p>

                          <p className="mt-1 font-semibold text-gray-800">
                            {formatDate(
                              agency.created_at,
                            )}
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        onSelect(agency)
                      }
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800"
                    >
                      Analisar
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContentSection({
  experiences,
  onModerate,
  loadingId,
}: {
  experiences: AdminExperience[]
  onModerate: (
    experience: AdminExperience,
    action:
      | 'published'
      | 'suspended'
      | 'rejected'
      | 'restored',
  ) => void
  loadingId: string | null
}) {
  return (
    <div className="mx-auto max-w-[1500px]">
      <div className="mb-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-gray-950">
              Conteúdo
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Gere as experiências publicadas pelas agências.
            </p>
          </div>

          <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm ring-1 ring-gray-100">
            <span className="text-gray-500">
              Total:
            </span>{' '}
            <span className="font-bold text-gray-950">
              {experiences.length}
            </span>
          </div>
        </div>
      </div>

      {experiences.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center shadow-sm">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <FileText size={28} />
          </div>

          <h3 className="mt-5 text-lg font-bold text-gray-950">
            Ainda não existem experiências
          </h3>

          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
            Quando as agências criarem experiências,
            elas aparecerão aqui para gestão.
          </p>
        </div>
      ) : (
        <div className="grid gap-5">
          {experiences.map((experience) => {
            const agency = getAgency(
              experience.agencies,
            )

            const isLoading =
              loadingId === experience.id

            return (
              <div
                key={experience.id}
                className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm"
              >
                <div className="flex flex-col lg:flex-row">
                  <div className="relative h-56 w-full shrink-0 bg-gray-100 lg:h-auto lg:w-64">
                    {experience.cover_image ? (
                      <img
                        src={experience.cover_image}
                        alt={experience.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full min-h-56 items-center justify-center text-gray-300">
                        <FileText size={42} />
                      </div>
                    )}

                    <div className="absolute left-4 top-4">
                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-bold ${getStatusClasses(
                          experience.status,
                        )}`}
                      >
                        {getStatusLabel(
                          experience.status,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0 flex-1 p-5 sm:p-6">
                    <div className="flex flex-col gap-5 xl:flex-row xl:justify-between">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-600">
                            {experience.category}
                          </span>

                          {agency?.is_verified &&
                            agency.status ===
                              'approved' &&
                            agency.verification_status ===
                              'approved' && (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                                <CheckCircle2 size={13} />
                                Agência verificada
                              </span>
                            )}
                        </div>

                        <h3 className="mt-3 text-xl font-black tracking-tight text-gray-950">
                          {experience.title}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-gray-500">
                          {experience.description ||
                            'Sem descrição disponível.'}
                        </p>

                        <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 xl:grid-cols-3">
                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Agência
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {agency?.name ||
                                'Agência não identificada'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Localização
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {[
                                experience.city,
                                experience.province,
                              ]
                                .filter(Boolean)
                                .join(', ') ||
                                experience.location ||
                                '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Preço
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {formatKz(
                                Number(
                                  experience.price ||
                                    0,
                                ),
                              )}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Capacidade
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {experience.capacity
                                ? `${experience.capacity} pessoas`
                                : '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Duração
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {experience.duration_hours
                                ? `${experience.duration_hours}h`
                                : '—'}
                            </p>
                          </div>

                          <div>
                            <p className="text-xs font-medium text-gray-400">
                              Criada em
                            </p>

                            <p className="mt-1 font-semibold text-gray-800">
                              {formatDate(
                                experience.created_at,
                              )}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-start gap-2 xl:w-48 xl:flex-col">
                        {experience.status !==
                          'published' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              onModerate(
                                experience,
                                experience.status ===
                                  'suspended' ||
                                experience.status ===
                                  'rejected'
                                  ? 'restored'
                                  : 'published',
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50 xl:w-full"
                          >
                            {experience.status ===
                              'suspended' ||
                            experience.status ===
                              'rejected' ? (
                              <RotateCcw size={16} />
                            ) : (
                              <CheckCircle2 size={16} />
                            )}

                            {experience.status ===
                              'suspended' ||
                            experience.status ===
                              'rejected'
                              ? 'Restaurar'
                              : 'Publicar'}
                          </button>
                        )}

                        {experience.status ===
                          'published' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              onModerate(
                                experience,
                                'suspended',
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-4 py-2.5 text-sm font-bold text-yellow-700 transition hover:bg-yellow-100 disabled:cursor-not-allowed disabled:opacity-50 xl:w-full"
                          >
                            <LockKeyhole size={16} />
                            Suspender
                          </button>
                        )}

                        {experience.status !==
                          'rejected' && (
                          <button
                            type="button"
                            disabled={isLoading}
                            onClick={() =>
                              onModerate(
                                experience,
                                'rejected',
                              )
                            }
                            className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50 xl:w-full"
                          >
                            <Trash2 size={16} />
                            Remover
                          </button>
                        )}

                        {isLoading && (
                          <p className="text-center text-xs text-gray-400 xl:w-full">
                            A processar...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
function MusicSection() {
  const supabase = createClient()

  const [tracks, setTracks] =
    useState<MusicTrack[]>([])

  const [loading, setLoading] =
    useState(true)

  const [uploading, setUploading] =
    useState(false)

  const [deletingId, setDeletingId] =
    useState<string | null>(null)

  const [togglingId, setTogglingId] =
    useState<string | null>(null)

  const [showUploadModal, setShowUploadModal] =
    useState(false)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [selectedCover, setSelectedCover] =
    useState<File | null>(null)

  const [coverPreview, setCoverPreview] =
    useState<string | null>(null)

  const [title, setTitle] =
    useState('')

  const [artist, setArtist] =
    useState('')

  const [genre, setGenre] =
    useState('')

  const [uploadError, setUploadError] =
    useState('')

  const [playingId, setPlayingId] =
    useState<string | null>(null)

  const [audio, setAudio] =
    useState<HTMLAudioElement | null>(null)

  async function loadTracks() {
    setLoading(true)

    const { data, error } =
      await supabase
        .from('music_tracks')
        .select(`
          id,
          title,
          artist,
          genre,
          audio_url,
          cover_url,
          duration_seconds,
          preview_start_seconds,
          preview_duration_seconds,
          is_active,
          created_at
        `)
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

    if (error) {
      console.error(
        'Erro ao carregar músicas:',
        error,
      )

      setTracks([])
    } else {
      setTracks(
        (data ?? []) as MusicTrack[],
      )
    }

    setLoading(false)
  }

  useEffect(() => {
    void loadTracks()

    return () => {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }

      if (coverPreview) {
        URL.revokeObjectURL(
          coverPreview,
        )
      }
    }
  }, [])

  function resetUploadForm() {
    setSelectedFile(null)

    setTitle('')

    setArtist('')

    setGenre('')

    setUploadError('')

    if (coverPreview) {
      URL.revokeObjectURL(
        coverPreview,
      )
    }

    setSelectedCover(null)

    setCoverPreview(null)
  }

  function closeUploadModal() {
    if (uploading) {
      return
    }

    resetUploadForm()

    setShowUploadModal(false)
  }

  function handleCoverChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null

    if (!file) {
      return
    }

    if (
      !file.type.startsWith('image/')
    ) {
      setUploadError(
        'A capa deve ser uma imagem.',
      )

      event.target.value = ''

      return
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      setUploadError(
        'A capa não pode ultrapassar 5 MB.',
      )

      event.target.value = ''

      return
    }

    setUploadError('')

    if (coverPreview) {
      URL.revokeObjectURL(
        coverPreview,
      )
    }

    setSelectedCover(file)

    setCoverPreview(
      URL.createObjectURL(file),
    )
  }

  function handleAudioChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0] ??
      null

    if (!file) {
      setSelectedFile(null)
      return
    }

    if (
      file.type !== 'audio/mpeg' &&
      !file.name
        .toLowerCase()
        .endsWith('.mp3')
    ) {
      setUploadError(
        'Apenas ficheiros MP3 são permitidos.',
      )

      event.target.value = ''

      return
    }

    if (
      file.size >
      30 * 1024 * 1024
    ) {
      setUploadError(
        'O ficheiro MP3 não pode ultrapassar 30 MB.',
      )

      event.target.value = ''

      return
    }

    setUploadError('')

    setSelectedFile(file)
  }

  async function readAudioDuration(
    file: File,
  ) {
    return await new Promise<
      number | null
    >((resolve) => {
      const objectUrl =
        URL.createObjectURL(file)

      const temporaryAudio =
        document.createElement('audio')

      temporaryAudio.preload =
        'metadata'

      temporaryAudio.onloadedmetadata =
        () => {
          const duration =
            Number.isFinite(
              temporaryAudio.duration,
            )
              ? Math.round(
                  temporaryAudio.duration,
                )
              : null

          URL.revokeObjectURL(
            objectUrl,
          )

          resolve(duration)
        }

      temporaryAudio.onerror = () => {
        URL.revokeObjectURL(
          objectUrl,
        )

        resolve(null)
      }

      temporaryAudio.src =
        objectUrl
    })
  }

  async function handleUpload() {
    setUploadError('')

    if (!selectedFile) {
      setUploadError(
        'Seleciona um ficheiro MP3.',
      )

      return
    }

    if (
      selectedFile.type !==
        'audio/mpeg' &&
      !selectedFile.name
        .toLowerCase()
        .endsWith('.mp3')
    ) {
      setUploadError(
        'Apenas ficheiros MP3 são permitidos.',
      )

      return
    }

    if (
      selectedFile.size >
      30 * 1024 * 1024
    ) {
      setUploadError(
        'O ficheiro MP3 não pode ultrapassar 30 MB.',
      )

      return
    }

    if (!selectedCover) {
      setUploadError(
        'Seleciona uma capa para a música.',
      )

      return
    }

    if (!title.trim()) {
      setUploadError(
        'Informe o título da música.',
      )

      return
    }

    setUploading(true)

    let audioPath: string | null =
      null

    let coverPath: string | null =
      null

    try {
      const duration =
        await readAudioDuration(
          selectedFile,
        )

      const safeAudioName =
        selectedFile.name
          .replace(
            /\.mp3$/i,
            '',
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '-',
          )
          .replace(
            /-+/g,
            '-',
          )
          .replace(
            /^-|-$/g,
            '',
          ) ||
        'music'

      const audioFileName =
        `${Date.now()}-${safeAudioName}.mp3`

      audioPath =
        `tracks/${audioFileName}`

      const {
        error: audioUploadError,
      } =
        await supabase.storage
          .from('music')
          .upload(
            audioPath,
            selectedFile,
            {
              cacheControl:
                '3600',
              upsert: false,
              contentType:
                'audio/mpeg',
            },
          )

      if (audioUploadError) {
        throw new Error(
          `Erro no upload do MP3: ${audioUploadError.message}`,
        )
      }

      const {
        data: audioPublicData,
      } =
        supabase.storage
          .from('music')
          .getPublicUrl(
            audioPath,
          )

      const audioUrl =
        audioPublicData.publicUrl

      const coverExtension =
        selectedCover.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'jpg'

      const safeCoverName =
        selectedCover.name
          .replace(
            /\.[^/.]+$/,
            '',
          )
          .replace(
            /[^a-zA-Z0-9-_]/g,
            '-',
          )
          .replace(
            /-+/g,
            '-',
          )
          .replace(
            /^-|-$/g,
            '',
          ) ||
        'cover'

      const coverFileName =
        `${Date.now()}-${safeCoverName}.${coverExtension}`

      coverPath =
        `covers/${coverFileName}`

      const {
        error: coverUploadError,
      } =
        await supabase.storage
          .from('music')
          .upload(
            coverPath,
            selectedCover,
            {
              cacheControl:
                '3600',
              upsert: false,
              contentType:
                selectedCover.type ||
                'image/jpeg',
            },
          )

      if (coverUploadError) {
        throw new Error(
          `Erro no upload da capa: ${coverUploadError.message}`,
        )
      }

      const {
        data: coverPublicData,
      } =
        supabase.storage
          .from('music')
          .getPublicUrl(
            coverPath,
          )

      const coverUrl =
        coverPublicData.publicUrl

      const {
        error: insertError,
      } =
        await supabase
          .from('music_tracks')
          .insert({
            title:
              title.trim(),

            artist:
              artist.trim() ||
              null,

            genre:
              genre.trim() ||
              null,

            audio_url:
              audioUrl,

            cover_url:
              coverUrl,

            duration_seconds:
              duration,

            preview_start_seconds:
              0,

            preview_duration_seconds:
              30,

            is_active:
              true,
          })

      if (insertError) {
        throw new Error(
          `Erro ao guardar a música: ${insertError.message}`,
        )
      }

      resetUploadForm()

      setShowUploadModal(false)

      await loadTracks()
    } catch (error) {
      console.error(
        'Erro ao fazer upload da música:',
        error,
      )

      if (audioPath) {
        await supabase.storage
          .from('music')
          .remove([
            audioPath,
          ])
      }

      if (coverPath) {
        await supabase.storage
          .from('music')
          .remove([
            coverPath,
          ])
      }

      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error
          ? String(
              (
                error as {
                  message?: unknown
                }
              ).message,
            )
          : String(error)

      setUploadError(
        errorMessage ||
          'Não foi possível carregar a música.',
      )
    } finally {
      setUploading(false)
    }
  }

  async function toggleTrack(
    track: MusicTrack,
  ) {
    setTogglingId(track.id)

    const {
      error,
    } =
      await supabase
        .from('music_tracks')
        .update({
          is_active:
            !track.is_active,
        })
        .eq(
          'id',
          track.id,
        )

    if (error) {
      console.error(
        'Erro ao alterar estado da música:',
        error,
      )

      alert(
        error.message ||
          'Não foi possível alterar o estado da música.',
      )
    } else {
      setTracks(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              track.id
                ? {
                    ...item,
                    is_active:
                      !item.is_active,
                  }
                : item,
          ),
      )
    }

    setTogglingId(null)
  }

  function getStoragePath(
    fileUrl: string,
  ) {
    const marker =
      '/storage/v1/object/public/music/'

    const index =
      fileUrl.indexOf(marker)

    if (index === -1) {
      return null
    }

    return decodeURIComponent(
      fileUrl.slice(
        index +
          marker.length,
      ),
    )
  }

  async function deleteTrack(
    track: MusicTrack,
  ) {
    const confirmed =
      window.confirm(
        `Tem certeza que deseja eliminar "${track.title}"?`,
      )

    if (!confirmed) {
      return
    }

    setDeletingId(track.id)

    try {
      const audioStoragePath =
        getStoragePath(
          track.audio_url,
        )

      const coverStoragePath =
        track.cover_url
          ? getStoragePath(
              track.cover_url,
            )
          : null

      const filesToDelete =
        [
          audioStoragePath,
          coverStoragePath,
        ].filter(
          (
            path,
          ): path is string =>
            Boolean(path),
        )

      if (
        filesToDelete.length >
        0
      ) {
        const {
          error: storageError,
        } =
          await supabase.storage
            .from('music')
            .remove(
              filesToDelete,
            )

        if (storageError) {
          console.error(
            'Erro ao eliminar ficheiros da Storage:',
            storageError,
          )
        }
      }

      const {
        error: deleteError,
      } =
        await supabase
          .from('music_tracks')
          .delete()
          .eq(
            'id',
            track.id,
          )

      if (deleteError) {
        throw deleteError
      }

      if (
        playingId ===
        track.id
      ) {
        if (audio) {
          audio.pause()
          audio.currentTime = 0
        }

        setAudio(null)

        setPlayingId(null)
      }

      setTracks(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              track.id,
          ),
      )
    } catch (error) {
      console.error(
        'Erro ao eliminar música:',
        error,
      )

      const errorMessage =
        error &&
        typeof error === 'object' &&
        'message' in error
          ? String(
              (
                error as {
                  message?: unknown
                }
              ).message,
            )
          : String(error)

      alert(
        errorMessage ||
          'Não foi possível eliminar a música.',
      )
    } finally {
      setDeletingId(null)
    }
  }

  function togglePlay(
    track: MusicTrack,
  ) {
    if (
      playingId ===
      track.id
    ) {
      if (audio) {
        audio.pause()
        audio.currentTime = 0
      }

      setAudio(null)

      setPlayingId(null)

      return
    }

    if (audio) {
      audio.pause()
      audio.currentTime = 0
    }

    const newAudio =
      new Audio(
        track.audio_url,
      )

    newAudio.currentTime =
      track.preview_start_seconds ||
      0

    newAudio.onended = () => {
      setPlayingId(null)
      setAudio(null)
    }

    newAudio.onerror = () => {
      setPlayingId(null)
      setAudio(null)

      alert(
        'Não foi possível reproduzir esta música.',
      )
    }

    void newAudio.play()

    setAudio(newAudio)

    setPlayingId(track.id)
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-2xl font-black text-gray-950">
            Música
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Gere as músicas disponíveis para acompanhar as experiências.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            resetUploadForm()
            setShowUploadModal(true)
          }}
          className="inline-flex items-center justify-center rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600"
        >
          + Adicionar música
        </button>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-100 bg-white p-10 text-center">
          <p className="text-sm text-gray-500">
            A carregar músicas...
          </p>
        </div>
      ) : tracks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-10 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
            🎵
          </div>

          <h3 className="mt-4 font-bold text-gray-950">
            Ainda não existem músicas
          </h3>

          <p className="mt-1 text-sm text-gray-500">
            Adiciona a primeira música para disponibilizá-la nas experiências.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {tracks.map(
            (track) => (
              <div
                key={track.id}
                className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
              >
                <div className="h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-gray-100">
                  {track.cover_url ? (
                    <img
                      src={
                        track.cover_url
                      }
                      alt={
                        track.title
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-2xl">
                      🎵
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="truncate font-bold text-gray-950">
                      {track.title}
                    </h3>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-bold ${
                        track.is_active
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {track.is_active
                        ? 'Ativa'
                        : 'Inativa'}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-gray-500">
                    {track.artist ||
                      'Artista não informado'}
                  </p>

                  {track.genre && (
                    <p className="mt-1 text-xs text-gray-400">
                      {track.genre}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      togglePlay(
                        track,
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
                  >
                    {playingId ===
                    track.id
                      ? 'Parar'
                      : 'Ouvir'}
                  </button>

                  <button
                    type="button"
                    disabled={
                      togglingId ===
                      track.id
                    }
                    onClick={() =>
                      void toggleTrack(
                        track,
                      )
                    }
                    className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                  >
                    {togglingId ===
                    track.id
                      ? '...'
                      : track.is_active
                        ? 'Desativar'
                        : 'Ativar'}
                  </button>

                  <button
                    type="button"
                    disabled={
                      deletingId ===
                      track.id
                    }
                    onClick={() =>
                      void deleteTrack(
                        track,
                      )
                    }
                    className="rounded-xl bg-red-50 px-4 py-2 text-sm font-bold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    {deletingId ===
                    track.id
                      ? 'A eliminar...'
                      : 'Eliminar'}
                  </button>
                </div>
              </div>
            ),
          )}
        </div>
      )}

      {showUploadModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <h3 className="text-xl font-black text-gray-950">
                  Adicionar música
                </h3>

                <p className="mt-1 text-xs text-gray-500">
                  Música para utilizar nas experiências.
                </p>
              </div>

              <button
                type="button"
                disabled={uploading}
                onClick={
                  closeUploadModal
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200"
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Ficheiro MP3
                </label>

                <input
                  type="file"
                  accept=".mp3,audio/mpeg"
                  onChange={
                    handleAudioChange
                  }
                  disabled={
                    uploading
                  }
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"
                />

                {selectedFile && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedFile.name}
                  </p>
                )}
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Capa da música
                </label>

                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="h-28 w-28 shrink-0 overflow-hidden rounded-2xl bg-gray-100">
                    {coverPreview ? (
                      <img
                        src={
                          coverPreview
                        }
                        alt="Pré-visualização da capa"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">
                        <span className="text-3xl">
                          🖼️
                        </span>

                        <span className="mt-1 text-[10px]">
                          Sem capa
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/avif"
                      onChange={
                        handleCoverChange
                      }
                      disabled={
                        uploading
                      }
                      className="block w-full rounded-xl border border-gray-200 bg-gray-50 p-3 text-sm"
                    />

                    <p className="mt-2 text-xs text-gray-400">
                      JPG, PNG, WEBP ou AVIF. Máximo 5 MB.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Título *
                </label>

                <input
                  type="text"
                  value={title}
                  onChange={(event) =>
                    setTitle(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Minha Terra"
                  disabled={
                    uploading
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Artista
                </label>

                <input
                  type="text"
                  value={artist}
                  onChange={(event) =>
                    setArtist(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Ruy Mingas"
                  disabled={
                    uploading
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-800">
                  Género
                </label>

                <input
                  type="text"
                  value={genre}
                  onChange={(event) =>
                    setGenre(
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Música Angolana"
                  disabled={
                    uploading
                  }
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-400 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              {uploadError && (
                <div className="rounded-xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
                  {uploadError}
                </div>
              )}

              <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  disabled={
                    uploading
                  }
                  onClick={
                    closeUploadModal
                  }
                  className="rounded-xl border border-gray-200 px-5 py-3 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    uploading
                  }
                  onClick={() =>
                    void handleUpload()
                  }
                  className="rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-wait disabled:opacity-60"
                >
                  {uploading
                    ? 'A carregar...'
                    : 'Carregar música'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
export default function AdminDashboardClient({
  stats,
  growthData,
  reservationCategories,
  revenueCategories,
  recentActivities,
  users,
  agencies = [],
  experiences = [],
}: DashboardProps) {
  const [activeMenu, setActiveMenu] =
    useState<MenuKey>('overview')

  const [loadingId, setLoadingId] =
    useState<string | null>(null)

  const [reasonModal, setReasonModal] =
    useState<{
      experience: AdminExperience
      action: 'suspended' | 'rejected'
    } | null>(null)

  const [agencyActionModal, setAgencyActionModal] =
    useState<{
      agency: AdminAgency
      action:
        | 'rejected'
        | 'suspended'
        | 'blocked'
    } | null>(null)

  const [selectedAgency, setSelectedAgency] =
    useState<AdminAgency | null>(null)

  const [reason, setReason] = useState('')

  const [agencyLoadingId, setAgencyLoadingId] =
    useState<string | null>(null)

  const router = useRouter()
  const supabase = createClient()

  const activeItem = menuSections
    .flatMap((section) => section.items)
    .find(
      (item) => item.key === activeMenu,
    )

  async function executeModeration(
    experience: AdminExperience,
    action:
      | 'published'
      | 'suspended'
      | 'rejected'
      | 'restored',
    moderationReason?: string,
  ) {
    setLoadingId(experience.id)

    const { error } = await supabase.rpc(
      'moderate_experience',
      {
        p_experience_id: experience.id,
        p_action: action,
        p_reason:
          moderationReason?.trim() || null,
      },
    )

    if (error) {
      console.error(
        'Erro ao moderar experiência:',
        error,
      )

      alert(
        error.message ||
          'Não foi possível executar esta ação.',
      )

      setLoadingId(null)
      return
    }

    setReasonModal(null)
    setReason('')
    setLoadingId(null)

    router.refresh()
  }

  function handleModerate(
    experience: AdminExperience,
    action:
      | 'published'
      | 'suspended'
      | 'rejected'
      | 'restored',
  ) {
    if (
      action === 'suspended' ||
      action === 'rejected'
    ) {
      setReason('')

      setReasonModal({
        experience,
        action,
      })

      return
    }

    void executeModeration(
      experience,
      action,
    )
  }

  function openAgencyReasonModal(
    agency: AdminAgency,
    action:
      | 'rejected'
      | 'suspended'
      | 'blocked',
  ) {
    setReason('')

    setAgencyActionModal({
      agency,
      action,
    })
  }

  async function executeAgencyAction(
    agency: AdminAgency,
    action:
      | 'approved'
      | 'rejected'
      | 'suspended'
      | 'blocked'
      | 'restored',
    actionReason?: string,
  ) {
    setAgencyLoadingId(agency.id)

    const { error } = await supabase.rpc(
      'moderate_agency',
      {
        p_agency_id: agency.id,
        p_action: action,
        p_reason:
          actionReason?.trim() || null,
      },
    )

    if (error) {
      console.error(
        'Erro ao gerir agência:',
        error,
      )

      alert(
        error.message ||
          'Não foi possível executar esta ação.',
      )

      setAgencyLoadingId(null)
      return
    }

    setAgencyActionModal(null)
    setSelectedAgency(null)
    setReason('')
    setAgencyLoadingId(null)

    router.refresh()
  }

  function handleAgencyAction(
    agency: AdminAgency,
    action:
      | 'approved'
      | 'rejected'
      | 'suspended'
      | 'blocked'
      | 'restored',
  ) {
    if (
      action === 'rejected' ||
      action === 'suspended' ||
      action === 'blocked'
    ) {
      openAgencyReasonModal(
        agency,
        action,
      )

      return
    }

    void executeAgencyAction(
      agency,
      action,
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7]">
      <div className="flex min-h-screen">

        {/* SIDEBAR */}
        <aside className="hidden w-64 shrink-0 border-r border-gray-200 bg-white lg:flex lg:flex-col">
          <div className="flex h-20 items-center border-b border-gray-100 px-6">
            <button
              type="button"
              onClick={() =>
                setActiveMenu('overview')
              }
              className="flex items-center"
            >
              <span className="text-2xl font-black tracking-tight text-gray-950">
                wizenda
              </span>

              <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
            </button>
          </div>

          <div className="px-6 pb-2 pt-6">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-orange-500">
              <ShieldCheck size={15} />
              Administração
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-3 pb-6">
            {menuSections.map((section) => (
              <div
                key={section.label}
                className="mt-5"
              >
                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  {section.label}
                </p>

                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon
                    const active =
                      activeMenu === item.key

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setActiveMenu(
                            item.key,
                          )
                        }
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                          active
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-950'
                        }`}
                      >
                        <Icon
                          size={18}
                          className={
                            active
                              ? 'text-orange-500'
                              : 'text-gray-400'
                          }
                        />

                        <span className="flex-1">
                          {item.label}
                        </span>

                        {active && (
                          <ChevronRight
                            size={15}
                            className="text-orange-500"
                          />
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>
            ))}
          </nav>

          <div className="border-t border-gray-100 p-4">
            <div className="rounded-xl bg-gray-50 p-3">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500 text-xs font-bold text-white">
                  W
                </div>

                <div>
                  <p className="text-sm font-semibold text-gray-950">
                    Wizenda Admin
                  </p>

                  <p className="text-xs text-gray-500">
                    Administrador
                  </p>
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <section className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-xl">
            <div className="flex h-20 items-center justify-between px-5 sm:px-8 lg:px-10">
              <div>
                <p className="text-xs font-medium text-gray-400">
                  Administração Wizenda
                </p>

                <h1 className="mt-1 text-xl font-black tracking-tight text-gray-950">
                  {activeItem?.label ||
                    'Visão geral'}
                </h1>
              </div>

              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <ShieldCheck size={19} />
              </div>
            </div>

            <div className="overflow-x-auto border-t border-gray-100 px-5 py-3 lg:hidden">
              <div className="flex min-w-max gap-2">
                {menuSections
                  .flatMap(
                    (section) =>
                      section.items,
                  )
                  .map((item) => {
                    const Icon = item.icon
                    const active =
                      activeMenu === item.key

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() =>
                          setActiveMenu(
                            item.key,
                          )
                        }
                        className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold ${
                          active
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        <Icon size={14} />
                        {item.label}
                      </button>
                    )
                  })}
              </div>
            </div>
          </header>

          <div className="px-5 py-7 sm:px-8 lg:px-10">

            {/* VISÃO GERAL */}

            {activeMenu === 'overview' && (
              <div className="mx-auto max-w-[1500px]">
                <div className="mb-7">
                  <h2 className="text-2xl font-black tracking-tight text-gray-950">
                    Visão geral
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Acompanha o desempenho da Wizenda em tempo real.
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard
                    label="Total de usuários"
                    value={formatNumber(
                      stats.totalUsers,
                    )}
                    icon={Users}
                  />

                  <StatCard
                    label="Usuários registados (mês)"
                    value={formatNumber(
                      stats.activeUsersMonth,
                    )}
                    icon={TrendingUp}
                  />

                  <StatCard
                    label="Empresas registadas"
                    value={formatNumber(
                      stats.totalAgencies,
                    )}
                    icon={Building2}
                  />

                  <StatCard
                    label="Reservas do mês"
                    value={formatNumber(
                      stats.bookingsMonth,
                    )}
                    icon={CalendarCheck}
                  />

                  <StatCard
                    label="Receita total"
                    value={formatKz(
                      stats.totalRevenue,
                    )}
                    icon={BarChart3}
                  />

                  <StatCard
                    label="Receita do mês"
                    value={formatKz(
                      stats.monthlyRevenue,
                    )}
                    icon={TrendingUp}
                  />

                  <StatCard
                    label="Pontos gerados"
                    value={formatNumber(
                      stats.pointsGenerated,
                    )}
                    icon={Medal}
                  />

                  <StatCard
                    label="Pontos usados"
                    value={formatNumber(
                      stats.pointsUsed,
                    )}
                    icon={Medal}
                  />
                </div>

                <div className="mt-6">
                  <GrowthChart
                    data={growthData}
                  />
                </div>

                <div className="mt-6 grid gap-6 xl:grid-cols-2">
                  <CategoryChart
                    title="Reservas por categoria"
                    description="Número de reservas realizadas por categoria."
                    data={
                      reservationCategories
                    }
                  />

                  <CategoryChart
                    title="Receita por categoria"
                    description="Receita gerada pelas experiências."
                    data={
                      revenueCategories
                    }
                    money
                  />
                </div>

                <div className="mt-6 rounded-2xl border border-gray-100 bg-white shadow-sm">
                  <div className="border-b border-gray-100 p-6">
                    <h3 className="text-base font-bold text-gray-950">
                      Atividades recentes
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Últimas movimentações da plataforma.
                    </p>
                  </div>

                  <div className="divide-y divide-gray-100">
                    {recentActivities.length ===
                    0 ? (
                      <div className="p-6 text-sm text-gray-400">
                        Ainda não existem atividades recentes.
                      </div>
                    ) : (
                      recentActivities.map(
                        (
                          activity,
                          index,
                        ) => (
                          <div
                            key={`${activity.title}-${index}`}
                            className="flex items-center gap-4 p-5"
                          >
                            <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />

                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-gray-950">
                                {activity.title}
                              </p>

                              <p className="mt-0.5 text-sm text-gray-500">
                                {
                                  activity.description
                                }
                              </p>
                            </div>

                            <span className="shrink-0 text-xs text-gray-400">
                              {
                                activity.time
                              }
                            </span>
                          </div>
                        ),
                      )
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* EMPRESAS */}

            {activeMenu === 'companies' && (
              <CompaniesSection
                agencies={agencies}
                onSelect={
                  setSelectedAgency
                }
              />
            )}

            {/* CONTEÚDO */}

            {activeMenu === 'content' && (
              <ContentSection
                experiences={
                  experiences
                }
                onModerate={
                  handleModerate
                }
                loadingId={
                  loadingId
                }
              />
            )}

            {/* MÚSICAS */}

            {activeMenu === 'music' && (
              <MusicSection />
            )}

            {/* OUTROS */}

            {activeMenu !== 'overview' &&
              activeMenu !== 'companies' &&
              activeMenu !== 'content' &&
              activeMenu !== 'music' && (
                <div className="mx-auto flex min-h-[500px] max-w-[1500px] items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                      {activeItem &&
                        (() => {
                          const Icon =
                            activeItem.icon

                          return (
                            <Icon
                              size={28}
                            />
                          )
                        })()}
                    </div>

                    <h2 className="mt-5 text-2xl font-black text-gray-950">
                      {
                        activeItem?.label
                      }
                    </h2>

                    <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
                      Esta área será ligada às funcionalidades administrativas correspondentes.
                    </p>
                  </div>
                </div>
              )}
          </div>
        </section>
      </div>

      {/* MODAL EMPRESA */}

      {selectedAgency && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-black/40 p-5 backdrop-blur-sm">
          <div className="my-8 w-full max-w-3xl rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-xl bg-orange-50 text-orange-500">
                  {selectedAgency.logo_url ? (
                    <img
                      src={
                        selectedAgency.logo_url
                      }
                      alt={
                        selectedAgency.name
                      }
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Building2
                      size={24}
                    />
                  )}
                </div>

                <div>
                  <h3 className="text-xl font-black text-gray-950">
                    {
                      selectedAgency.name
                    }
                  </h3>

                  <div className="mt-1 flex flex-wrap gap-2">
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-bold ${getVerificationClasses(
                        selectedAgency.verification_status,
                      )}`}
                    >
                      {getVerificationLabel(
                        selectedAgency.verification_status,
                      )}
                    </span>

                    {selectedAgency.is_verified &&
                      selectedAgency.status ===
                        'approved' &&
                      selectedAgency.verification_status ===
                        'approved' && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                          <CheckCircle2
                            size={13}
                          />
                          Verificada
                        </span>
                      )}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  setSelectedAgency(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="max-h-[65vh] overflow-y-auto p-6">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Nome comercial
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.name
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Nome legal
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.legal_name ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    NIF
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.nif ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Responsável
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.responsible_name ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Documento do responsável
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.responsible_document ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Telefone
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {
                      selectedAgency.phone ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    E-mail
                  </p>

                  <p className="mt-1 break-all font-bold text-gray-900">
                    {
                      selectedAgency.email ||
                      'Não informado'
                    }
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Localização
                  </p>

                  <p className="mt-1 font-bold text-gray-900">
                    {[
                      selectedAgency.city,
                      selectedAgency.province,
                    ]
                      .filter(Boolean)
                      .join(', ') ||
                      selectedAgency.address ||
                      'Não informado'}
                  </p>
                </div>

                <div className="rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Estado da conta
                  </p>

                  <p className="mt-1 font-bold capitalize text-gray-900">
                    {selectedAgency.status}
                  </p>
                </div>

                {selectedAgency.rejection_reason && (
                  <div className="rounded-xl bg-red-50 p-4 sm:col-span-2">
                    <p className="text-xs font-medium text-red-500">
                      Motivo da rejeição
                    </p>

                    <p className="mt-1 text-sm font-semibold text-red-700">
                      {
                        selectedAgency.rejection_reason
                      }
                    </p>
                  </div>
                )}

                {selectedAgency.suspension_reason && (
                  <div className="rounded-xl bg-yellow-50 p-4 sm:col-span-2">
                    <p className="text-xs font-medium text-yellow-600">
                      Motivo da suspensão
                    </p>

                    <p className="mt-1 text-sm font-semibold text-yellow-800">
                      {
                        selectedAgency.suspension_reason
                      }
                    </p>
                  </div>
                )}
              </div>

              {selectedAgency.description && (
                <div className="mt-4 rounded-xl bg-gray-50 p-4">
                  <p className="text-xs font-medium text-gray-400">
                    Descrição
                  </p>

                  <p className="mt-2 text-sm leading-6 text-gray-700">
                    {
                      selectedAgency.description
                    }
                  </p>
                </div>
              )}

              <div className="mt-6 rounded-2xl border border-orange-100 bg-orange-50 p-5">
                <div className="flex gap-3">
                  <ShieldCheck
                    size={20}
                    className="mt-0.5 shrink-0 text-orange-500"
                  />

                  <div>
                    <p className="font-bold text-gray-950">
                      Verificação da empresa
                    </p>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      A aprovação permite que a agência opere na plataforma e publique experiências.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap justify-end gap-3 border-t border-gray-100 p-6">
              <button
                type="button"
                disabled={
                  agencyLoadingId !== null
                }
                onClick={() =>
                  setSelectedAgency(null)
                }
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Fechar
              </button>

              {selectedAgency.verification_status ===
                'approved' &&
                selectedAgency.status ===
                  'approved' ? (
                <>
                  <button
                    type="button"
                    disabled={
                      agencyLoadingId !== null
                    }
                    onClick={() =>
                      handleAgencyAction(
                        selectedAgency,
                        'suspended',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-yellow-200 bg-yellow-50 px-5 py-2.5 text-sm font-bold text-yellow-700 transition hover:bg-yellow-100 disabled:opacity-50"
                  >
                    <LockKeyhole size={16} />
                    Suspender
                  </button>

                  <button
                    type="button"
                    disabled={
                      agencyLoadingId !== null
                    }
                    onClick={() =>
                      handleAgencyAction(
                        selectedAgency,
                        'blocked',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-gray-950 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
                  >
                    <LockKeyhole size={16} />
                    Bloquear
                  </button>
                </>
              ) : selectedAgency.verification_status ===
                  'suspended' ||
                selectedAgency.verification_status ===
                  'blocked' ||
                selectedAgency.verification_status ===
                  'rejected' ? (
                <button
                  type="button"
                  disabled={
                    agencyLoadingId !== null
                  }
                  onClick={() =>
                    handleAgencyAction(
                      selectedAgency,
                      'restored',
                    )
                  }
                  className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-green-700 disabled:opacity-50"
                >
                  <RotateCcw size={16} />
                  Restaurar
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={
                      agencyLoadingId !== null
                    }
                    onClick={() =>
                      handleAgencyAction(
                        selectedAgency,
                        'rejected',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-5 py-2.5 text-sm font-bold text-red-700 transition hover:bg-red-100 disabled:opacity-50"
                  >
                    <XCircle size={16} />
                    Rejeitar
                  </button>

                  <button
                    type="button"
                    disabled={
                      agencyLoadingId !== null
                    }
                    onClick={() =>
                      handleAgencyAction(
                        selectedAgency,
                        'approved',
                      )
                    }
                    className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
                  >
                    <CheckCircle2 size={16} />
                    Aprovar agência
                  </button>
                </>
              )}

              {agencyLoadingId ===
                selectedAgency.id && (
                <div className="flex w-full justify-end">
                  <p className="text-xs text-gray-400">
                    A processar...
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOTIVO AGÊNCIA */}

      {agencyActionModal && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <h3 className="text-lg font-black text-gray-950">
                  {agencyActionModal.action ===
                  'rejected'
                    ? 'Rejeitar agência'
                    : agencyActionModal.action ===
                        'suspended'
                      ? 'Suspender agência'
                      : 'Bloquear agência'}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    agencyActionModal
                      .agency.name
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setAgencyActionModal(
                    null,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm font-bold text-gray-800">
                Motivo
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder={
                  agencyActionModal.action ===
                  'rejected'
                    ? 'Explique por que a agência foi rejeitada...'
                    : agencyActionModal.action ===
                        'suspended'
                      ? 'Explique por que a agência foi suspensa...'
                      : 'Explique por que a agência foi bloqueada...'
                }
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />

              <p className="mt-2 text-xs text-gray-400">
                O motivo ficará registado e será enviado à agência.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                type="button"
                onClick={() =>
                  setAgencyActionModal(
                    null,
                  )
                }
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !reason.trim() ||
                  agencyLoadingId !== null
                }
                onClick={() => {
                  if (!reason.trim()) return

                  void executeAgencyAction(
                    agencyActionModal.agency,
                    agencyActionModal.action,
                    reason.trim(),
                  )
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  agencyActionModal.action ===
                  'rejected'
                    ? 'bg-red-600 hover:bg-red-700'
                    : agencyActionModal.action ===
                        'suspended'
                      ? 'bg-yellow-600 hover:bg-yellow-700'
                      : 'bg-gray-950 hover:bg-gray-800'
                }`}
              >
                {agencyLoadingId
                  ? 'A processar...'
                  : agencyActionModal.action ===
                      'rejected'
                    ? 'Rejeitar'
                    : agencyActionModal.action ===
                        'suspended'
                      ? 'Suspender'
                      : 'Bloquear'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL MOTIVO EXPERIÊNCIA */}

      {reasonModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-gray-100 p-6">
              <div>
                <h3 className="text-lg font-black text-gray-950">
                  {reasonModal.action ===
                  'suspended'
                    ? 'Suspender experiência'
                    : 'Remover experiência'}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {
                    reasonModal
                      .experience.title
                  }
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setReasonModal(null)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="p-6">
              <label className="text-sm font-bold text-gray-800">
                Motivo
              </label>

              <textarea
                value={reason}
                onChange={(event) =>
                  setReason(
                    event.target.value,
                  )
                }
                placeholder={
                  reasonModal.action ===
                  'suspended'
                    ? 'Explique por que esta experiência está a ser suspensa...'
                    : 'Explique por que esta experiência está a ser removida...'
                }
                rows={5}
                className="mt-2 w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
              />

              <p className="mt-2 text-xs text-gray-400">
                O motivo será registado no histórico de moderação e enviado à agência.
              </p>
            </div>

            <div className="flex justify-end gap-3 border-t border-gray-100 p-6">
              <button
                type="button"
                onClick={() =>
                  setReasonModal(null)
                }
                className="rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-gray-50"
              >
                Cancelar
              </button>

              <button
                type="button"
                disabled={
                  !reason.trim() ||
                  loadingId !== null
                }
                onClick={() => {
                  if (!reason.trim()) return

                  void executeModeration(
                    reasonModal.experience,
                    reasonModal.action,
                    reason.trim(),
                  )
                }}
                className={`rounded-xl px-5 py-2.5 text-sm font-bold text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${
                  reasonModal.action ===
                  'suspended'
                    ? 'bg-yellow-600 hover:bg-yellow-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
              >
                {loadingId
                  ? 'A processar...'
                  : reasonModal.action ===
                    'suspended'
                    ? 'Suspender'
                    : 'Remover'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  )
}