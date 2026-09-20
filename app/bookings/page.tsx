
import Link from 'next/link'
import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/server'
import {
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  XCircle,
  CreditCard,
  Ticket,
  AlertTriangle,
} from 'lucide-react'

import BookingRealtime from '@/app/components/booking-realtime'
import BookingCountdown from '@/app/components/booking-countdown'

function statusInfo(status: string) {
  const values: Record<
    string,
    {
      label: string
      className: string
      icon: React.ReactNode
    }
  > = {
    pending: {
      label: 'Pendente',
      className: 'bg-yellow-50 text-yellow-700',
      icon: <Clock3 size={18} />,
    },

    confirmed: {
      label: 'Confirmada',
      className: 'bg-green-50 text-green-700',
      icon: <CheckCircle2 size={18} />,
    },

    cancelled: {
      label: 'Cancelada',
      className: 'bg-red-50 text-red-700',
      icon: <XCircle size={18} />,
    },

    expired: {
      label: 'Expirada',
      className: 'bg-gray-100 text-gray-600',
      icon: <AlertTriangle size={18} />,
    },

    completed: {
      label: 'Concluída',
      className: 'bg-blue-50 text-blue-700',
      icon: <CheckCircle2 size={18} />,
    },
  }

  return (
    values[status] || {
      label: status,
      className: 'bg-gray-100 text-gray-600',
      icon: <Clock3 size={18} />,
    }
  )
}

export default async function BookingsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            As tuas reservas
          </h1>

          <p className="mt-2 text-gray-500">
            Entra na tua conta para veres as tuas reservas.
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
      created_at,
      expires_at,
      experiences (
        title,
        slug,
        location,
        city,
        province,
        cover_image
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', {
      ascending: false,
    })

  if (error) {
    console.error(error)
  }

  const bookingIds =
    bookings?.map((booking) => booking.id) ?? []

  const { data: payments } =
    bookingIds.length > 0
      ? await supabase
          .from('payments')
          .select(`
            id,
            booking_id,
            status
          `)
          .in('booking_id', bookingIds)
      : { data: [] }

  const { data: tickets } =
    bookingIds.length > 0
      ? await supabase
          .from('booking_tickets')
          .select(`
            id,
            booking_id,
            code,
            status
          `)
          .in('booking_id', bookingIds)
      : { data: [] }

  const paymentByBooking = new Map(
    (payments ?? []).map((payment) => [
      payment.booking_id,
      payment,
    ]),
  )

  const ticketByBooking = new Map(
    (tickets ?? []).map((ticket) => [
      ticket.booking_id,
      ticket,
    ]),
  )

  return (
    <AppShell>
      <BookingRealtime userId={user.id} />

      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-5xl px-5 pb-6 pt-8 sm:px-6 lg:px-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Wizenda
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">
            As minhas reservas
          </h1>

          <p className="mt-3 text-gray-500">
            Acompanha aqui todas as tuas experiências.
          </p>
        </section>

        <section className="mx-auto max-w-5xl px-5 pb-12 sm:px-6 lg:px-8">
          {bookings && bookings.length > 0 ? (
            <div className="space-y-5">
              {bookings.map((booking: any) => {
                const experience = booking.experiences
                const status = statusInfo(booking.status)

                const payment =
                  paymentByBooking.get(booking.id)

                const ticket =
                  ticketByBooking.get(booking.id)

                const paymentIsPaid =
                  payment?.status === 'paid'

                const ticketIsAvailable =
                  paymentIsPaid && !!ticket

                const paymentWindowActive =
                  !paymentIsPaid &&
                  booking.status !== 'cancelled' &&
                  booking.status !== 'expired' &&
                  !!booking.expires_at

                return (
                  <article
                    key={booking.id}
                    className="overflow-hidden rounded-[2rem] border border-gray-200 bg-white shadow-sm"
                  >
                    <div className="flex flex-col sm:flex-row">
                      {experience?.cover_image && (
                        <img
                          src={experience.cover_image}
                          alt={experience.title}
                          className="h-56 w-full object-cover sm:h-auto sm:w-56"
                        />
                      )}

                      <div className="flex-1 p-5 sm:p-6">
                        <div className="flex flex-col gap-4">

                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <span
                                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${status.className}`}
                              >
                                {status.icon}
                                {status.label}
                              </span>

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

                            <div className="text-right">
                              <p className="text-xs text-gray-400">
                                Total
                              </p>

                              <p className="mt-1 text-xl font-black text-orange-500">
                                {Number(
                                  booking.total_price,
                                ).toLocaleString('pt-AO')}{' '}
                                Kz
                              </p>
                            </div>
                          </div>

                          <div className="grid gap-4 border-t border-gray-100 pt-5 sm:grid-cols-3">

                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
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

                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                                <CheckCircle2 size={18} />
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

                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                                <Clock3 size={18} />
                              </div>

                              <div>
                                <p className="text-xs text-gray-400">
                                  Reserva criada
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

                          {/* PRAZO DE PAGAMENTO */}
                          {paymentWindowActive && (
                            <div className="rounded-2xl bg-orange-50 p-4">
                              <div className="flex items-start gap-3">

                                <Clock3
                                  size={20}
                                  className="mt-0.5 shrink-0 text-orange-600"
                                />

                                <div>
                                  <p className="font-bold text-orange-800">
                                    Prazo para pagamento
                                  </p>

                                  <p className="mt-1 text-sm text-orange-700">
                                    Tens até{' '}
                                    {new Date(
                                      booking.expires_at,
                                    ).toLocaleString(
                                      'pt-AO',
                                      {
                                        dateStyle: 'short',
                                        timeStyle: 'short',
                                      },
                                    )}{' '}
                                    para efetuar o pagamento e
                                    enviar o comprovativo.
                                  </p>

                                  <p className="mt-2 font-black text-orange-800">
                                    ⏳ Pagamento disponível por mais{' '}
                                    <BookingCountdown
                                      expiresAt={
                                        booking.expires_at
                                      }
                                    />
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* RESERVA CONFIRMADA */}
                          {booking.status === 'confirmed' && (
                            <div className="rounded-2xl bg-green-50 p-4">
                              <div className="flex items-start gap-3">

                                <CheckCircle2
                                  size={20}
                                  className="mt-0.5 shrink-0 text-green-600"
                                />

                                <div>
                                  <p className="font-bold text-green-800">
                                    {payment?.status === 'paid'
                                      ? 'Pagamento confirmado!'
                                      : 'Reserva confirmada!'}
                                  </p>

                                  <p className="mt-1 text-sm text-green-700">
                                    {payment?.status === 'paid'
                                      ? 'O teu pagamento foi confirmado e o teu bilhete já está disponível. Apresenta o QR Code no dia da experiência.'
                                      : 'A agência confirmou a tua reserva. O próximo passo é efetuar o pagamento dentro do prazo.'}
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* RESERVA PENDENTE */}
                          {booking.status === 'pending' && (
                            <div className="rounded-2xl bg-yellow-50 p-4">
                              <div className="flex items-start gap-3">

                                <Clock3
                                  size={20}
                                  className="mt-0.5 shrink-0 text-yellow-600"
                                />

                                <div>
                                  <p className="font-bold text-yellow-800">
                                    Aguardando confirmação
                                  </p>

                                  <p className="mt-1 text-sm text-yellow-700">
                                    A agência ainda precisa
                                    confirmar a tua reserva.
                                    Enquanto isso, o prazo de
                                    pagamento continua a contar.
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* RESERVA EXPIRADA */}
                          {booking.status === 'expired' && (
                            <div className="rounded-2xl bg-gray-100 p-4">
                              <div className="flex items-start gap-3">

                                <AlertTriangle
                                  size={20}
                                  className="mt-0.5 shrink-0 text-gray-600"
                                />

                                <div>
                                  <p className="font-bold text-gray-800">
                                    Reserva expirada
                                  </p>

                                  <p className="mt-1 text-sm text-gray-600">
                                    O prazo de 24 horas para
                                    efetuar o pagamento terminou.
                                    Esta reserva já não pode ser
                                    paga.
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* RESERVA CANCELADA */}
                          {booking.status === 'cancelled' && (
                            <div className="rounded-2xl bg-red-50 p-4">
                              <div className="flex items-start gap-3">

                                <XCircle
                                  size={20}
                                  className="mt-0.5 shrink-0 text-red-600"
                                />

                                <div>
                                  <p className="font-bold text-red-800">
                                    Reserva cancelada
                                  </p>

                                  <p className="mt-1 text-sm text-red-700">
                                    Esta reserva foi cancelada
                                    pela agência.
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* BILHETE */}
                          {ticketIsAvailable ? (
                            <Link
                              href={`/bookings/${booking.id}/ticket`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-3 font-black text-white transition hover:bg-gray-800"
                            >
                              <Ticket size={18} />
                              Ver bilhete
                            </Link>
                          ) : booking.status !== 'cancelled' &&
                            booking.status !== 'expired' ? (
                            <Link
                              href={`/bookings/${booking.id}/payment`}
                              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-600"
                            >
                              <CreditCard size={18} />
                              Ver pagamento
                            </Link>
                          ) : null}

                          {/* ESTADO DO BILHETE */}
                          {ticket && (
                            <div
                              className={`rounded-2xl p-4 ${
                                ticket.status === 'valid'
                                  ? 'bg-green-50'
                                  : ticket.status === 'used'
                                    ? 'bg-gray-100'
                                    : 'bg-red-50'
                              }`}
                            >
                              <div className="flex items-start gap-3">

                                <Ticket
                                  size={20}
                                  className="mt-0.5 shrink-0"
                                />

                                <div>
                                  <p className="font-bold">
                                    {ticket.status ===
                                    'valid'
                                      ? 'Bilhete pronto'
                                      : ticket.status ===
                                          'used'
                                        ? 'Bilhete já utilizado'
                                        : ticket.status ===
                                            'cancelled'
                                          ? 'Bilhete cancelado'
                                          : 'Bilhete expirado'}
                                  </p>

                                  <p className="mt-1 text-sm text-gray-600">
                                    Código:{' '}
                                    <span className="font-black">
                                      {ticket.code}
                                    </span>
                                  </p>
                                </div>

                              </div>
                            </div>
                          )}

                          {/* OBSERVAÇÕES */}
                          {booking.notes && (
                            <div className="rounded-2xl bg-gray-50 p-4">
                              <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                                As tuas observações
                              </p>

                              <p className="mt-2 text-sm text-gray-700">
                                {booking.notes}
                              </p>
                            </div>
                          )}

                        </div>
                      </div>
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
                Quando reservares uma experiência, ela
                aparecerá aqui.
              </p>

              <Link
                href="/explore"
                className="mt-6 inline-flex rounded-2xl bg-orange-500 px-6 py-3 font-bold text-white transition hover:bg-orange-600"
              >
                Explorar experiências
              </Link>

            </div>
          )}
        </section>
      </main>
    </AppShell>
  )
}
