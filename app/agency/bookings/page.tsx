
import Link from 'next/link'
import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarDays,
  Check,
  Clock3,
  Download,
  ExternalLink,
  MapPin,
  Phone,
  User,
  X,
} from 'lucide-react'

function statusInfo(status: string) {
  const values: Record<
    string,
    {
      label: string
      className: string
    }
  > = {
    pending: {
      label: 'Pendente',
      className: 'bg-yellow-50 text-yellow-700',
    },
    confirmed: {
      label: 'Confirmada',
      className: 'bg-green-50 text-green-700',
    },
    cancelled: {
      label: 'Cancelada',
      className: 'bg-red-50 text-red-700',
    },
    completed: {
      label: 'Concluída',
      className: 'bg-blue-50 text-blue-700',
    },
  }

  return (
    values[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-600',
    }
  )
}

function paymentInfo(status: string) {
  const values: Record<
    string,
    {
      label: string
      className: string
    }
  > = {
    pending: {
      label: 'Pagamento pendente',
      className: 'bg-yellow-50 text-yellow-700',
    },
    submitted: {
      label: 'Comprovativo recebido',
      className: 'bg-orange-50 text-orange-700',
    },
    paid: {
      label: 'Pagamento confirmado',
      className: 'bg-green-50 text-green-700',
    },
    rejected: {
      label: 'Pagamento rejeitado',
      className: 'bg-red-50 text-red-700',
    },
  }

  return (
    values[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-600',
    }
  )
}

type Payment = {
  id: string
  booking_id: string
  amount: number
  currency: string
  status: string
  reference: string
  proof_path: string | null
}

export default async function AgencyBookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Acesso reservado
          </h1>

          <p className="mt-2 text-gray-500">
            Entra na tua conta para continuares.
          </p>
        </main>
      </AppShell>
    )
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('id, name')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!agency) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Agência não encontrada
          </h1>

          <p className="mt-2 text-gray-500">
            A tua conta ainda não está associada a uma agência.
          </p>
        </main>
      </AppShell>
    )
  }

  const { data: bookings, error } = await supabase
    .from('bookings')
    .select(`
      id,
      booking_date,
      guests,
      unit_price,
      total_price,
      status,
      notes,
      customer_name,
      customer_phone,
      created_at,
      experiences (
        id,
        title,
        slug,
        location,
        city,
        province
      )
    `)
    .eq('agency_id', agency.id)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error('[AgencyBookings] Bookings:', error)
  }

  const bookingIds =
    bookings?.map((booking) => booking.id) || []

  const {
    data: payments,
    error: paymentsError,
  } =
    bookingIds.length > 0
      ? await supabase
          .from('payments')
          .select(`
            id,
            booking_id,
            amount,
            currency,
            status,
            reference,
            proof_path
          `)
          .in('booking_id', bookingIds)
      : {
          data: [] as Payment[],
          error: null,
        }

  if (paymentsError) {
    console.error(
      '[AgencyBookings] Payments:',
      paymentsError,
    )
  }

  const paymentMap = new Map<string, Payment>()

  ;(payments || []).forEach((payment) => {
    paymentMap.set(payment.booking_id, payment)
  })

  /*
   * Os comprovativos estão num bucket privado.
   * Criamos URLs temporárias para a agência poder
   * visualizar e baixar os ficheiros.
   */
  const proofUrlMap = new Map<string, string>()

  for (const payment of payments || []) {
    if (!payment.proof_path) {
      continue
    }

    const {
      data: signedUrlData,
      error: signedUrlError,
    } = await supabase.storage
      .from('payment-proofs')
      .createSignedUrl(
        payment.proof_path,
        60 * 60,
      )

    if (signedUrlError) {
      console.error(
        '[AgencyBookings] Proof signed URL:',
        signedUrlError,
      )

      continue
    }

    if (signedUrlData?.signedUrl) {
      proofUrlMap.set(
        payment.id,
        signedUrlData.signedUrl,
      )
    }
  }

  const pending =
    bookings?.filter(
      (booking) => booking.status === 'pending',
    ).length || 0

  const confirmed =
    bookings?.filter(
      (booking) => booking.status === 'confirmed',
    ).length || 0

  return (
    <AppShell>
      <main className="min-h-screen bg-gray-50">

        {/* CABEÇALHO */}
        <section className="mx-auto max-w-6xl px-5 pb-6 pt-8 sm:px-6 lg:px-8">

          <Link
            href="/agency"
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Voltar ao painel
          </Link>

          <p className="mt-6 text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Agência
          </p>

          <div className="mt-2">
            <h1 className="text-3xl font-black tracking-tight sm:text-5xl">
              Reservas
            </h1>

            <p className="mt-2 text-gray-500">
              Gere as reservas recebidas pela {agency.name}.
            </p>
          </div>

        </section>

        {/* ESTATÍSTICAS */}
        <section className="mx-auto max-w-6xl px-5 py-4 sm:px-6 lg:px-8">

          <div className="grid gap-4 sm:grid-cols-3">

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Total
              </p>

              <p className="mt-2 text-3xl font-black">
                {bookings?.length || 0}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Pendentes
              </p>

              <p className="mt-2 text-3xl font-black text-yellow-600">
                {pending}
              </p>
            </div>

            <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
              <p className="text-sm text-gray-500">
                Confirmadas
              </p>

              <p className="mt-2 text-3xl font-black text-green-600">
                {confirmed}
              </p>
            </div>

          </div>

        </section>

        {/* RESERVAS */}
        <section className="mx-auto max-w-6xl px-5 py-6 sm:px-6 lg:px-8">

          {bookings && bookings.length > 0 ? (

            <div className="space-y-5">

              {bookings.map((booking: any) => {

                const experience =
                  booking.experiences

                const status =
                  statusInfo(booking.status)

                const payment =
                  paymentMap.get(booking.id)

                const paymentStatus =
                  payment
                    ? paymentInfo(payment.status)
                    : null

                const proofUrl =
                  payment
                    ? proofUrlMap.get(payment.id)
                    : null

                return (
                  <article
                    key={booking.id}
                    className="rounded-[2rem] border border-gray-200 bg-white p-5 shadow-sm sm:p-6"
                  >

                    <div className="flex flex-col gap-5">

                      {/* CABEÇALHO DA RESERVA */}
                      <div className="flex flex-col justify-between gap-4 sm:flex-row">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <span
                              className={`rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
                            >
                              {status.label}
                            </span>

                            <span className="text-xs text-gray-400">
                              #{booking.id.slice(0, 8)}
                            </span>

                          </div>

                          <h2 className="mt-3 text-xl font-black">
                            {experience?.title ||
                              'Experiência'}
                          </h2>

                          {experience && (
                            <p className="mt-1 flex items-center gap-1 text-sm text-gray-500">

                              <MapPin size={14} />

                              {experience.location ||
                                experience.city ||
                                experience.province}

                            </p>
                          )}

                        </div>

                        <div className="sm:text-right">

                          <p className="text-xs text-gray-400">
                            Valor total
                          </p>

                          <p className="mt-1 text-2xl font-black text-orange-500">
                            {Number(
                              booking.total_price,
                            ).toLocaleString(
                              'pt-AO',
                            )}{' '}
                            Kz
                          </p>

                        </div>

                      </div>

                      {/* INFORMAÇÕES */}
                      <div className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">

                        {/* CLIENTE */}
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                            <User size={18} />
                          </div>

                          <div className="min-w-0">

                            <p className="text-xs text-gray-400">
                              Cliente
                            </p>

                            <p className="truncate text-sm font-bold">
                              {booking.customer_name ||
                                'Nome não informado'}
                            </p>

                          </div>

                        </div>

                        {/* DATA */}
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                            <CalendarDays size={18} />
                          </div>

                          <div>

                            <p className="text-xs text-gray-400">
                              Data
                            </p>

                            <p className="text-sm font-bold">
                              {new Date(
                                `${booking.booking_date}T00:00:00`,
                              ).toLocaleDateString(
                                'pt-AO',
                              )}
                            </p>

                          </div>

                        </div>

                        {/* PESSOAS */}
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                            <User size={18} />
                          </div>

                          <div>

                            <p className="text-xs text-gray-400">
                              Pessoas
                            </p>

                            <p className="text-sm font-bold">
                              {booking.guests}{' '}
                              {booking.guests === 1
                                ? 'pessoa'
                                : 'pessoas'}
                            </p>

                          </div>

                        </div>

                        {/* RECEBIDA */}
                        <div className="flex items-center gap-3">

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gray-50">
                            <Clock3 size={18} />
                          </div>

                          <div>

                            <p className="text-xs text-gray-400">
                              Recebida
                            </p>

                            <p className="text-sm font-bold">
                              {new Date(
                                booking.created_at,
                              ).toLocaleDateString(
                                'pt-AO',
                              )}
                            </p>

                          </div>

                        </div>

                      </div>

                      {/* PAGAMENTO */}
                      {payment && paymentStatus && (

                        <div className="rounded-3xl border border-gray-100 bg-gray-50 p-5">

                          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                            <div>

                              <div className="flex flex-wrap items-center gap-2">

                                <p className="font-black">
                                  Pagamento
                                </p>

                                <span
                                  className={`rounded-full px-3 py-1 text-xs font-bold ${paymentStatus.className}`}
                                >
                                  {paymentStatus.label}
                                </span>

                              </div>

                              <div className="mt-3 space-y-1 text-sm text-gray-600">

                                <p>
                                  <span className="font-semibold">
                                    Referência:
                                  </span>{' '}
                                  {payment.reference}
                                </p>

                                <p>
                                  <span className="font-semibold">
                                    Valor:
                                  </span>{' '}
                                  {Number(
                                    payment.amount,
                                  ).toLocaleString(
                                    'pt-AO',
                                  )}{' '}
                                  {payment.currency}
                                </p>

                              </div>

                            </div>

                            {/* COMPROVATIVO */}
                            {payment.proof_path && (

                              <div className="flex flex-wrap gap-2">

                                {proofUrl ? (
                                  <>

                                    {/* VER */}
                                    <a
                                      href={proofUrl}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="inline-flex items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
                                    >
                                      <ExternalLink
                                        size={17}
                                      />

                                      Ver comprovativo
                                    </a>

                                    {/* BAIXAR */}
                                    <a
                                      href={proofUrl}
                                      download={`comprovativo-${booking.id.slice(0, 8)}`}
                                      className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-100"
                                    >
                                      <Download
                                        size={17}
                                      />

                                      Baixar
                                    </a>

                                  </>
                                ) : (

                                  <span className="inline-flex items-center justify-center rounded-2xl bg-gray-200 px-5 py-3 text-sm font-bold text-gray-500">
                                    Comprovativo indisponível
                                  </span>

                                )}

                              </div>

                            )}

                          </div>

                          {/* AÇÕES DO PAGAMENTO */}
                          {payment.status === 'submitted' && (

                            <div className="mt-5 flex flex-col gap-3 border-t border-gray-200 pt-5 sm:flex-row sm:justify-end">

                              {/* REJEITAR */}
                              <form
                                action={`/api/agency/payments/${payment.id}/reject`}
                                method="POST"
                              >

                                <button
                                  type="submit"
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 sm:w-auto"
                                >
                                  <X size={17} />
                                  Rejeitar pagamento
                                </button>

                              </form>

                              {/* CONFIRMAR */}
                              <form
                                action={`/api/agency/payments/${payment.id}/confirm`}
                                method="POST"
                              >

                                <button
                                  type="submit"
                                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 sm:w-auto"
                                >
                                  <Check size={17} />
                                  Confirmar pagamento
                                </button>

                              </form>

                            </div>

                          )}

                          {/* PAGAMENTO CONFIRMADO */}
                          {payment.status === 'paid' &&
                            booking.status === 'confirmed' && (

                              <div className="mt-4 rounded-2xl bg-green-50 p-4">

                                <p className="text-sm font-black text-green-700">
                                  Reserva e pagamento confirmados
                                </p>

                                <p className="mt-1 text-sm text-green-700/80">
                                  O próximo passo será a emissão
                                  do bilhete com QR Code para o
                                  cliente.
                                </p>

                              </div>

                          )}

                        </div>

                      )}

                      {/* TELEFONE */}
                      {booking.customer_phone && (

                        <div className="flex items-center justify-between gap-4 rounded-2xl bg-orange-50 p-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white">

                              <Phone
                                size={18}
                                className="text-orange-500"
                              />

                            </div>

                            <div>

                              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                                Contacto do cliente
                              </p>

                              <p className="mt-1 font-bold text-gray-900">
                                {booking.customer_phone}
                              </p>

                            </div>

                          </div>

                          <a
                            href={`tel:${booking.customer_phone}`}
                            className="rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-orange-600"
                          >
                            Ligar
                          </a>

                        </div>

                      )}

                      {/* OBSERVAÇÕES */}
                      {booking.notes && (

                        <div className="rounded-2xl bg-gray-50 p-4">

                          <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                            Observações do cliente
                          </p>

                          <p className="mt-2 text-sm text-gray-700">
                            {booking.notes}
                          </p>

                        </div>

                      )}

                      {/* AÇÕES DA RESERVA */}
                      {booking.status === 'pending' && (

                        <div className="flex flex-col gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">

                          {/* CANCELAR */}
                          <form
                            action={`/api/agency/bookings/${booking.id}/cancel`}
                            method="POST"
                          >

                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-200 px-5 py-3 text-sm font-bold text-red-600 transition hover:bg-red-50 sm:w-auto"
                            >
                              <X size={17} />
                              Cancelar
                            </button>

                          </form>

                          {/* CONFIRMAR RESERVA */}
                          <form
                            action={`/api/agency/bookings/${booking.id}/confirm`}
                            method="POST"
                          >

                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 sm:w-auto"
                            >
                              <Check size={17} />
                              Confirmar reserva
                            </button>

                          </form>

                        </div>

                      )}

                    </div>
                  </article>
                )
              })}

            </div>

          ) : (

            <div className="rounded-[2rem] bg-white px-6 py-16 text-center shadow-sm">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-50">
                <CalendarDays size={26} />
              </div>

              <h2 className="mt-5 text-xl font-black">
                Ainda não tens reservas
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                Quando um cliente reservar uma das tuas
                experiências, ela aparecerá aqui.
              </p>

            </div>

          )}

        </section>

      </main>
    </AppShell>
  )
}
