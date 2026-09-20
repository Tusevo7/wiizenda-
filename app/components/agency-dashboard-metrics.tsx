
import {
  Banknote,
  CalendarDays,
  Ticket,
  Users,
} from 'lucide-react'

type AgencyDashboardMetricsProps = {
  ticketsSold: number
  monthlyTickets: number
  revenue: number
  customers: number
}

function formatKz(value: number) {
  return new Intl.NumberFormat('pt-AO', {
    maximumFractionDigits: 0,
  }).format(value)
}

export default function AgencyDashboardMetrics({
  ticketsSold,
  monthlyTickets,
  revenue,
  customers,
}: AgencyDashboardMetricsProps) {
  const metrics = [
    {
      label: 'Bilhetes vendidos',
      value: ticketsSold.toString(),
      icon: Ticket,
      description: 'Total de pagamentos aprovados',
    },
    {
      label: 'Vendas este mês',
      value: monthlyTickets.toString(),
      icon: CalendarDays,
      description: 'Bilhetes vendidos este mês',
    },
    {
      label: 'Receita',
      value: `${formatKz(revenue)} Kz`,
      icon: Banknote,
      description: 'Total recebido',
    },
    {
      label: 'Clientes',
      value: customers.toString(),
      icon: Users,
      description: 'Clientes com pagamentos aprovados',
    },
  ]

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon

        return (
          <div
            key={metric.label}
            className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-500">
                  {metric.label}
                </p>

                <p className="mt-2 text-2xl font-black tracking-tight text-gray-950">
                  {metric.value}
                </p>
              </div>

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-orange-50">
                <Icon
                  size={20}
                  className="text-orange-500"
                />
              </div>
            </div>

            <p className="mt-3 text-xs font-medium text-gray-400">
              {metric.description}
            </p>
          </div>
        )
      })}
    </section>
  )
}
