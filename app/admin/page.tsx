
'use client'

import Link from 'next/link'
import {
  Megaphone,
  Users,
  Map,
  CalendarCheck,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react'

export default function AdminPage() {
  const sections = [
    {
      title: 'Publicidade',
      description: 'Cria, publica e gere os anúncios da Wizenda.',
      href: '/admin/advertisements',
      icon: Megaphone,
    },
    {
      title: 'Experiências',
      description: 'Gere as experiências publicadas na plataforma.',
      href: '/admin/experiences',
      icon: Map,
    },
    {
      title: 'Reservas',
      description: 'Acompanha as reservas realizadas pelos clientes.',
      href: '/admin/bookings',
      icon: CalendarCheck,
    },
    {
      title: 'Utilizadores',
      description: 'Consulta os utilizadores da plataforma.',
      href: '/admin/users',
      icon: Users,
    },
  ]

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-orange-500">
            <ShieldCheck size={18} />
            Administração Wizenda
          </div>

          <h1 className="text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Painel administrativo
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
            Gere os conteúdos e operações da Wizenda num único lugar.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">

          {sections.map((section) => {
            const Icon = section.icon

            return (
              <Link
                key={section.href}
                href={section.href}
                className="group rounded-[4px] border border-gray-100 bg-white p-6 shadow-sm transition hover:border-orange-200 hover:shadow-md"
              >
                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-orange-50 text-orange-500">
                    <Icon size={22} />
                  </div>

                  <ChevronRight
                    size={20}
                    className="text-gray-300 transition group-hover:translate-x-1 group-hover:text-orange-500"
                  />

                </div>

                <h2 className="mt-5 text-lg font-bold text-gray-950">
                  {section.title}
                </h2>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  {section.description}
                </p>

              </Link>
            )
          })}

        </div>

      </div>
    </main>
  )
}
