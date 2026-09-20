
'use client'

import {
  useCallback,
  useEffect,
  useState,
} from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  CalendarDays,
  Minus,
  Plus,
  Users,
} from 'lucide-react'

import AppShell from '@/app/components/app-shell'
import { createClient } from '@/lib/supabase/client'

type Experience = {
  id: string
  title: string
  slug: string
  description: string | null
  category: string
  province: string
  city: string | null
  location: string | null
  price: number
  duration_hours: number | null
  capacity: number | null
  cover_image: string | null
  agency_id: string | null
}

export default function BookingPage() {
  const params = useParams()
  const router = useRouter()

  const slug = params.slug as string

  const [experience, setExperience] =
    useState<Experience | null>(null)

  const [date, setDate] = useState('')
  const [guests, setGuests] = useState(1)
  const [notes, setNotes] = useState('')

  const [availablePlaces, setAvailablePlaces] =
    useState<number | null>(null)

  const [loading, setLoading] = useState(true)
  const [loadingAvailability, setLoadingAvailability] =
    useState(false)

  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')

  /*
   * Carrega a experiência
   */
  useEffect(() => {
    async function loadExperience() {
      const supabase = createClient()

      const { data, error } = await supabase
        .from('experiences')
        .select(`
          id,
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
          agency_id
        `)
        .eq('slug', slug)
        .eq('status', 'published')
        .single()

      if (error || !data) {
        setError('Experiência não encontrada.')
      } else {
        setExperience(data)
      }

      setLoading(false)
    }

    loadExperience()
  }, [slug])

  /*
   * Consulta lugares disponíveis
   */
  const loadAvailability = useCallback(
    async (selectedDate: string) => {
      if (!experience || !selectedDate) {
        setAvailablePlaces(null)
        return
      }

      setLoadingAvailability(true)

      const supabase = createClient()

      const { data, error } = await supabase.rpc(
        'get_experience_availability',
        {
          p_experience_id: experience.id,
          p_booking_date: selectedDate,
        },
      )

      if (error) {
        console.error(error)

        setAvailablePlaces(null)

        setError(
          'Não foi possível verificar a disponibilidade.',
        )

        setLoadingAvailability(false)
        return
      }

      const available =
        data === null ? null : Number(data)

      setAvailablePlaces(available)

      /*
       * Se a disponibilidade diminuir enquanto
       * o utilizador estiver na página,
       * ajustamos automaticamente o número
       * de pessoas.
       */
      setGuests((current) => {
        if (available === null) {
          return current
        }

        if (available <= 0) {
          return 1
        }

        return Math.min(current, available)
      })

      setLoadingAvailability(false)
    },
    [experience],
  )

  /*
   * Atualiza a disponibilidade quando
   * o utilizador escolhe uma data.
   */
  function handleDateChange(
    selectedDate: string,
  ) {
    setDate(selectedDate)
    setGuests(1)
    setError('')

    if (!selectedDate) {
      setAvailablePlaces(null)
      return
    }

    loadAvailability(selectedDate)
  }

  /*
   * Atualiza automaticamente a disponibilidade
   * a cada 10 segundos.
   */
  useEffect(() => {
    if (!experience || !date) {
      return
    }

    const interval = window.setInterval(() => {
      loadAvailability(date)
    }, 10000)

    return () => {
      window.clearInterval(interval)
    }
  }, [
    experience,
    date,
    loadAvailability,
  ])

  /*
   * Cria a reserva
   */
  async function createBooking() {
    setError('')

    if (!date) {
      setError(
        'Seleciona uma data para a experiência.',
      )
      return
    }

    if (!experience) {
      return
    }

    if (guests <= 0) {
      setError(
        'Seleciona pelo menos uma pessoa.',
      )
      return
    }

    const supabase = createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    setBooking(true)

    /*
     * Verifica novamente a disponibilidade
     * imediatamente antes de criar a reserva.
     *
     * Esta verificação serve para dar uma
     * resposta rápida ao utilizador.
     *
     * A proteção definitiva contra overbooking
     * acontece dentro da função create_booking.
     */
    const {
      data: capacityOk,
      error: capacityError,
    } = await supabase.rpc(
      'check_booking_capacity',
      {
        p_experience_id: experience.id,
        p_booking_date: date,
        p_guests: guests,
      },
    )

    if (capacityError) {
      console.error(capacityError)

      setError(
        'Não foi possível verificar a disponibilidade. Tenta novamente.',
      )

      setBooking(false)
      return
    }

    /*
     * Se já não houver lugares suficientes,
     * atualiza a disponibilidade.
     */
    if (!capacityOk) {
      await loadAvailability(date)

      setError(
        'Já não existem lugares suficientes para esta data. Escolhe menos pessoas ou outra data.',
      )

      setBooking(false)
      return
    }

    /*
     * Cria a reserva através da função PostgreSQL.
     *
     * A função create_booking:
     * - valida o utilizador
     * - valida a experiência
     * - calcula o preço no servidor
     * - verifica a capacidade
     * - utiliza lock contra overbooking
     * - cria a reserva como pending
     */
    const {
      data: bookingId,
      error: bookingError,
    } = await supabase.rpc(
      'create_booking',
      {
        p_experience_id: experience.id,
        p_agency_id: experience.agency_id,
        p_booking_date: date,
        p_guests: guests,
        p_notes: notes || null,
      },
    )

    if (bookingError) {
      console.error(
        'Erro ao criar reserva:',
        bookingError,
      )

      /*
       * Se outra pessoa ocupou lugares
       * entretanto, atualizamos a disponibilidade.
       */
      await loadAvailability(date)

      const message =
        bookingError.message?.toLowerCase() || ''

      if (
        message.includes(
          'não existem lugares suficientes',
        ) ||
        message.includes(
          'lugares suficientes',
        )
      ) {
        setError(
          'Já não existem lugares suficientes para esta data. Escolhe menos pessoas ou outra data.',
        )
      } else {
        setError(
          'Não foi possível criar a reserva. Tenta novamente.',
        )
      }

      setBooking(false)
      return
    }

    /*
     * Reserva criada com sucesso.
     */
    console.log(
      'Reserva criada com sucesso:',
      bookingId,
    )

    router.push('/bookings?success=1')
  }

  /*
   * Loading inicial
   */
  if (loading) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <p className="text-gray-500">
            A carregar experiência...
          </p>
        </main>
      </AppShell>
    )
  }

  /*
   * Experiência não encontrada
   */
  if (!experience) {
    return (
      <AppShell>
        <main className="mx-auto max-w-3xl px-5 py-16 text-center">
          <h1 className="text-2xl font-black">
            Experiência não encontrada
          </h1>

          <p className="mt-2 text-gray-500">
            Esta experiência pode ter sido removida ou
            ainda não está publicada.
          </p>
        </main>
      </AppShell>
    )
  }

  /*
   * Total da reserva
   */
  const totalPrice =
    Number(experience.price) * guests

  /*
   * Capacidade máxima da experiência
   */
  const maxGuests =
    experience.capacity &&
    experience.capacity > 0
      ? experience.capacity
      : 20

  /*
   * O máximo permitido passa a ser
   * a disponibilidade real da data.
   */
  const effectiveMaxGuests =
    availablePlaces === null
      ? maxGuests
      : Math.min(
          maxGuests,
          Math.max(availablePlaces, 0),
        )

  /*
   * Experiência esgotada
   */
  const soldOut =
    availablePlaces !== null &&
    availablePlaces <= 0

  return (
    <AppShell>
      <main className="min-h-screen bg-gray-50">
        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-6 lg:px-8">

          {/* Voltar */}
          <button
            type="button"
            onClick={() =>
              router.push(
                `/experience/${experience.slug}`,
              )
            }
            className="text-sm font-semibold text-gray-500 transition hover:text-gray-900"
          >
            ← Voltar para a experiência
          </button>

          <div className="mt-6 grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">

            {/* Informações da experiência */}
            <div>
              <div className="overflow-hidden rounded-[2rem] bg-gray-200">
                <img
                  src={
                    experience.cover_image ||
                    '/placeholder-experience.jpg'
                  }
                  alt={experience.title}
                  className="h-[320px] w-full object-cover sm:h-[420px]"
                />
              </div>

              <div className="mt-6">
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
                  {experience.category}
                </p>

                <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
                  {experience.title}
                </h1>

                <p className="mt-2 text-gray-500">
                  {experience.location ||
                    experience.city ||
                    experience.province}
                </p>
              </div>
            </div>

            {/* Card de reserva */}
            <div className="h-fit rounded-[2rem] border border-gray-200 bg-white p-6 shadow-sm sm:p-8">

              {/* Preço */}
              <div>
                <p className="text-sm text-gray-500">
                  A partir de
                </p>

                <p className="mt-1 text-3xl font-black">
                  {Number(
                    experience.price,
                  ).toLocaleString('pt-AO')}{' '}
                  Kz
                </p>

                <p className="text-sm text-gray-500">
                  por pessoa
                </p>
              </div>

              <div className="my-6 h-px bg-gray-100" />

              {/* Data */}
              <div>
                <label className="flex items-center gap-2 text-sm font-bold">
                  <CalendarDays size={18} />
                  Data da experiência
                </label>

                <input
                  type="date"
                  value={date}
                  min={
                    new Date()
                      .toISOString()
                      .split('T')[0]
                  }
                  onChange={(event) =>
                    handleDateChange(
                      event.target.value,
                    )
                  }
                  className="mt-3 h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />

                {/* Loading disponibilidade */}
                {loadingAvailability && (
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <span className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-orange-500" />

                    A verificar disponibilidade...
                  </div>
                )}

                {/* Disponibilidade */}
                {!loadingAvailability &&
                  date &&
                  availablePlaces !== null && (
                    <div
                      className={`mt-3 rounded-2xl px-4 py-3 text-sm font-bold ${
                        soldOut
                          ? 'bg-red-50 text-red-600'
                          : availablePlaces <= 3
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {soldOut
                        ? 'Esgotado para esta data'
                        : `${availablePlaces} ${
                            availablePlaces === 1
                              ? 'lugar disponível'
                              : 'lugares disponíveis'
                          }`}
                    </div>
                  )}
              </div>

              {/* Número de pessoas */}
              <div className="mt-6">
                <label className="flex items-center gap-2 text-sm font-bold">
                  <Users size={18} />
                  Número de pessoas
                </label>

                <div className="mt-3 flex h-12 items-center justify-between rounded-2xl border border-gray-200 px-3">

                  {/* Menos */}
                  <button
                    type="button"
                    disabled={
                      guests <= 1 ||
                      booking ||
                      soldOut
                    }
                    onClick={() =>
                      setGuests((value) =>
                        Math.max(
                          1,
                          value - 1,
                        ),
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Minus size={16} />
                  </button>

                  {/* Quantidade */}
                  <span className="font-bold">
                    {guests}{' '}
                    {guests === 1
                      ? 'pessoa'
                      : 'pessoas'}
                  </span>

                  {/* Mais */}
                  <button
                    type="button"
                    disabled={
                      guests >=
                        effectiveMaxGuests ||
                      booking ||
                      soldOut
                    }
                    onClick={() =>
                      setGuests((value) =>
                        Math.min(
                          effectiveMaxGuests,
                          value + 1,
                        ),
                      )
                    }
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Plus size={16} />
                  </button>
                </div>

                {/* Informação de capacidade */}
                {date &&
                availablePlaces !== null ? (
                  <p className="mt-2 text-xs text-gray-400">
                    Disponível nesta data:{' '}
                    {availablePlaces}{' '}
                    {availablePlaces === 1
                      ? 'lugar'
                      : 'lugares'}
                  </p>
                ) : (
                  <p className="mt-2 text-xs text-gray-400">
                    Capacidade máxima:{' '}
                    {maxGuests} pessoas
                  </p>
                )}
              </div>

              {/* Observações */}
              <div className="mt-6">
                <label className="text-sm font-bold">
                  Observações
                </label>

                <textarea
                  value={notes}
                  onChange={(event) =>
                    setNotes(event.target.value)
                  }
                  placeholder="Alguma informação que a agência deva saber?"
                  rows={4}
                  className="mt-3 w-full resize-none rounded-2xl border border-gray-200 bg-white p-4 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              {/* Erro */}
              {error && (
                <div className="mt-5 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-600">
                  {error}
                </div>
              )}

              {/* Resumo */}
              <div className="mt-6 rounded-2xl bg-gray-50 p-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">
                    {Number(
                      experience.price,
                    ).toLocaleString('pt-AO')}{' '}
                    Kz × {guests}
                  </span>

                  <span className="font-bold">
                    {totalPrice.toLocaleString(
                      'pt-AO',
                    )}{' '}
                    Kz
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between border-t border-gray-200 pt-3">
                  <span className="font-bold">
                    Total
                  </span>

                  <span className="text-xl font-black text-orange-500">
                    {totalPrice.toLocaleString(
                      'pt-AO',
                    )}{' '}
                    Kz
                  </span>
                </div>
              </div>

              {/* Botão */}
              <button
                type="button"
                onClick={createBooking}
                disabled={
                  booking ||
                  loadingAvailability ||
                  soldOut ||
                  !date
                }
                className="mt-5 flex h-14 w-full items-center justify-center rounded-2xl bg-orange-500 font-bold text-white transition hover:bg-orange-600 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {booking
                  ? 'A criar reserva...'
                  : soldOut
                    ? 'Experiência esgotada'
                    : !date
                      ? 'Seleciona uma data'
                      : 'Confirmar reserva'}
              </button>

              <p className="mt-3 text-center text-xs text-gray-400">
                O pagamento será adicionado numa etapa
                posterior.
              </p>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  )
}
