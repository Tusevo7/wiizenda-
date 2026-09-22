
'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Clock3,
  ImagePlus,
  Loader2,
  MapPin,
  Upload,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

function getLuandaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getLuandaNow() {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date())

  const get = (type: string) =>
    parts.find((part) => part.type === type)?.value || ''

  return `${get('year')}-${get('month')}-${get('day')}T${get('hour')}:${get('minute')}`
}

function toLuandaDate(date: string, time: string) {
  return new Date(`${date}T${time}:00+01:00`)
}

function formatDuration(totalMinutes: number) {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }

  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}min`
}

export default function NewExperiencePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)
  const [message, setMessage] = useState('')
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState('')
  const [minDate, setMinDate] = useState('')
  const [nowLuanda, setNowLuanda] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Praia',
    province: 'Luanda',
    city: 'Luanda',
    location: '',
    price: '',
    capacity: '',
    cover_image: '',
    activity_start_date: '',
    activity_start_time: '',
    activity_end_date: '',
    activity_end_time: '',
  })

  useEffect(() => {
    setMinDate(getLuandaDate())
    setNowLuanda(getLuandaNow())
  }, [])

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setMessage('')
  }

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setMessage('Seleciona apenas ficheiros de imagem.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setMessage('A imagem não pode ultrapassar 10 MB.')
      return
    }

    setMessage('')
    setImageFile(file)

    const previewUrl = URL.createObjectURL(file)
    setImagePreview(previewUrl)
  }

  async function uploadImage(
    userId: string,
    agencyId: string,
  ) {
    if (!imageFile) {
      return null
    }

    setUploadingImage(true)

    try {
      const extension =
        imageFile.name
          .split('.')
          .pop()
          ?.toLowerCase() || 'jpg'

      const fileName =
        `${Date.now()}-${crypto.randomUUID()}.${extension}`

      const filePath =
        `${agencyId}/${userId}/${fileName}`

      const {
        error: uploadError,
      } = await supabase.storage
        .from('experience-media')
        .upload(
          filePath,
          imageFile,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: imageFile.type,
          },
        )

      if (uploadError) {
        throw uploadError
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from('experience-media')
        .getPublicUrl(filePath)

      return publicUrlData.publicUrl
    } finally {
      setUploadingImage(false)
    }
  }

  const calculatedDuration = useMemo(() => {
    if (
      !form.activity_start_date ||
      !form.activity_start_time ||
      !form.activity_end_date ||
      !form.activity_end_time
    ) {
      return ''
    }

    const start = toLuandaDate(
      form.activity_start_date,
      form.activity_start_time,
    )

    const end = toLuandaDate(
      form.activity_end_date,
      form.activity_end_time,
    )

    const difference =
      end.getTime() - start.getTime()

    if (difference <= 0) {
      return ''
    }

    const minutes = Math.round(
      difference / 60000,
    )

    return formatDuration(minutes)
  }, [
    form.activity_start_date,
    form.activity_start_time,
    form.activity_end_date,
    form.activity_end_time,
  ])

  function validateSchedule() {
    if (
      !form.activity_start_date ||
      !form.activity_start_time ||
      !form.activity_end_date ||
      !form.activity_end_time
    ) {
      setMessage(
        'Define a data e hora de início e de término.',
      )
      return null
    }

    if (
      form.activity_start_date < minDate ||
      form.activity_end_date < minDate
    ) {
      setMessage('Escolhe outro dia.')
      return null
    }

    const start = toLuandaDate(
      form.activity_start_date,
      form.activity_start_time,
    )

    const end = toLuandaDate(
      form.activity_end_date,
      form.activity_end_time,
    )

    const now = new Date()

    if (start <= now) {
      setMessage(
        'A atividade precisa começar no futuro. Escolhe outro dia ou horário.',
      )
      return null
    }

    if (end <= start) {
      setMessage(
        'O término deve ser depois do início da atividade.',
      )
      return null
    }

    const durationMinutes = Math.round(
      (end.getTime() - start.getTime()) / 60000,
    )

    if (durationMinutes < 30) {
      setMessage(
        'A atividade deve ter pelo menos 30 minutos.',
      )
      return null
    }

    return {
      start,
      end,
      durationHours: Number(
        (durationMinutes / 60).toFixed(2),
      ),
    }
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('Precisas iniciar sessão.')
        setLoading(false)
        return
      }

      const {
        data: agency,
        error: agencyError,
      } = await supabase
        .from('agencies')
        .select('id, is_verified')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (agencyError) {
        throw agencyError
      }

      if (!agency) {
        setMessage(
          'Não encontrámos uma agência associada à tua conta.',
        )
        setLoading(false)
        return
      }

      const schedule = validateSchedule()

      if (!schedule) {
        setLoading(false)
        return
      }

      if (!form.title.trim()) {
        setMessage(
          'Indica o nome da experiência.',
        )
        setLoading(false)
        return
      }

      if (!form.description.trim()) {
        setMessage(
          'Adiciona uma descrição da experiência.',
        )
        setLoading(false)
        return
      }

      if (!form.location.trim()) {
        setMessage(
          'Indica o local da experiência.',
        )
        setLoading(false)
        return
      }

      if (!form.price) {
        setMessage(
          'Indica o preço da experiência.',
        )
        setLoading(false)
        return
      }

      if (!form.capacity) {
        setMessage(
          'Indica a capacidade da experiência.',
        )
        setLoading(false)
        return
      }

      const slug = form.title
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
          /(^-|-$)/g,
          '',
        )

      let coverImage =
        form.cover_image || null

      if (imageFile) {
        coverImage =
          await uploadImage(
            user.id,
            agency.id,
          )
      }

      const {
        error,
      } = await supabase
        .from('experiences')
        .insert({
          agency_id: agency.id,
          title: form.title.trim(),
          slug,
          description:
            form.description.trim(),
          category: form.category,
          province: form.province.trim(),
          city: form.city.trim(),
          location: form.location.trim(),
          price: Number(form.price),
          duration_hours:
            schedule.durationHours,
          capacity: Number(form.capacity),
          cover_image: coverImage,
          activity_start_at:
            schedule.start.toISOString(),
          activity_end_at:
            schedule.end.toISOString(),
        })

      if (error) {
        throw error
      }

      window.location.href = '/agency'
    } catch (error) {
      console.error(error)

      setMessage(
        'Não foi possível criar a experiência. Verifica os dados e tenta novamente.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f7f7f7]">
      <div className="mx-auto max-w-4xl px-5 py-8 sm:px-6 lg:py-10">

        {/* HEADER */}

        <div className="flex items-center justify-between">
          <Link
            href="/agency"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={18} />
            Voltar para a agência
          </Link>
        </div>

        <div className="mt-8">
          <div className="flex items-center gap-2 text-sm font-bold text-orange-500">
            <span className="h-2 w-2 rounded-full bg-orange-500" />
            Nova experiência
          </div>

          <h1 className="mt-3 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Publica uma experiência
          </h1>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Cria uma experiência clara e atrativa para os viajantes da Wizenda.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-4"
        >

          {/* INFORMAÇÕES PRINCIPAIS */}

          <section className="border border-gray-200 bg-white p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                01
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-950">
                Informações principais
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Apresenta a experiência ao viajante.
              </p>
            </div>

            <div className="mt-5 space-y-5">

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Nome da experiência
                </label>

                <input
                  required
                  value={form.title}
                  onChange={(e) =>
                    updateField(
                      'title',
                      e.target.value,
                    )
                  }
                  placeholder="Ex.: Passeio de barco no Mussulo"
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Descrição
                </label>

                <textarea
                  required
                  rows={5}
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      'description',
                      e.target.value,
                    )
                  }
                  placeholder="Descreve o que o viajante vai viver..."
                  className="mt-2 w-full resize-none border border-gray-200 px-4 py-3 leading-6 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Categoria
                </label>

                <select
                  value={form.category}
                  onChange={(e) =>
                    updateField(
                      'category',
                      e.target.value,
                    )
                  }
                  className="mt-2 w-full border border-gray-200 bg-white px-4 py-3 outline-none focus:border-orange-500"
                >
                  {categories.map(
                    (category) => (
                      <option
                        key={category}
                        value={category}
                      >
                        {category}
                      </option>
                    ),
                  )}
                </select>
              </div>

            </div>
          </section>

          {/* LOCALIZAÇÃO */}

          <section className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-50 text-orange-500">
                <MapPin size={19} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  02
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-950">
                  Localização
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Onde acontece a experiência?
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Província
                </label>

                <input
                  required
                  value={form.province}
                  onChange={(e) =>
                    updateField(
                      'province',
                      e.target.value,
                    )
                  }
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Cidade
                </label>

                <input
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      'city',
                      e.target.value,
                    )
                  }
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-800">
                  Local específico
                </label>

                <input
                  required
                  value={form.location}
                  onChange={(e) =>
                    updateField(
                      'location',
                      e.target.value,
                    )
                  }
                  placeholder="Ex.: Ilha do Mussulo"
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

            </div>
          </section>

          {/* DATA E HORÁRIO */}

          <section className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-50 text-orange-500">
                <CalendarDays size={19} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  03
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-950">
                  Data e horário
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Define quando a experiência começa e termina.
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-6 sm:grid-cols-2">

              {/* INÍCIO */}

              <div className="border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Clock3 size={16} className="text-orange-500" />
                  Início
                </div>

                <div className="mt-4 space-y-3">

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Data
                    </label>

                    <input
                      required
                      type="date"
                      min={minDate}
                      value={
                        form.activity_start_date
                      }
                      onChange={(e) =>
                        updateField(
                          'activity_start_date',
                          e.target.value,
                        )
                      }
                      className="mt-1.5 w-full border border-gray-200 bg-white px-3 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Hora
                    </label>

                    <input
                      required
                      type="time"
                      value={
                        form.activity_start_time
                      }
                      onChange={(e) =>
                        updateField(
                          'activity_start_time',
                          e.target.value,
                        )
                      }
                      className="mt-1.5 w-full border border-gray-200 bg-white px-3 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                </div>
              </div>

              {/* TÉRMINO */}

              <div className="border border-gray-100 bg-gray-50 p-4">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Clock3 size={16} className="text-orange-500" />
                  Término
                </div>

                <div className="mt-4 space-y-3">

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Data
                    </label>

                    <input
                      required
                      type="date"
                      min={
                        form.activity_start_date ||
                        minDate
                      }
                      value={
                        form.activity_end_date
                      }
                      onChange={(e) =>
                        updateField(
                          'activity_end_date',
                          e.target.value,
                        )
                      }
                      className="mt-1.5 w-full border border-gray-200 bg-white px-3 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-500">
                      Hora
                    </label>

                    <input
                      required
                      type="time"
                      value={
                        form.activity_end_time
                      }
                      onChange={(e) =>
                        updateField(
                          'activity_end_time',
                          e.target.value,
                        )
                      }
                      className="mt-1.5 w-full border border-gray-200 bg-white px-3 py-3 outline-none focus:border-orange-500"
                    />
                  </div>

                </div>
              </div>

            </div>

            {/* DURAÇÃO AUTOMÁTICA */}

            <div className="mt-4 flex items-center justify-between border border-orange-100 bg-orange-50 px-4 py-4">
              <div>
                <p className="text-xs font-semibold text-orange-600">
                  Duração calculada automaticamente
                </p>

                <p className="mt-1 text-sm text-gray-600">
                  Não precisas preencher este campo.
                </p>
              </div>

              <div className="text-right">
                <p className="text-lg font-black text-gray-950">
                  {calculatedDuration || '—'}
                </p>
              </div>
            </div>

            <p className="mt-4 text-xs leading-5 text-gray-400">
              Só podes publicar experiências com uma data futura.
              O horário usado pela Wizenda é o horário de Angola.
            </p>
          </section>

          {/* PREÇO E CAPACIDADE */}

          <section className="border border-gray-200 bg-white p-5 sm:p-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                04
              </p>

              <h2 className="mt-1 text-lg font-bold text-gray-950">
                Preço e capacidade
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Define quanto custa e quantas pessoas podem participar.
              </p>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Preço por pessoa (Kz)
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      'price',
                      e.target.value,
                    )
                  }
                  placeholder="25000"
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-800">
                  Capacidade
                </label>

                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    updateField(
                      'capacity',
                      e.target.value,
                    )
                  }
                  placeholder="20"
                  className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

            </div>
          </section>

          {/* IMAGEM */}

          <section className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center bg-orange-50 text-orange-500">
                <ImagePlus size={19} />
              </div>

              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-orange-500">
                  05
                </p>

                <h2 className="mt-1 text-lg font-bold text-gray-950">
                  Imagem de capa
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Usa uma imagem forte para apresentar a experiência.
                </p>
              </div>
            </div>

            <label className="mt-5 block cursor-pointer border-2 border-dashed border-gray-200 bg-gray-50 p-4 text-center transition hover:border-orange-400 hover:bg-orange-50/30">

              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Pré-visualização"
                  className="h-64 w-full object-cover sm:h-80"
                />
              ) : (
                <div className="flex min-h-52 flex-col items-center justify-center">
                  <Upload
                    size={30}
                    className="text-gray-400"
                  />

                  <span className="mt-4 text-sm font-bold text-gray-700">
                    Escolher imagem
                  </span>

                  <span className="mt-1 text-xs text-gray-400">
                    JPG, PNG ou WebP · máximo 10 MB
                  </span>
                </div>
              )}

              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>

            {imageFile && (
              <p className="mt-3 text-xs text-gray-500">
                {imageFile.name}
              </p>
            )}

            <div className="mt-5">
              <label className="text-xs font-semibold text-gray-500">
                Ou usa uma URL de imagem
              </label>

              <input
                type="url"
                value={form.cover_image}
                onChange={(e) =>
                  updateField(
                    'cover_image',
                    e.target.value,
                  )
                }
                placeholder="https://..."
                className="mt-2 w-full border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>
          </section>

          {/* MENSAGEM */}

          {message && (
            <div className="border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">
              {message}
            </div>
          )}

          {/* PUBLICAR */}

          <div className="border border-gray-200 bg-white p-5 sm:p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

              <div>
                <p className="font-bold text-gray-950">
                  Pronto para publicar?
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  A experiência ficará disponível conforme o estado da tua agência.
                </p>
              </div>

              <button
                type="submit"
                disabled={
                  loading ||
                  uploadingImage
                }
                className="flex w-full items-center justify-center gap-2 bg-orange-500 px-6 py-3.5 text-sm font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
              >
                {(loading ||
                  uploadingImage) && (
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />
                )}

                {uploadingImage
                  ? 'A enviar imagem...'
                  : loading
                    ? 'A publicar...'
                    : 'Criar experiência'}
              </button>

            </div>
          </div>

        </form>
      </div>
    </main>
  )
}
