
'use client'

import Link from 'next/link'
import { ArrowLeft, CheckCircle2, FileText, Upload } from 'lucide-react'
import { ChangeEvent, useEffect, useState } from 'react'

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
      }
    | null
}

type Payment = {
  id: string
  amount: number
  currency: string
  status: string
  reference: string
  proof_path: string | null
}

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const [bookingId, setBookingId] = useState('')

  const [booking, setBooking] =
    useState<Booking | null>(null)

  const [payment, setPayment] =
    useState<Payment | null>(null)

  const [selectedFile, setSelectedFile] =
    useState<File | null>(null)

  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const supabase = createClient()

  useEffect(() => {
    let cancelled = false

    async function load() {
      const { id } = await params

      if (cancelled) return

      setBookingId(id)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setError(
          'Precisas de entrar na tua conta.',
        )
        setLoading(false)
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
              province
            )
          `)
          .eq('id', id)
          .eq('user_id', user.id)
          .maybeSingle()

      if (bookingError || !bookingData) {
        setError(
          'Não foi possível encontrar esta reserva.',
        )
        setLoading(false)
        return
      }

      const { data: paymentData, error: paymentError } =
        await supabase
          .from('payments')
          .select(`
            id,
            amount,
            currency,
            status,
            reference,
            proof_path
          `)
          .eq('booking_id', id)
          .eq('user_id', user.id)
          .maybeSingle()

      if (paymentError || !paymentData) {
        setError(
          'Não foi possível carregar os dados do pagamento.',
        )
        setLoading(false)
        return
      }

      if (!cancelled) {
        setBooking(bookingData as Booking)
        setPayment(paymentData as Payment)
        setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [])

  function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    setError('')
    setSuccess('')

    if (booking?.status === 'expired') {
      event.target.value = ''
      setSelectedFile(null)
      setError(
        'Esta reserva expirou. Já não é possível enviar um comprovativo.',
      )
      return
    }

    const file = event.target.files?.[0]

    if (!file) {
      setSelectedFile(null)
      return
    }

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/pdf',
    ]

    if (!allowedTypes.includes(file.type)) {
      setSelectedFile(null)
      event.target.value = ''

      setError(
        'Seleciona uma imagem JPG/PNG ou um ficheiro PDF.',
      )

      return
    }

    const maxSize = 5 * 1024 * 1024

    if (file.size > maxSize) {
      setSelectedFile(null)
      event.target.value = ''

      setError(
        'O comprovativo não pode ultrapassar 5 MB.',
      )

      return
    }

    setSelectedFile(file)
  }

  async function handleUpload() {
    if (!selectedFile) {
      setError(
        'Seleciona primeiro o comprovativo.',
      )
      return
    }

    if (!booking || !payment) {
      setError(
        'Dados do pagamento indisponíveis.',
      )
      return
    }

    if (booking.status === 'expired') {
      setError(
        'Esta reserva expirou. O prazo de pagamento terminou.',
      )
      return
    }

    if (payment.status === 'paid') {
      setError(
        'Este pagamento já foi confirmado.',
      )
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      setError(
        'A tua sessão terminou. Entra novamente.',
      )
      setUploading(false)
      return
    }

    const extension =
      selectedFile.name
        .split('.')
        .pop()
        ?.toLowerCase() ||
      'jpg'

    const path =
      `${user.id}/` +
      `${booking.id}/` +
      `comprovativo-${Date.now()}.${extension}`

    const { error: uploadError } =
      await supabase.storage
        .from('payment-proofs')
        .upload(
          path,
          selectedFile,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: selectedFile.type,
          },
        )

    if (uploadError) {
      console.error(uploadError)

      setError(
        'Não foi possível enviar o comprovativo.',
      )

      setUploading(false)
      return
    }

    const { error: updateError } =
      await supabase
        .from('payments')
        .update({
          proof_path: path,
          status: 'submitted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', payment.id)
        .eq('user_id', user.id)

    if (updateError) {
      console.error(updateError)

      await supabase.storage
        .from('payment-proofs')
        .remove([path])

      setError(
        'O comprovativo foi enviado, mas não foi possível registar o pagamento.',
      )

      setUploading(false)
      return
    }

    setPayment({
      ...payment,
      proof_path: path,
      status: 'submitted',
    })

    setSelectedFile(null)

    setSuccess(
      'Comprovativo enviado com sucesso. Aguarda a confirmação da agência.',
    )

    setUploading(false)
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <div className="rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-semibold text-gray-500">
              A carregar pagamento...
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (error && (!booking || !payment)) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-10">
        <div className="mx-auto max-w-2xl">
          <Link
            href="/bookings"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-500"
          >
            <ArrowLeft size={17} />
            Voltar às reservas
          </Link>

          <div className="mt-6 rounded-3xl bg-white p-8 text-center shadow-sm">
            <p className="font-bold text-red-600">
              {error}
            </p>
          </div>
        </div>
      </main>
    )
  }

  if (!booking || !payment) {
    return null
  }

  const experience = booking.experiences

  const isExpired =
    booking.status === 'expired'

  const isPaid =
    payment.status === 'paid'

  const isSubmitted =
    payment.status === 'submitted'

  const isRejected =
    payment.status === 'rejected'

  return (
    <main className="min-h-screen bg-gray-50">

      <section className="mx-auto max-w-2xl px-5 py-8 sm:px-6">

        <Link
          href="/bookings"
          className="inline-flex items-center gap-2 text-sm font-bold text-gray-500 transition hover:text-gray-900"
        >
          <ArrowLeft size={17} />
          Voltar às reservas
        </Link>

        <div className="mt-6">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Pagamento
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight">
            {experience?.title || 'Experiência'}
          </h1>

          <p className="mt-2 text-gray-500">
            {isExpired
              ? 'O prazo para pagamento desta reserva terminou.'
              : 'Envia o comprovativo para a agência confirmar o pagamento.'}
          </p>
        </div>

        {/* RESUMO */}
        <div className="mt-6 rounded-3xl border border-gray-100 bg-white p-6 shadow-sm">

          <div className="space-y-4">

            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Data
              </span>

              <strong className="text-sm">
                {new Date(
                  `${booking.booking_date}T00:00:00`,
                ).toLocaleDateString('pt-AO')}
              </strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Pessoas
              </span>

              <strong className="text-sm">
                {booking.guests}
              </strong>
            </div>

            <div className="flex justify-between gap-4">
              <span className="text-sm text-gray-500">
                Referência
              </span>

              <strong className="text-sm">
                {payment.reference}
              </strong>
            </div>

            <div className="border-t border-gray-100 pt-4">
              <div className="flex items-end justify-between gap-4">
                <span className="text-sm text-gray-500">
                  Total
                </span>

                <strong className="text-2xl font-black text-orange-500">
                  {Number(
                    payment.amount,
                  ).toLocaleString('pt-AO')}{' '}
                  {payment.currency}
                </strong>
              </div>
            </div>

          </div>
        </div>

        {/* RESERVA EXPIRADA */}
        {isExpired && (
          <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-6">

            <div className="flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100">
                <CheckCircle2
                  size={21}
                  className="text-red-600"
                />
              </div>

              <div>
                <p className="font-black text-red-700">
                  Reserva expirada
                </p>

                <p className="mt-1 text-sm leading-6 text-red-700/80">
                  O prazo de 24 horas para pagamento terminou.
                  Esta reserva já não pode receber comprovativos
                  de pagamento.
                </p>

                <Link
                  href="/bookings"
                  className="mt-4 inline-flex rounded-xl bg-red-600 px-4 py-2.5 text-sm font-black text-white transition hover:bg-red-700"
                >
                  Voltar às reservas
                </Link>
              </div>

            </div>

          </div>
        )}

        {/* ESTADO PAGO */}
        {!isExpired && isPaid && (
          <div className="mt-5 rounded-3xl border border-green-100 bg-green-50 p-6">

            <div className="flex items-start gap-3">

              <CheckCircle2
                className="mt-0.5 shrink-0 text-green-600"
                size={22}
              />

              <div>
                <p className="font-black text-green-700">
                  Pagamento confirmado
                </p>

                <p className="mt-1 text-sm text-green-700/80">
                  A agência confirmou o teu pagamento.
                  O próximo passo será a emissão do teu bilhete.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* COMPROVATIVO ENVIADO */}
        {!isExpired && isSubmitted && (
          <div className="mt-5 rounded-3xl border border-orange-100 bg-orange-50 p-6">

            <div className="flex items-start gap-3">

              <CheckCircle2
                className="mt-0.5 shrink-0 text-orange-600"
                size={22}
              />

              <div>
                <p className="font-black text-orange-700">
                  Comprovativo enviado
                </p>

                <p className="mt-1 text-sm text-orange-700/80">
                  O comprovativo foi enviado para a agência.
                  Aguarda a confirmação do pagamento.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* PAGAMENTO REJEITADO */}
        {!isExpired && isRejected && (
          <div className="mt-5 rounded-3xl border border-red-100 bg-red-50 p-6">

            <p className="font-black text-red-700">
              Comprovativo rejeitado
            </p>

            <p className="mt-1 text-sm text-red-700/80">
              Envia um novo comprovativo de pagamento.
            </p>

          </div>
        )}

        {/* INFORMAÇÕES DE PAGAMENTO */}
        {!isExpired && !isPaid && (
          <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

            <h2 className="text-lg font-black">
              Como pagar
            </h2>

            <div className="mt-4 rounded-2xl bg-gray-50 p-4">

              <p className="text-sm leading-6 text-gray-600">
                Faz o pagamento através do método indicado
                pela agência e guarda o comprovativo.
              </p>

              <p className="mt-3 text-sm font-bold text-gray-900">
                Referência:
              </p>

              <p className="mt-1 text-lg font-black text-orange-500">
                {payment.reference}
              </p>

            </div>

          </div>
        )}

        {/* UPLOAD */}
        {!isExpired && !isPaid && (
          <div className="mt-5 rounded-3xl bg-white p-6 shadow-sm">

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50">
                <FileText
                  size={21}
                  className="text-orange-500"
                />
              </div>

              <div>
                <h2 className="font-black">
                  Comprovativo de pagamento
                </h2>

                <p className="text-sm text-gray-500">
                  JPG, PNG ou PDF · máximo 5 MB
                </p>
              </div>

            </div>

            <label
              htmlFor="payment-proof"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 px-5 py-8 text-center transition hover:border-orange-300 hover:bg-orange-50/40"
            >
              <Upload
                size={24}
                className="text-orange-500"
              />

              <span className="mt-3 text-sm font-black">
                Selecionar comprovativo
              </span>

              <span className="mt-1 text-xs text-gray-500">
                JPG, PNG ou PDF
              </span>

              <input
                id="payment-proof"
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf,.jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>

            {selectedFile && (
              <div className="mt-4 rounded-2xl bg-gray-50 p-4">

                <div className="flex items-center gap-3">

                  <FileText
                    size={20}
                    className="shrink-0 text-orange-500"
                  />

                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      {selectedFile.name}
                    </p>

                    <p className="text-xs text-gray-500">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                </div>

              </div>
            )}

            {error && (
              <div className="mt-4 rounded-2xl bg-red-50 p-4">
                <p className="text-sm font-semibold text-red-600">
                  {error}
                </p>
              </div>
            )}

            {success && (
              <div className="mt-4 rounded-2xl bg-green-50 p-4">
                <p className="text-sm font-semibold text-green-700">
                  {success}
                </p>
              </div>
            )}

            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-3.5 text-sm font-black text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Upload size={18} />

              {uploading
                ? 'A enviar...'
                : 'Enviar comprovativo'}
            </button>

          </div>
        )}

      </section>
    </main>
  )
}
