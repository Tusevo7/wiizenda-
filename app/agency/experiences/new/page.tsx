'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  Check,
  Clock3,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Pause,
  Play,
  Search,
  Star,
  Upload,
  Users,
  Volume2,
  X,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const supabase = createClient()

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
  'História',
  'Arte',
  'Entretenimento',
  'Desporto',
  'Bem-estar',
  'Outro',
]

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
}

type FormState = {
  title: string
  description: string
  category: string
  province: string
  city: string
  location: string
  date: string
  start_time: string
  end_time: string
  price: string
  duration_hours: string
  capacity: string
}

function createSlug(text: string) {
  return (
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') || `experiencia-${Date.now()}`
  )
}

function formatTime(seconds: number) {
  const safe = Math.max(0, Math.floor(seconds || 0))
  const minutes = Math.floor(safe / 60)
  const remaining = safe % 60

  return `${String(minutes).padStart(2, '0')}:${String(
    remaining,
  ).padStart(2, '0')}`
}

function formatDate(date: string) {
  if (!date) return 'Data da experiência'

  const parsed = new Date(`${date}T00:00:00`)

  if (Number.isNaN(parsed.getTime())) {
    return 'Data da experiência'
  }

  return parsed.toLocaleDateString('pt-AO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function calculateDurationHours(
  start: string,
  end: string,
) {
  if (!start || !end) return 0

  const [startHour, startMinute] = start
    .split(':')
    .map(Number)

  const [endHour, endMinute] = end
    .split(':')
    .map(Number)

  const startTotal =
    startHour * 60 + startMinute

  const endTotal =
    endHour * 60 + endMinute

  const difference = endTotal - startTotal

  if (difference <= 0) return 0

  return difference / 60
}

function formatExperienceDuration(
  hours: number,
) {
  if (!hours || hours <= 0) {
    return 'A calcular'
  }

  const wholeHours = Math.floor(hours)
  const minutes = Math.round(
    (hours - wholeHours) * 60,
  )

  if (wholeHours > 0 && minutes > 0) {
    return `${wholeHours}h ${minutes}min`
  }

  if (wholeHours > 0) {
    return `${wholeHours} ${
      wholeHours === 1 ? 'hora' : 'horas'
    }`
  }

  return `${minutes} min`
}

function getTodayISODate() {
  const now = new Date()
  const local = new Date(
    now.getTime() -
      now.getTimezoneOffset() * 60000,
  )

  return local.toISOString().slice(0, 10)
}

function localDateTimeToISO(
  date: string,
  time: string,
) {
  if (!date || !time) return null

  const localDate = new Date(
    `${date}T${time}:00`,
  )

  if (Number.isNaN(localDate.getTime())) {
    return null
  }

  return localDate.toISOString()
}

export default function NewExperiencePage() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const fileInputRef =
    useRef<HTMLInputElement | null>(null)

  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] =
    useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<
    'error' | 'success'
  >('error')

  const [form, setForm] = useState<FormState>({
    title: '',
    description: '',
    category: 'Praia',
    province: '',
    city: '',
    location: '',
    date: '',
    start_time: '',
    end_time: '',
    price: '',
    duration_hours: '',
    capacity: '',
  })

  const [coverFile, setCoverFile] =
    useState<File | null>(null)

  const [coverPreview, setCoverPreview] =
    useState('')

  const [uploadedCoverUrl, setUploadedCoverUrl] =
    useState('')

  const [coverError, setCoverError] =
    useState('')

  const [tracks, setTracks] =
    useState<MusicTrack[]>([])

  const [loadingTracks, setLoadingTracks] =
    useState(true)

  const [musicSearch, setMusicSearch] =
    useState('')

  const [selectedTrack, setSelectedTrack] =
    useState<MusicTrack | null>(null)

  const [musicStart, setMusicStart] =
    useState(0)

  const [musicDuration, setMusicDuration] =
    useState(30)

  const [playingTrackId, setPlayingTrackId] =
    useState<string | null>(null)

  const [currentAudioTime, setCurrentAudioTime] =
    useState(0)

  /*
   * ============================================================
   * CARREGAR MÚSICAS DO ADMIN
   * ============================================================
   */

  useEffect(() => {
    async function loadMusic() {
      setLoadingTracks(true)

      const { data, error } = await supabase
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
          is_active
        `)
        .eq('is_active', true)
        .order('created_at', {
          ascending: false,
        })

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

      setLoadingTracks(false)
    }

    void loadMusic()
  }, [])

  /*
   * ============================================================
   * LIMPAR ÁUDIO
   * ============================================================
   */

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
      }

      if (coverPreview) {
        URL.revokeObjectURL(coverPreview)
      }
    }
  }, [])

  /*
   * ============================================================
   * CAMPOS
   * ============================================================
   */

  function updateField(
    field: keyof FormState,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))

    setMessage('')
  }

  /*
   * ============================================================
   * UPLOAD DE IMAGEM
   * ============================================================
   */

  function handleImageSelect(
    file: File | null,
  ) {
    if (!file) return

    setCoverError('')
    setMessage('')

    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
    ]

    if (!allowedTypes.includes(file.type)) {
      setCoverError(
        'Formato inválido. Use JPG, PNG ou WEBP.',
      )
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setCoverError(
        'A imagem não pode ultrapassar 10 MB.',
      )
      return
    }

    if (coverPreview) {
      URL.revokeObjectURL(coverPreview)
    }

    const preview =
      URL.createObjectURL(file)

    setCoverFile(file)
    setCoverPreview(preview)
    setUploadedCoverUrl('')
  }

  /*
   * ============================================================
   * UPLOAD PARA SUPABASE STORAGE
   * ============================================================
   */

  async function uploadCoverImage() {
    if (!coverFile) {
      return null
    }

    setUploadingImage(true)
    setCoverError('')

    try {
      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error(
          'Utilizador não autenticado.',
        )
      }

      const extension =
        coverFile.name
          .split('.')
          .pop()
          ?.toLowerCase() || 'jpg'

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`

      const {
        error: uploadError,
      } = await supabase.storage
        .from('experience-media')
        .upload(
          filePath,
          coverFile,
          {
            cacheControl: '3600',
            upsert: false,
            contentType: coverFile.type,
          },
        )

      if (uploadError) {
        console.error(
          'Erro no upload:',
          uploadError,
        )

        throw new Error(
          uploadError.message ||
            'Não foi possível fazer o upload.',
        )
      }

      const {
        data: publicData,
      } = supabase.storage
        .from('experience-media')
        .getPublicUrl(filePath)

      if (!publicData.publicUrl) {
        throw new Error(
          'Não foi possível obter o URL público da imagem.',
        )
      }

      setUploadedCoverUrl(
        publicData.publicUrl,
      )

      return publicData.publicUrl
    } catch (error) {
      console.error(error)

      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Erro ao enviar a imagem.'

      setCoverError(errorMessage)

      return null
    } finally {
      setUploadingImage(false)
    }
  }

  /*
   * ============================================================
   * MÚSICA
   * ============================================================
   */

  const filteredTracks = useMemo(() => {
    const query =
      musicSearch.trim().toLowerCase()

    if (!query) {
      return tracks
    }

    return tracks.filter((track) => {
      return (
        track.title
          .toLowerCase()
          .includes(query) ||
        track.artist
          ?.toLowerCase()
          .includes(query) ||
        track.genre
          ?.toLowerCase()
          .includes(query)
      )
    })
  }, [tracks, musicSearch])

  function stopAudio() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setPlayingTrackId(null)
    setCurrentAudioTime(0)
  }

  function selectTrack(
    track: MusicTrack,
  ) {
    stopAudio()

    setSelectedTrack(track)

    const total =
      track.duration_seconds || 30

    const start =
      Math.min(
        track.preview_start_seconds || 0,
        Math.max(0, total - 1),
      )

    const available =
      Math.max(1, total - start)

    const duration =
      Math.min(
        track.preview_duration_seconds || 30,
        available,
      )

    setMusicStart(start)
    setMusicDuration(duration)
    setCurrentAudioTime(start)
  }

  function playTrack(
    track: MusicTrack,
  ) {
    if (
      playingTrackId === track.id
    ) {
      stopAudio()
      return
    }

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
    }

    const start =
      selectedTrack?.id === track.id
        ? musicStart
        : track.preview_start_seconds || 0

    const duration =
      selectedTrack?.id === track.id
        ? musicDuration
        : Math.min(
            track.preview_duration_seconds ||
              30,
            Math.max(
              1,
              (track.duration_seconds || 30) -
                start,
            ),
          )

    const audio = new Audio(
      track.audio_url,
    )

    audioRef.current = audio

    audio.currentTime = start

    audio.ontimeupdate = () => {
      const current =
        audio.currentTime

      setCurrentAudioTime(current)

      if (
        current >=
        start + duration
      ) {
        audio.pause()
        audio.currentTime = start
        setPlayingTrackId(null)
      }
    }

    audio.onended = () => {
      setPlayingTrackId(null)
    }

    audio.onerror = () => {
      setPlayingTrackId(null)

      setMessage(
        'Não foi possível reproduzir esta música.',
      )

      setMessageType('error')
    }

    void audio.play()

    setPlayingTrackId(track.id)
  }

  function changeMusicStart(
    value: number,
  ) {
    if (!selectedTrack) return

    const total =
      selectedTrack.duration_seconds ||
      30

    const maxStart = Math.max(
      0,
      total - musicDuration,
    )

    const newStart = Math.min(
      Math.max(0, value),
      maxStart,
    )

    setMusicStart(newStart)
    setCurrentAudioTime(newStart)

    if (audioRef.current) {
      audioRef.current.currentTime =
        newStart
    }
  }

  function changeMusicDuration(
    value: number,
  ) {
    if (!selectedTrack) return

    const total =
      selectedTrack.duration_seconds ||
      30

    const maxDuration =
      Math.max(
        1,
        total - musicStart,
      )

    const newDuration =
      Math.min(
        Math.max(1, value),
        maxDuration,
      )

    setMusicDuration(
      newDuration,
    )
  }

  /*
   * ============================================================
   * CRIAR EXPERIÊNCIA
   * ============================================================
   */

  async function createExperience() {
    setMessage('')
    setMessageType('error')

    if (!form.title.trim()) {
      setMessage(
        'Digite o nome da experiência.',
      )
      return
    }

    if (!form.description.trim()) {
      setMessage(
        'Digite uma descrição para a experiência.',
      )
      return
    }

    if (!form.province.trim()) {
      setMessage(
        'Informe a província.',
      )
      return
    }

    if (!form.city.trim()) {
      setMessage(
        'Informe a cidade.',
      )
      return
    }

    if (!form.date) {
      setMessage(
        'Selecione a data da experiência.',
      )
      return
    }

    if (!form.start_time) {
      setMessage(
        'Informe a hora de início.',
      )
      return
    }

    if (!form.end_time) {
      setMessage(
        'Informe a hora de término.',
      )
      return
    }

    const startISO =
      localDateTimeToISO(
        form.date,
        form.start_time,
      )

    const endISO =
      localDateTimeToISO(
        form.date,
        form.end_time,
      )

    if (!startISO || !endISO) {
      setMessage(
        'A data ou horário informado é inválido.',
      )
      return
    }

    if (
      new Date(endISO) <=
      new Date(startISO)
    ) {
      setMessage(
        'A hora de término deve ser posterior à hora de início.',
      )
      return
    }

    if (
      !form.price ||
      Number(form.price) < 0
    ) {
      setMessage(
        'Informe um preço válido.',
      )
      return
    }

    const durationHoursToSave =
      calculateDurationHours(
        form.start_time,
        form.end_time,
      )

    if (durationHoursToSave <= 0) {
      setMessage(
        'A duração é calculada automaticamente. Escolha uma hora de término posterior à hora de início.',
      )
      return
    }

    const todayISO = getTodayISODate()

    if (form.date < todayISO) {
      setMessage(
        'A data da experiência não pode estar no passado.',
      )
      return
    }

    if (
      !form.capacity ||
      Number(form.capacity) <= 0
    ) {
      setMessage(
        'Informe a capacidade.',
      )
      return
    }

    setSaving(true)

    try {
      /*
       * Utilizador
       */

      const {
        data: {
          user,
        },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        setMessage(
          'A tua sessão expirou. Inicia sessão novamente.',
        )

        setSaving(false)
        return
      }

      /*
       * Agência
       */

      const {
        data: agency,
        error: agencyError,
      } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (agencyError) {
        console.error(
          agencyError,
        )

        setMessage(
          'Não foi possível verificar a tua agência.',
        )

        setSaving(false)
        return
      }

      if (!agency) {
        setMessage(
          'Não encontramos uma agência associada à tua conta.',
        )

        setSaving(false)
        return
      }

      /*
       * Upload da imagem
       */

      let coverUrl =
        uploadedCoverUrl || null

      if (
        coverFile &&
        !uploadedCoverUrl
      ) {
        coverUrl =
          await uploadCoverImage()

        if (!coverUrl) {
          setMessage(
            'Não foi possível enviar a imagem de capa.',
          )

          setSaving(false)
          return
        }
      }

      /*
       * Slug
       */

      const baseSlug =
        createSlug(form.title)

      let slug = baseSlug

      const {
        data: existingSlug,
      } = await supabase
        .from('experiences')
        .select('id')
        .eq('slug', baseSlug)
        .maybeSingle()

      if (existingSlug) {
        slug =
          `${baseSlug}-${Date.now()}`
      }

      /*
       * Música
       */

      const musicData =
        selectedTrack
          ? {
              music_id:
                selectedTrack.id,

              music_title:
                selectedTrack.title,

              music_artist:
                selectedTrack.artist,

              music_url:
                selectedTrack.audio_url,

              music_start_seconds:
                Math.round(
                  musicStart,
                ),

              music_duration_seconds:
                Math.round(
                  musicDuration,
                ),
            }
          : {
              music_id: null,
              music_title: null,
              music_artist: null,
              music_url: null,
              music_start_seconds: 0,
              music_duration_seconds: null,
            }

      /*
       * Insert
       */

      const {
        data: experience,
        error: insertError,
      } = await supabase
        .from('experiences')
        .insert({
          agency_id:
            agency.id,

          title:
            form.title.trim(),

          slug,

          description:
            form.description.trim(),

          category:
            form.category,

          province:
            form.province.trim(),

          city:
            form.city.trim(),

          location:
            form.location.trim() ||
            null,

          price:
            Number(form.price),

          duration_hours:
            durationHoursToSave,

          capacity:
            Number(form.capacity),

          cover_image:
            coverUrl,

          status:
            'draft',

          activity_start_at:
            startISO,

          activity_end_at:
            endISO,

          ...musicData,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error(
          'Erro ao criar experiência:',
          insertError,
        )

        setMessage(
          insertError.message ||
            'Não foi possível criar a experiência.',
        )

        setSaving(false)
        return
      }

      if (!experience) {
        setMessage(
          'A experiência não foi criada.',
        )

        setSaving(false)
        return
      }

      stopAudio()

      setMessage(
        'Experiência criada com sucesso.',
      )

      setMessageType('success')

      /*
       * Ir para edição
       */

      setTimeout(() => {
  window.location.href = '/agency'
}, 500)
    } catch (error) {
      console.error(error)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro inesperado.',
      )

      setMessageType('error')
      setSaving(false)
    }
  }

  /*
   * ============================================================
   * PREVIEW
   * ============================================================
   */

  const previewTitle =
    form.title.trim() ||
    'Nome da experiência'

  const previewLocation =
    form.location.trim() ||
    form.city.trim() ||
    form.province.trim() ||
    'Localização'

  const previewPrice =
    Number(form.price || 0)

  const calculatedDurationHours =
    calculateDurationHours(
      form.start_time,
      form.end_time,
    )

  const previewDuration =
    calculatedDurationHours

  const previewCapacity =
    Number(form.capacity || 0)

  const previewImage =
    coverPreview ||
    uploadedCoverUrl

  const musicTotal =
    selectedTrack?.duration_seconds ||
    30

  const musicStartPercent =
    selectedTrack
      ? (musicStart /
          musicTotal) *
        100
      : 0

  const musicWidthPercent =
    selectedTrack
      ? (musicDuration /
          musicTotal) *
        100
      : 0

  const musicPlaybackPercent =
    selectedTrack &&
    musicDuration > 0
      ? Math.min(
          100,
          Math.max(
            0,
            ((currentAudioTime -
              musicStart) /
              musicDuration) *
              100,
          ),
        )
      : 0

  return (
    <main className="min-h-screen bg-[#f7f7f8]">

      {/* ====================================================== */}
      {/* HEADER */}
      {/* ====================================================== */}

      <header className="sticky top-0 z-50 border-b border-gray-200/80 bg-white/95 backdrop-blur">

        <div className="mx-auto flex max-w-[1550px] items-center justify-between px-5 py-4 lg:px-8">

          <Link
            href="/agency"
            className="inline-flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={18} />
            Voltar
          </Link>

          <div className="hidden text-center sm:block">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-orange-500">
              Wizenda
            </p>

            <h1 className="text-lg font-black text-gray-950">
              Nova experiência
            </h1>
          </div>

          <button
            type="button"
            onClick={createExperience}
            disabled={
              saving ||
              uploadingImage
            }
            className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Check size={16} />
            )}

            {saving
              ? 'A criar...'
              : 'Criar experiência'}
          </button>
        </div>
      </header>

      {/* ====================================================== */}
      {/* CONTEÚDO */}
      {/* ====================================================== */}

      <div className="mx-auto grid max-w-[1550px] gap-8 px-5 py-8 lg:grid-cols-[minmax(0,1fr)_480px] lg:px-8">

        {/* ==================================================== */}
        {/* EDITOR */}
        {/* ==================================================== */}

        <section className="min-w-0">

          <div className="mb-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
              Criar experiência
            </p>

            <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
              Cria uma experiência memorável
            </h2>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
              Preenche os dados da experiência e acompanha
              imediatamente como ela ficará apresentada aos viajantes.
            </p>
          </div>

          <div className="space-y-5">

            {/* ================================================= */}
            {/* 01 IDENTIDADE */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  01
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Identidade da experiência
                </h3>
              </div>

              <label className="text-sm font-bold text-gray-800">
                Nome da experiência
              </label>

              <input
                value={form.title}
                onChange={(e) =>
                  updateField(
                    'title',
                    e.target.value,
                  )
                }
                placeholder="Ex.: Passeio de barco no Mussulo"
                className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />

              <div className="mt-5">
                <label className="text-sm font-bold text-gray-800">
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
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm font-medium outline-none transition focus:border-orange-500 focus:bg-white"
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

              <div className="mt-5">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-800">
                    Descrição
                  </label>

                  <span className="text-xs text-gray-400">
                    {form.description.length}
                  </span>
                </div>

                <textarea
                  value={form.description}
                  onChange={(e) =>
                    updateField(
                      'description',
                      e.target.value,
                    )
                  }
                  rows={7}
                  placeholder="Descreve o que o viajante irá viver, o que está incluído e o que torna esta experiência especial..."
                  className="mt-2 w-full resize-none rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm leading-7 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>
            </section>

            {/* ================================================= */}
            {/* 02 LOCALIZAÇÃO */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  02
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Localização
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-bold">
                    Província
                  </label>

                  <input
                    value={form.province}
                    onChange={(e) =>
                      updateField(
                        'province',
                        e.target.value,
                      )
                    }
                    placeholder="Ex.: Luanda"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>

                <div>
                  <label className="text-sm font-bold">
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
                    placeholder="Ex.: Luanda"
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 text-sm outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="text-sm font-bold">
                  Local específico
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    value={form.location}
                    onChange={(e) =>
                      updateField(
                        'location',
                        e.target.value,
                      )
                    }
                    placeholder="Ex.: Ilha do Mussulo, Praia do Sangano..."
                    className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-orange-500 focus:bg-white"
                  />
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* 03 DATA E HORÁRIO */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  03
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Data e horário
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Define quando esta experiência acontecerá.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">

                <div>
                  <label className="text-sm font-bold">
                    Data
                  </label>

                  <div className="relative">
                    <CalendarDays
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      min={getTodayISODate()}
                      value={form.date}
                      onChange={(e) =>
                        updateField(
                          'date',
                          e.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold">
                    Hora de início
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="time"
                      value={form.start_time}
                      onChange={(e) =>
                        updateField(
                          'start_time',
                          e.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold">
                    Hora de término
                  </label>

                  <div className="relative">
                    <Clock3
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="time"
                      value={form.end_time}
                      onChange={(e) =>
                        updateField(
                          'end_time',
                          e.target.value,
                        )
                      }
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />
                  </div>
                </div>

              </div>

              {form.date &&
                form.start_time &&
                form.end_time && (
                  <div className="mt-5 flex items-center gap-3 rounded-2xl bg-orange-50 p-4 text-sm text-orange-800">
                    <CalendarDays
                      size={18}
                      className="shrink-0"
                    />

                    <div>
                      <p className="font-black">
                        {formatDate(
                          form.date,
                        )}
                      </p>

                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-orange-700">
                        <span className="rounded-full bg-white/80 px-2.5 py-1 font-bold">
                          {form.start_time} — {form.end_time}
                        </span>

                        {calculateDurationHours(
                          form.start_time,
                          form.end_time,
                        ) > 0 && (
                          <span className="rounded-full bg-orange-500 px-2.5 py-1 font-black text-white">
                            {formatExperienceDuration(
                              calculateDurationHours(
                                form.start_time,
                                form.end_time,
                              ),
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
            </section>

            {/* ================================================= */}
            {/* 04 DETALHES */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  04
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Detalhes comerciais
                </h3>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">

                <div>
                  <label className="text-sm font-bold">
                    Preço por pessoa
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(e) =>
                        updateField(
                          'price',
                          e.target.value,
                        )
                      }
                      placeholder="0"
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-12 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />

                    <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs font-black text-gray-400">
                      Kz
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-bold">
                    Capacidade
                  </label>

                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      value={form.capacity}
                      onChange={(e) =>
                        updateField(
                          'capacity',
                          e.target.value,
                        )
                      }
                      placeholder="10"
                      className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3.5 pr-16 text-sm font-semibold outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                    />

                    <span className="absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-xs font-black text-gray-400">
                      pessoas
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 overflow-hidden rounded-2xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50">
                <div className="flex items-center justify-between gap-4 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                      <Clock3 size={19} />
                    </div>

                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-orange-600">
                        Duração automática
                      </p>
                      <p className="mt-1 text-xs text-orange-800/70">
                        Calculada pelas horas escolhidas acima
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xl font-black text-gray-950">
                      {formatExperienceDuration(
                        calculatedDurationHours,
                      )}
                    </p>
                    <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                      {form.start_time && form.end_time
                        ? `${form.start_time} → ${form.end_time}`
                        : 'Escolha início e término'}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* ================================================= */}
            {/* 05 IMAGEM */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                  05
                </p>

                <h3 className="mt-1 text-xl font-black text-gray-950">
                  Imagem de capa
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Escolhe uma imagem forte para representar a experiência.
                </p>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) =>
                  handleImageSelect(
                    e.target.files?.[0] ||
                      null,
                  )
                }
              />

              {!coverPreview ? (
                <button
                  type="button"
                  onClick={() =>
                    fileInputRef.current?.click()
                  }
                  className="group flex min-h-[230px] w-full flex-col items-center justify-center rounded-3xl border-2 border-dashed border-gray-300 bg-gray-50 px-6 transition hover:border-orange-400 hover:bg-orange-50/50"
                >
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-gray-400 shadow-sm transition group-hover:text-orange-500">
                    <Upload size={28} />
                  </div>

                  <p className="mt-5 text-sm font-black text-gray-800">
                    Escolher imagem
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    JPG, PNG ou WEBP · máximo 10 MB
                  </p>
                </button>
              ) : (
                <div className="overflow-hidden rounded-3xl border border-gray-200">

                  <div className="relative aspect-[16/8] bg-gray-100">
                    <img
                      src={coverPreview}
                      alt="Preview da experiência"
                      className="h-full w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-5 pt-16">

                      <div className="text-white">
                        <p className="text-xs font-bold opacity-80">
                          Imagem selecionada
                        </p>

                        <p className="mt-1 max-w-xs truncate text-sm font-black">
                          {coverFile?.name}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (coverPreview) {
                            URL.revokeObjectURL(
                              coverPreview,
                            )
                          }

                          setCoverPreview('')
                          setCoverFile(null)
                          setUploadedCoverUrl('')
                          setCoverError('')

                          if (
                            fileInputRef.current
                          ) {
                            fileInputRef.current.value =
                              ''
                          }
                        }}
                        className="flex h-10 w-10 items-center justify-center rounded-full bg-white/90 text-gray-900 backdrop-blur transition hover:bg-white"
                      >
                        <X size={17} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 p-4">

                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <ImageIcon size={16} />

                      <span>
                        A imagem aparecerá no cartão à direita.
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="shrink-0 rounded-xl bg-gray-100 px-3 py-2 text-xs font-black hover:bg-gray-200"
                    >
                      Alterar
                    </button>

                  </div>
                </div>
              )}

              {coverError && (
                <p className="mt-3 text-sm font-semibold text-red-600">
                  {coverError}
                </p>
              )}

              {uploadingImage && (
                <div className="mt-3 flex items-center gap-2 text-xs font-bold text-orange-600">
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                  A enviar imagem...
                </div>
              )}
            </section>

            {/* ================================================= */}
            {/* 06 MÚSICA */}
            {/* ================================================= */}

            <section className="rounded-[28px] border border-gray-200/80 bg-white p-6 shadow-sm">

              <div className="mb-6 flex items-start justify-between gap-4">

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-gray-400">
                    06
                  </p>

                  <h3 className="mt-1 text-xl font-black text-gray-950">
                    Música da experiência
                  </h3>

                  <p className="mt-1 text-sm leading-6 text-gray-500">
                    Escolhe uma música da biblioteca do Admin e define o trecho.
                  </p>
                </div>

                {selectedTrack && (
                  <button
                    type="button"
                    onClick={() => {
                      stopAudio()
                      setSelectedTrack(null)
                    }}
                    className="inline-flex items-center gap-1 rounded-xl px-3 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 hover:text-gray-900"
                  >
                    <X size={14} />
                    Remover
                  </button>
                )}
              </div>

              <div className="relative">
                <Search
                  size={18}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={musicSearch}
                  onChange={(e) =>
                    setMusicSearch(
                      e.target.value,
                    )
                  }
                  placeholder="Pesquisar música ou artista..."
                  className="w-full rounded-2xl border border-gray-200 bg-gray-50 py-3.5 pl-11 pr-4 text-sm outline-none focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-500/10"
                />
              </div>

              <div className="mt-4 max-h-[360px] space-y-2 overflow-y-auto pr-1">

                {loadingTracks ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2
                      size={22}
                      className="animate-spin text-orange-500"
                    />
                  </div>
                ) : filteredTracks.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50 p-8 text-center">
                    <Volume2
                      size={25}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm font-bold">
                      Nenhuma música encontrada
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      As músicas disponíveis são cadastradas no Admin.
                    </p>
                  </div>
                ) : (
                  filteredTracks.map(
                    (track) => {
                      const selected =
                        selectedTrack?.id ===
                        track.id

                      const playing =
                        playingTrackId ===
                        track.id

                      return (
                        <div
                          key={track.id}
                          className={`flex items-center gap-3 rounded-2xl border p-3 transition ${
                            selected
                              ? 'border-orange-300 bg-orange-50'
                              : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50'
                          }`}
                        >

                          <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-200">
                            {track.cover_url ? (
                              <img
                                src={
                                  track.cover_url
                                }
                                alt=""
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-gray-400">
                                <Volume2
                                  size={18}
                                />
                              </div>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() =>
                              selectTrack(
                                track,
                              )
                            }
                            className="min-w-0 flex-1 text-left"
                          >
                            <p className="truncate text-sm font-black">
                              {track.title}
                            </p>

                            <p className="mt-0.5 truncate text-xs text-gray-500">
                              {track.artist ||
                                'Artista desconhecido'}

                              {track.genre
                                ? ` · ${track.genre}`
                                : ''}
                            </p>
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              playTrack(
                                track,
                              )
                            }
                            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200"
                          >
                            {playing ? (
                              <Pause
                                size={16}
                                fill="currentColor"
                              />
                            ) : (
                              <Play
                                size={16}
                                fill="currentColor"
                              />
                            )}
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              selectTrack(
                                track,
                              )
                            }
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border ${
                              selected
                                ? 'border-orange-500 bg-orange-500 text-white'
                                : 'border-gray-300 bg-white text-transparent'
                            }`}
                          >
                            <Check
                              size={15}
                            />
                          </button>

                        </div>
                      )
                    },
                  )
                )}
              </div>

              {/* ================================================= */}
              {/* EDITOR DO TRECHO */}
              {/* ================================================= */}

              {selectedTrack && (
                <div className="mt-6 overflow-hidden rounded-3xl bg-gray-950 p-5 text-white">

                  <div className="flex items-center gap-3">

                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-800">
                      {selectedTrack.cover_url ? (
                        <img
                          src={
                            selectedTrack.cover_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Volume2 size={20} />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate font-black">
                        {selectedTrack.title}
                      </p>

                      <p className="mt-1 truncate text-xs text-gray-400">
                        {selectedTrack.artist ||
                          'Artista desconhecido'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        playTrack(
                          selectedTrack,
                        )
                      }
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white hover:bg-orange-600"
                    >
                      {playingTrackId ===
                      selectedTrack.id ? (
                        <Pause
                          size={17}
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          size={17}
                          fill="currentColor"
                        />
                      )}
                    </button>

                  </div>

                  {/* TIMELINE */}
                  <div className="mt-7">

                    <div className="relative h-3 rounded-full bg-gray-700">

                      <div
                        className="absolute top-0 h-3 rounded-full bg-orange-500/30"
                        style={{
                          left: `${musicStartPercent}%`,
                          width: `${musicWidthPercent}%`,
                        }}
                      />

                      <div
                        className="absolute top-0 z-10 h-3 rounded-full bg-orange-500"
                        style={{
                          left: `${musicStartPercent}%`,
                          width: `${musicWidthPercent}%`,
                        }}
                      />

                      <input
                        type="range"
                        min="0"
                        max={musicTotal}
                        step="1"
                        value={musicStart}
                        onChange={(e) =>
                          changeMusicStart(
                            Number(
                              e.target.value,
                            ),
                          )
                        }
                        className="absolute inset-0 z-20 h-3 w-full cursor-pointer opacity-0"
                      />
                    </div>

                    <div className="mt-2 flex justify-between text-[10px] font-bold text-gray-500">
                      <span>
                        {formatTime(
                          musicStart,
                        )}
                      </span>

                      <span>
                        {formatTime(
                          musicTotal,
                        )}
                      </span>
                    </div>
                  </div>

                  {/* DURAÇÃO */}
                  <div className="mt-6">

                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-gray-400">
                        Tamanho do trecho
                      </label>

                      <span className="text-sm font-black text-orange-400">
                        {formatTime(
                          musicDuration,
                        )}
                      </span>
                    </div>

                    <input
                      type="range"
                      min="1"
                      max={Math.max(
                        1,
                        musicTotal -
                          musicStart,
                      )}
                      step="1"
                      value={musicDuration}
                      onChange={(e) =>
                        changeMusicDuration(
                          Number(
                            e.target.value,
                          ),
                        )
                      }
                      className="mt-3 w-full accent-orange-500"
                    />
                  </div>

                  {/* DADOS */}
                  <div className="mt-5 grid grid-cols-2 gap-3">

                    <div className="rounded-2xl bg-gray-900 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Começa em
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {formatTime(
                          musicStart,
                        )}
                      </p>
                    </div>

                    <div className="rounded-2xl bg-gray-900 p-3">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                        Duração
                      </p>

                      <p className="mt-1 text-lg font-black">
                        {formatTime(
                          musicDuration,
                        )}
                      </p>
                    </div>

                  </div>

                  <p className="mt-5 text-xs leading-5 text-gray-500">
                    O trecho escolhido será guardado na experiência
                    e usado quando o viajante visualizar a música.
                  </p>

                </div>
              )}
            </section>

            {/* ================================================= */}
            {/* MENSAGEM */}
            {/* ================================================= */}

            {message && (
              <div
                className={`rounded-2xl border px-5 py-4 text-sm font-semibold ${
                  messageType ===
                  'success'
                    ? 'border-green-100 bg-green-50 text-green-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}

            {/* ================================================= */}
            {/* FINAL */}
            {/* ================================================= */}

            <button
              type="button"
              onClick={createExperience}
              disabled={
                saving ||
                uploadingImage
              }
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-6 py-4 text-sm font-black text-white shadow-xl shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saving ? (
                <>
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                  A criar experiência...
                </>
              ) : (
                <>
                  <Check size={19} />
                  Criar experiência
                </>
              )}
            </button>

          </div>
        </section>

        {/* ==================================================== */}
        {/* PREVIEW */}
        {/* ==================================================== */}

        <aside className="lg:sticky lg:top-24 lg:h-fit">

          <div className="mb-4 flex items-center justify-between">

            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-orange-500">
                Pré-visualização
              </p>

              <h2 className="mt-1 text-xl font-black">
                Vista do viajante
              </h2>
            </div>

            <span className="rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-700">
              Ao vivo
            </span>

          </div>

          <div className="overflow-hidden rounded-[30px] border border-gray-200 bg-white shadow-2xl shadow-gray-200/60">

            {/* CAPA */}

            <div className="relative h-[290px] overflow-hidden bg-gray-100">

              {previewImage ? (
                <img
                  src={previewImage}
                  alt={previewTitle}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 text-gray-400">
                  <ImageIcon
                    size={44}
                    strokeWidth={1.5}
                  />

                  <p className="mt-3 text-xs font-semibold">
                    A imagem aparecerá aqui
                  </p>
                </div>
              )}

              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-5 pt-24">

                <span className="inline-flex rounded-full bg-white px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gray-900">
                  {form.category}
                </span>

              </div>
            </div>

            {/* CONTEÚDO */}

            <div className="p-6">

              <div className="flex items-start justify-between gap-4">

                <div className="min-w-0">

                  <h3 className="text-2xl font-black leading-tight text-gray-950">
                    {previewTitle}
                  </h3>

                  <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">
                    <MapPin
                      size={16}
                      className="shrink-0"
                    />

                    <span className="truncate">
                      {previewLocation}
                    </span>
                  </div>

                </div>

                <div className="flex shrink-0 items-center gap-1 text-sm font-bold">
                  <Star
                    size={16}
                    className="fill-orange-500 text-orange-500"
                  />

                  <span>Nova</span>
                </div>

              </div>

              {/* DATA */}

              {form.date && (
                <div className="mt-5 flex items-center gap-3 rounded-2xl bg-orange-50 p-3.5">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-orange-500 shadow-sm">
                    <CalendarDays size={18} />
                  </div>

                  <div>
                    <p className="text-xs font-black text-gray-900">
                      {formatDate(
                        form.date,
                      )}
                    </p>

                    {form.start_time &&
                      form.end_time && (
                        <p className="mt-0.5 text-[11px] font-medium text-gray-500">
                          {form.start_time} —{' '}
                          {form.end_time}
                        </p>
                      )}
                  </div>

                </div>
              )}

              {/* DESCRIÇÃO */}

              <p className="mt-5 line-clamp-3 text-sm leading-6 text-gray-500">
                {form.description.trim() ||
                  'A descrição da experiência aparecerá aqui enquanto preenches o formulário.'}
              </p>

              {/* INFORMAÇÕES */}

              <div className="mt-5 grid grid-cols-3 gap-2">

                <div className="rounded-2xl bg-gray-50 p-3">

                  <Clock3
                    size={17}
                    className="text-orange-500"
                  />

                  <p className="mt-2 text-[10px] text-gray-400">
                    Duração
                  </p>

                  <p className="mt-0.5 text-xs font-black">
                    {previewDuration
                      ? `${previewDuration}h`
                      : '—'}
                  </p>

                </div>

                <div className="rounded-2xl bg-gray-50 p-3">

                  <Users
                    size={17}
                    className="text-orange-500"
                  />

                  <p className="mt-2 text-[10px] text-gray-400">
                    Pessoas
                  </p>

                  <p className="mt-0.5 text-xs font-black">
                    {previewCapacity ||
                      '—'}
                  </p>

                </div>

                <div className="rounded-2xl bg-gray-50 p-3">

                  <MapPin
                    size={17}
                    className="text-orange-500"
                  />

                  <p className="mt-2 text-[10px] text-gray-400">
                    Província
                  </p>

                  <p className="mt-0.5 truncate text-xs font-black">
                    {form.province ||
                      '—'}
                  </p>

                </div>

              </div>

              {/* PREÇO */}

              <div className="mt-6 border-t border-gray-100 pt-5">

                <p className="text-xs text-gray-400">
                  A partir de
                </p>

                <div className="mt-1 flex items-end justify-between gap-4">

                  <div>

                    <span className="text-2xl font-black">
                      {previewPrice
                        ? `${previewPrice.toLocaleString(
                            'pt-AO',
                          )} Kz`
                        : '0 Kz'}
                    </span>

                    <span className="ml-1 text-xs text-gray-400">
                      / pessoa
                    </span>

                  </div>

                  <span className="rounded-xl bg-orange-50 px-3 py-2 text-xs font-bold text-orange-600">
                    Reservar
                  </span>

                </div>
              </div>

              {/* MÚSICA */}

              {selectedTrack && (
                <div className="mt-5 overflow-hidden rounded-2xl bg-gray-950">

                  <div className="flex items-center gap-3 p-3">

                    <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-gray-800">

                      {selectedTrack.cover_url ? (
                        <img
                          src={
                            selectedTrack.cover_url
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-gray-500">
                          <Volume2
                            size={17}
                          />
                        </div>
                      )}

                    </div>

                    <div className="min-w-0 flex-1 text-white">

                      <p className="truncate text-xs font-black">
                        {selectedTrack.title}
                      </p>

                      <p className="mt-0.5 truncate text-[10px] text-gray-400">
                        {selectedTrack.artist ||
                          'Artista'}
                      </p>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        playTrack(
                          selectedTrack,
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-white text-gray-950"
                    >
                      {playingTrackId ===
                      selectedTrack.id ? (
                        <Pause
                          size={14}
                          fill="currentColor"
                        />
                      ) : (
                        <Play
                          size={14}
                          fill="currentColor"
                        />
                      )}
                    </button>

                  </div>

                  <div className="h-1 bg-gray-800">

                    <div
                      className="h-full bg-orange-500 transition-all"
                      style={{
                        width: `${musicPlaybackPercent}%`,
                      }}
                    />

                  </div>

                  <div className="flex justify-between px-3 py-2 text-[9px] font-bold text-gray-500">

                    <span>
                      {formatTime(
                        musicStart,
                      )}
                    </span>

                    <span>
                      {formatTime(
                        musicStart +
                          musicDuration,
                      )}
                    </span>

                  </div>

                </div>
              )}

            </div>
          </div>

          {/* STATUS */}

          <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">

            <div className="flex items-center gap-3">

              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-50 text-orange-500">
                <Check size={17} />
              </div>

              <div>
                <p className="text-xs font-black">
                  Rascunho
                </p>

                <p className="mt-0.5 text-[11px] text-gray-500">
                  Depois de criar, poderás completar e enviar para revisão.
                </p>
              </div>

            </div>
          </div>

        </aside>
      </div>
    </main>
  )
}