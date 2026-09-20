
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  MapPin,
  Ticket,
  Users,
} from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

import { createClient } from '@/lib/supabase/client'

type Booking = {
  id: string
  booking_date: string
  guests: number
  total_price: number
  status: string
  experiences:
    | {
        title: string
        location: string | null
        city: string | null
        province: string | null
        cover_image: string | null
      }
    | null
}

type TicketData = {
  id: string
  booking_id: string
  code: string
  token: string
  status: 'valid' | 'used' | 'cancelled' | 'expired'
  used_at: string | null
  created_at: string
}

export default function TicketPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [booking, setBooking] = useState<Booking | null>(null)
  const [ticket, setTicket] = useState<TicketData | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    async function loadTicket() {
      const { id } = await params

      const supabase = createClient()

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: bookingData, error: bookingError } =
        await supabase
          .from('bookings')
          .select(`
            id,
            booking_date,
            guests,
            total_price,
            status,
            experiences (
              title,
              location,
              city,
              province,
              cover_image
            )
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

      if (bookingError || !bookingData) {
        setErrorMessage('Reserva não encontrada.')
        setLoading(false)
        return
      }

      const experience = Array.isArray(
        bookingData.experiences,
      )
        ? bookingData.experiences[0] ?? null
        : bookingData.experiences

      const normalizedBooking: Booking = {
        id: bookingData.id,
        booking_date: bookingData.booking_date,
        guests: bookingData.guests,
        total_price: bookingData.total_price,
        status: bookingData.status,
        experiences: experience,
      }

      setBooking(normalizedBooking)

      const { data: ticketData, error: ticketError } =
        await supabase
          .from('booking_tickets')
          .select(`
            id,
            booking_id,
            code,
            token,
            status,
            used_at,
            created_at
          `)
          .eq('booking_id', id)
          .maybeSingle()

      if (ticketError || !ticketData) {
        setErrorMessage(
          'O bilhete ainda não está disponível. Confirma primeiro o pagamento.',
        )
        setLoading(false)
        return
      }

      setTicket(ticketData as TicketData)
      setLoading(false)
    }

    loadTicket()
  }, [params])

  function formatDate(date: string) {
    return new Intl.DateTimeFormat('pt-PT', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(new Date(`${date}T12:00:00`))
  }

  function formatLocation() {
    if (!booking?.experiences) return 'Local a confirmar'

    return (
      booking.experiences.location ||
      [booking.experiences.city, booking.experiences.province]
        .filter(Boolean)
        .join(', ') ||
      'Local a confirmar'
    )
  }

  function getStatusLabel() {
    if (!ticket) return ''

    if (ticket.status === 'used') {
      return 'Bilhete já utilizado'
    }

    if (ticket.status === 'cancelled') {
      return 'Bilhete cancelado'
    }

    if (ticket.status === 'expired') {
      return 'Bilhete expirado'
    }

    return 'Bilhete válido'
  }

  function getStatusClasses() {
    if (!ticket) return ''

    if (ticket.status === 'valid') {
      return 'bg-green-50 text-green-700 border-green-200'
    }

    if (ticket.status === 'used') {
      return 'bg-gray-100 text-gray-700 border-gray-200'
    }

    return 'bg-red-50 text-red-700 border-red-200'
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#F7F7F7]">
        <div className="mx-auto max-w-2xl px-5 py-8">
          <div className="h-7 w-32 animate-pulse rounded-lg bg-gray-200" />

          <div className="mt-6 overflow-hidden rounded-[28px] bg-white shadow-sm">
            <div className="h-48 animate-pulse bg-gray-200" />

            <div className="space-y-4 p-6">
              <div className="h-7 w-3/4 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-5 w-1/2 animate-pulse rounded-lg bg-gray-200" />
              <div className="h-64 animate-pulse rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  if (errorMessage || !booking || !ticket) {
    return (
      <main className="min-h-screen bg-[#F7F7F7]">
        <div className="mx-auto max-w-2xl px-5 py-8">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-700"
          >
            <ArrowLeft size={18} />
            Minhas reservas
          </Link>

          <div className="mt-8 rounded-[28px] border border-gray-200 bg-white p-8 text-center shadow-sm">
            <Ticket
              size={42}
              className="mx-auto text-orange-500"
            />

            <h1 className="mt-4 text-xl font-black text-gray-950">
              Bilhete indisponível
            </h1>

            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-gray-500">
              {errorMessage}
            </p>

            <Link
              href={`/bookings/${booking?.id ?? ''}/payment`}
              className="mt-6 inline-flex rounded-2xl bg-orange-500 px-5 py-3 font-black text-white transition hover:bg-orange-600"
            >
              Ver pagamento
            </Link>
          </div>
        </div>
      </main>
    )
  }

  const qrValue = ticket.token

  return (
    <main className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto max-w-2xl px-5 py-8 sm:px-6">
        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-700 transition hover:text-gray-950"
        >
          <ArrowLeft size={18} />
          Minhas reservas
        </Link>

        <div className="mt-6 overflow-hidden rounded-[30px] border border-gray-100 bg-white shadow-sm">
          {booking.experiences?.cover_image ? (
            <div className="relative h-48 overflow-hidden">
              <img
                src={booking.experiences.cover_image}
                alt={booking.experiences.title}
                className="h-full w-full object-cover"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

              <div className="absolute bottom-5 left-5 right-5">
                <p className="text-xs font-bold uppercase tracking-wider text-white/80">
                  Bilhete Wizenda
                </p>

                <h1 className="mt-1 text-2xl font-black text-white">
                  {booking.experiences.title}
                </h1>
              </div>
            </div>
          ) : (
            <div className="bg-gray-950 px-6 py-8">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-400">
                Bilhete Wizenda
              </p>

              <h1 className="mt-1 text-2xl font-black text-white">
                {booking.experiences?.title}
              </h1>
            </div>
          )}

          <div className="p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                  Código do bilhete
                </p>

                <p className="mt-1 text-xl font-black tracking-wide text-gray-950">
                  {ticket.code}
                </p>
              </div>

              <div
                className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-black ${getStatusClasses()}`}
              >
                <CheckCircle2 size={15} />
                {getStatusLabel()}
              </div>
            </div>

            <div className="my-7 border-t border-dashed border-gray-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex items-start gap-3">
                <CalendarDays
                  size={19}
                  className="mt-0.5 text-orange-500"
                />

                <div>
                  <p className="text-xs font-bold text-gray-400">
                    Data
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatDate(booking.booking_date)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Users
                  size={19}
                  className="mt-0.5 text-orange-500"
                />

                <div>
                  <p className="text-xs font-bold text-gray-400">
                    Participantes
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {booking.guests}{' '}
                    {booking.guests === 1
                      ? 'pessoa'
                      : 'pessoas'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin
                  size={19}
                  className="mt-0.5 text-orange-500"
                />

                <div>
                  <p className="text-xs font-bold text-gray-400">
                    Local
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {formatLocation()}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Clock3
                  size={19}
                  className="mt-0.5 text-orange-500"
                />

                <div>
                  <p className="text-xs font-bold text-gray-400">
                    Estado
                  </p>

                  <p className="mt-1 text-sm font-bold text-gray-900">
                    {ticket.status === 'valid'
                      ? 'Pronto para utilização'
                      : getStatusLabel()}
                  </p>
                </div>
              </div>
            </div>

            <div className="my-7 border-t border-dashed border-gray-200" />

            <div className="flex flex-col items-center">
              <div className="rounded-[28px] border border-gray-100 bg-white p-5 shadow-sm">
                <QRCodeSVG
                  value={qrValue}
                  size={240}
                  level="H"
                  includeMargin
                />
              </div>

              <p className="mt-5 text-center text-sm font-bold text-gray-900">
                Apresenta este QR Code no dia da atividade
              </p>

              <p className="mt-1 max-w-sm text-center text-xs leading-5 text-gray-500">
                A agência irá ler o QR Code para validar o
                teu bilhete. Cada bilhete só pode ser utilizado
                uma vez.
              </p>
            </div>

            <div className="mt-7 rounded-2xl bg-orange-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wider text-orange-600">
                Importante
              </p>

              <p className="mt-1 text-sm leading-6 text-orange-900">
                Guarda este bilhete e apresenta o QR Code à
                agência no dia da experiência.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
