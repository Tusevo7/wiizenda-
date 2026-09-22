'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  CalendarDays,
  Camera,
  Check,
  ChevronDown,
  Clock3,
  Image as ImageIcon,
  Loader2,
  MapPin,
  Music2,
  Pause,
  Play,
  Search,
  Sparkles,
  Users,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

const MUSIC_CLIP_DURATION = 30

type MusicTrack = {
  id: string
  title: string
  artist: string
  genre: string | null
  audio_url: string
  cover_url: string | null
  duration_seconds: number | null
  preview_start_seconds: number | null
  preview_duration_seconds: number | null
  license_type: string | null
  is_active: boolean
}

function getLuandaDate() {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date())
}

function getLuandaNow() {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Africa/Luanda',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(new Date())

  const values: Record<string, string> = {}

  parts.forEach((part) => {
    if (part.type !== 'literal') {
      values[part.type] = part.value
    }
  })

  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}`
}

function toLuandaDate(value: string) {
  if (!value) return ''

  const date = new Date(`${value}T12:00:00`)

  return new Intl.DateTimeFormat('pt-AO', {
    timeZone: 'Africa/Luanda',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date)
}

function formatDuration(hours: number) {
  if (!hours || hours <= 0) return '—'

  if (hours === 1) return '1 hora'

  return `${hours} horas`
}

function formatMusicDuration(seconds: number | null | undefined) {
  if (
    seconds === null ||
    seconds === undefined ||
    Number.isNaN(seconds)
  ) {
    return '0:00'
  }

  const safeSeconds = Math.max(0, Math.floor(seconds))
  const minutes = Math.floor(safeSeconds / 60)
  const remaining = safeSeconds % 60

  return `${minutes}:${remaining.toString().padStart(2, '0')}`
}

export default function NewExperiencePage() {
  const router = useRouter()
  const supabase = createClient()

  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Timeline da música
  const musicTimelineRef =
    useRef<HTMLDivElement | null>(null)

  const draggingMusicClipRef =
    useRef(false)

  const dragPointerOffsetRef =
    useRef(0)

  const dragStartXRef =
    useRef(0)

  const dragInitialStartRef =
    useRef(0)

  const [loading, setLoading] = useState(false)

  const [uploadingImage, setUploadingImage] =
    useState(false)

  const [loadingMusic, setLoadingMusic] =
    useState(true)

  const [message, setMessage] =
    useState('')

  const [imageFile, setImageFile] =
    useState<File | null>(null)

  const [imagePreview, setImagePreview] =
    useState('')

  const [minDate, setMinDate] =
    useState('')

  const [nowLuanda, setNowLuanda] =
    useState('')

  // =====================================================
  // MÚSICA
  // =====================================================

  const [musicOpen, setMusicOpen] =
    useState(false)

  const [musicSearch, setMusicSearch] =
    useState('')

  const [musicGenre, setMusicGenre] =
    useState('Todos')

  const [musicLibrary, setMusicLibrary] =
    useState<MusicTrack[]>([])

  const [selectedMusic, setSelectedMusic] =
    useState<MusicTrack | null>(null)

  const [playingMusic, setPlayingMusic] =
    useState<string | null>(null)

  const [musicStartSeconds, setMusicStartSeconds] =
    useState(0)

  // =====================================================
  // FORMULÁRIO
  // =====================================================

  const [title, setTitle] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [category, setCategory] =
    useState('')

  const [province, setProvince] =
    useState('')

  const [city, setCity] =
    useState('')

  const [location, setLocation] =
    useState('')

  const [price, setPrice] =
    useState('')

  const [capacity, setCapacity] =
    useState('')

  const [activityStartDate, setActivityStartDate] =
    useState('')

  const [activityStartTime, setActivityStartTime] =
    useState('')

  const [activityEndDate, setActivityEndDate] =
    useState('')

  const [activityEndTime, setActivityEndTime] =
    useState('')

  // =====================================================
  // FUNÇÕES DE MÚSICA
  // =====================================================

  function getClipDuration(music: MusicTrack) {
    const total =
      Number(music.duration_seconds ?? 0)

    if (!total || total <= 0) {
      return MUSIC_CLIP_DURATION
    }

    return Math.min(
      MUSIC_CLIP_DURATION,
      total,
    )
  }

  function getMaxStartSeconds(music: MusicTrack) {
    const total =
      Number(music.duration_seconds ?? 0)

    if (!total || total <= 0) {
      return 0
    }

    const clip =
      getClipDuration(music)

    return Math.max(
      0,
      total - clip,
    )
  }

  function clampMusicStart(
    music: MusicTrack,
    value: number,
  ) {
    const max =
      getMaxStartSeconds(music)

    return Math.min(
      Math.max(0, value),
      max,
    )
  }

  // =====================================================
  // CARREGAR CATÁLOGO
  // =====================================================

  async function loadMusic() {
    setLoadingMusic(true)

    try {
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
            license_type,
            is_active
          `)
          .eq('is_active', true)
          .order('title', {
            ascending: true,
          })

      console.log(
        'CATÁLOGO DE MÚSICAS:',
        data,
      )

      console.log(
        'ERRO DO CATÁLOGO:',
        error,
      )

      if (error) {
        throw new Error(
          `Catálogo de músicas: ${error.message}`,
        )
      }

      setMusicLibrary(
        (data ?? []) as MusicTrack[],
      )
    } catch (error: any) {
      console.error(
        'ERRO AO CARREGAR CATÁLOGO:',
        error,
      )

      setMusicLibrary([])

      setMessage(
        error?.message ||
          'Não foi possível carregar o catálogo de músicas.',
      )
    } finally {
      setLoadingMusic(false)
    }
  }

  useEffect(() => {
    setMinDate(
      getLuandaDate(),
    )

    setNowLuanda(
      getLuandaNow(),
    )

    loadMusic()

    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ''
        audioRef.current = null
      }
    }
  }, [])

  // =====================================================
  // GÉNEROS
  // =====================================================

  const musicGenres = useMemo(() => {
    const genres =
      musicLibrary
        .map(
          (music) =>
            music.genre,
        )
        .filter(Boolean) as string[]

    return [
      'Todos',
      ...Array.from(
        new Set(genres),
      ),
    ]
  }, [musicLibrary])

  // =====================================================
  // FILTRO
  // =====================================================

  const filteredMusic = useMemo(() => {
    const search =
      musicSearch
        .trim()
        .toLowerCase()

    return musicLibrary.filter(
      (music) => {
        const matchesGenre =
          musicGenre === 'Todos' ||
          music.genre === musicGenre

        const searchableText = `
          ${music.title}
          ${music.artist}
          ${music.genre ?? ''}
        `.toLowerCase()

        const matchesSearch =
          !search ||
          searchableText.includes(
            search,
          )

        return (
          matchesGenre &&
          matchesSearch
        )
      },
    )
  }, [
    musicLibrary,
    musicSearch,
    musicGenre,
  ])

  // =====================================================
  // PARAR PREVIEW
  // =====================================================

  function stopMusicPreview() {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
      audioRef.current.src = ''
      audioRef.current = null
    }

    setPlayingMusic(null)
  }

  // =====================================================
  // REPRODUZIR TRECHO
  // =====================================================

  async function playMusicClip(
    music: MusicTrack,
    requestedStart?: number,
  ) {
    stopMusicPreview()

    const audio =
      new Audio()

    audio.preload =
      'metadata'

    audioRef.current =
      audio

    const start =
      clampMusicStart(
        music,
        requestedStart ??
          music.preview_start_seconds ??
          0,
      )

    const clipDuration =
      getClipDuration(music)

    const end =
      start + clipDuration

    const handleTimeUpdate =
      () => {
        if (
          audio.currentTime >=
          end
        ) {
          audio.pause()

          audio.currentTime =
            start

          setPlayingMusic(
            null,
          )
        }
      }

    const handleEnded =
      () => {
        setPlayingMusic(
          null,
        )
      }

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate,
    )

    audio.addEventListener(
      'ended',
      handleEnded,
    )

    try {
      await new Promise<void>(
        (
          resolve,
          reject,
        ) => {
          const handleLoadedMetadata =
            () => {
              audio.currentTime =
                start

              resolve()
            }

          const handleError =
            () => {
              reject(
                new Error(
                  'Não foi possível carregar o áudio.',
                ),
              )
            }

          audio.addEventListener(
            'loadedmetadata',
            handleLoadedMetadata,
            {
              once: true,
            },
          )

          audio.addEventListener(
            'error',
            handleError,
            {
              once: true,
            },
          )

          audio.src =
            music.audio_url

          audio.load()
        },
      )

      await audio.play()

      setPlayingMusic(
        music.id,
      )
    } catch (error) {
      console.error(
        'Erro ao reproduzir música:',
        error,
      )

      setPlayingMusic(
        null,
      )

      setMessage(
        'Não foi possível reproduzir esta música. Verifique o arquivo de áudio no Supabase Storage.',
      )
    }
  }

  // =====================================================
  // PLAY / PAUSE DA LISTA
  // =====================================================

  async function toggleMusicPreview(
    music: MusicTrack,
  ) {
    if (
      playingMusic ===
      music.id
    ) {
      stopMusicPreview()
      return
    }

    const start =
      selectedMusic?.id ===
      music.id
        ? musicStartSeconds
        : music.preview_start_seconds ??
          0

    await playMusicClip(
      music,
      start,
    )
  }

  // =====================================================
  // SELECIONAR MÚSICA
  // =====================================================

  function selectMusic(
    music: MusicTrack,
  ) {
    stopMusicPreview()

    setSelectedMusic(
      music,
    )

    const maxStart =
      getMaxStartSeconds(
        music,
      )

    const suggestedStart =
      Math.min(
        Math.max(
          0,
          music.preview_start_seconds ??
            0,
        ),
        maxStart,
      )

    setMusicStartSeconds(
      suggestedStart,
    )

    setMusicOpen(
      false,
    )

    setMessage('')
  }

  // =====================================================
  // OUVIR TRECHO ESCOLHIDO
  // =====================================================

  async function previewSelectedMusic() {
    if (!selectedMusic) {
      return
    }

    if (
      playingMusic ===
      selectedMusic.id
    ) {
      stopMusicPreview()
      return
    }

    await playMusicClip(
      selectedMusic,
      musicStartSeconds,
    )
  }

  // =====================================================
  // POSICIONAR TRECHO NA TIMELINE
  // =====================================================

  function setMusicStartFromPointer(
    clientX: number,
    keepCentered = true,
  ) {
    if (
      !selectedMusic ||
      !musicTimelineRef.current
    ) {
      return
    }

    const rect =
      musicTimelineRef.current.getBoundingClientRect()

    const width =
      rect.width

    if (width <= 0) {
      return
    }

    const total =
      Number(
        selectedMusic.duration_seconds ??
          0,
      )

    const maxStart =
      getMaxStartSeconds(
        selectedMusic,
      )

    if (
      total <= 0 ||
      maxStart <= 0
    ) {
      setMusicStartSeconds(0)
      return
    }

    const percentage =
      Math.min(
        1,
        Math.max(
          0,
          (clientX -
            rect.left) /
            width,
        ),
      )

    let newStart =
      percentage *
      total

    if (keepCentered) {
      newStart -=
        getClipDuration(
          selectedMusic,
        ) / 2
    }

    setMusicStartSeconds(
      clampMusicStart(
        selectedMusic,
        newStart,
      ),
    )
  }

  // =====================================================
  // CLIQUE NA TIMELINE
  // =====================================================

  function handleTimelineClick(
    event: React.MouseEvent<HTMLDivElement>,
  ) {
    if (
      draggingMusicClipRef.current
    ) {
      return
    }

    stopMusicPreview()

    setMusicStartFromPointer(
      event.clientX,
      true,
    )
  }

  // =====================================================
  // COMEÇAR ARRASTO
  // =====================================================

  function handleClipPointerDown(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (!selectedMusic) {
      return
    }

    const rect =
      musicTimelineRef.current?.getBoundingClientRect()

    if (!rect) {
      return
    }

    const total =
      Number(
        selectedMusic.duration_seconds ??
          0,
      )

    const maxStart =
      getMaxStartSeconds(
        selectedMusic,
      )

    if (
      total <= 0 ||
      maxStart <= 0
    ) {
      return
    }

    const clipDuration =
      getClipDuration(
        selectedMusic,
      )

    const startPercentage =
      musicStartSeconds /
      total

    const clipPercentage =
      clipDuration /
      total

    const clipLeft =
      rect.left +
      startPercentage *
        rect.width

    const clipWidth =
      clipPercentage *
      rect.width

    const pointerInside =
      event.clientX -
      clipLeft

    dragPointerOffsetRef.current =
      Math.min(
        clipWidth,
        Math.max(
          0,
          pointerInside,
        ),
      )

    dragStartXRef.current =
      event.clientX

    dragInitialStartRef.current =
      musicStartSeconds

    draggingMusicClipRef.current =
      true

    try {
      event.currentTarget.setPointerCapture(
        event.pointerId,
      )
    } catch {
      // Alguns browsers podem não suportar capture.
    }

    stopMusicPreview()
  }

  // =====================================================
  // ARRASTAR TRECHO
  // =====================================================

  function handleClipPointerMove(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    if (
      !draggingMusicClipRef.current ||
      !selectedMusic ||
      !musicTimelineRef.current
    ) {
      return
    }

    const rect =
      musicTimelineRef.current.getBoundingClientRect()

    const totalDuration =
      Number(
        selectedMusic.duration_seconds ??
          getClipDuration(
            selectedMusic,
          ),
      )

    if (
      rect.width <= 0 ||
      totalDuration <= 0
    ) {
      return
    }

    const deltaX =
      event.clientX -
      dragStartXRef.current

    const secondsPerPixel =
      totalDuration /
      rect.width

    const deltaSeconds =
      deltaX *
      secondsPerPixel

    const newStart =
      dragInitialStartRef.current +
      deltaSeconds

    setMusicStartSeconds(
      clampMusicStart(
        selectedMusic,
        newStart,
      ),
    )
  }

  // =====================================================
  // TERMINAR ARRASTO
  // =====================================================

  function handleClipPointerUp(
    event: React.PointerEvent<HTMLDivElement>,
  ) {
    draggingMusicClipRef.current =
      false

    try {
      event.currentTarget.releasePointerCapture(
        event.pointerId,
      )
    } catch {
      // Ignorar quando não houver capture.
    }
  }

  // =====================================================
  // IMAGEM
  // =====================================================

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    if (!file) {
      return
    }

    if (
      !file.type.startsWith(
        'image/',
      )
    ) {
      setMessage(
        'Selecione uma imagem válida.',
      )
      return
    }

    if (
      file.size >
      8 * 1024 * 1024
    ) {
      setMessage(
        'A imagem deve ter no máximo 8 MB.',
      )
      return
    }

    setImageFile(
      file,
    )

    setImagePreview(
      URL.createObjectURL(
        file,
      ),
    )

    setMessage('')
  }

  // =====================================================
  // VALIDAÇÃO DO HORÁRIO
  // =====================================================

  function validateSchedule() {
    if (
      !activityStartDate ||
      !activityStartTime ||
      !activityEndDate ||
      !activityEndTime
    ) {
      return 'Preencha a data e horário de início e fim.'
    }

    const start =
      new Date(
        `${activityStartDate}T${activityStartTime}`,
      )

    const end =
      new Date(
        `${activityEndDate}T${activityEndTime}`,
      )

    const now =
      new Date()

    if (start <= now) {
      return 'A experiência deve começar no futuro.'
    }

    if (end <= start) {
      return 'O horário de fim deve ser posterior ao início.'
    }

    const difference =
      end.getTime() -
      start.getTime()

    if (
      difference <
      30 * 60 * 1000
    ) {
      return 'A experiência deve durar pelo menos 30 minutos.'
    }

    return null
  }

  // =====================================================
  // UPLOAD
  // =====================================================

  async function uploadImage(
    file: File,
    agencyId: string,
    userId: string,
  ) {
    const extension =
      file.name.split('.').pop() ||
      'jpg'

    const fileName =
      `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${extension}`

    const path =
      `${agencyId}/${userId}/${fileName}`

    const { error } =
      await supabase.storage
        .from(
          'experience-media',
        )
        .upload(
          path,
          file,
          {
            cacheControl:
              '3600',
            upsert: false,
          },
        )

    if (error) {
      throw error
    }

    const { data } =
      supabase.storage
        .from(
          'experience-media',
        )
        .getPublicUrl(
          path,
        )

    return data.publicUrl
  }

  // =====================================================
  // PUBLICAR
  // =====================================================

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (loading) {
      return
    }

    setMessage('')

    try {
      setLoading(true)

      const {
        data: {
          user,
        },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (
        userError ||
        !user
      ) {
        throw new Error(
          'Sessão expirada. Faça login novamente.',
        )
      }

      const {
        data: agency,
        error: agencyError,
      } =
        await supabase
          .from('agencies')
          .select(
            'id, is_verified',
          )
          .eq(
            'owner_id',
            user.id,
          )
          .maybeSingle()

      if (agencyError) {
        throw agencyError
      }

      if (!agency) {
        throw new Error(
          'Não encontramos uma agência associada à sua conta.',
        )
      }

      const scheduleError =
        validateSchedule()

      if (scheduleError) {
        throw new Error(
          scheduleError,
        )
      }

      if (!title.trim()) {
        throw new Error(
          'Digite o título da experiência.',
        )
      }

      if (!description.trim()) {
        throw new Error(
          'Digite uma descrição.',
        )
      }

      if (!category) {
        throw new Error(
          'Selecione uma categoria.',
        )
      }

      if (!province.trim()) {
        throw new Error(
          'Informe a província.',
        )
      }

      if (!city.trim()) {
        throw new Error(
          'Informe a cidade.',
        )
      }

      if (!location.trim()) {
        throw new Error(
          'Informe o local da experiência.',
        )
      }

      if (
        !price ||
        Number(price) < 0
      ) {
        throw new Error(
          'Informe um preço válido.',
        )
      }

      if (
        !capacity ||
        Number(capacity) <= 0
      ) {
        throw new Error(
          'Informe uma capacidade válida.',
        )
      }

      let coverImage = ''

      if (imageFile) {
        setUploadingImage(
          true,
        )

        coverImage =
          await uploadImage(
            imageFile,
            agency.id,
            user.id,
          )

        setUploadingImage(
          false,
        )
      }

      const start =
        new Date(
          `${activityStartDate}T${activityStartTime}`,
        )

      const end =
        new Date(
          `${activityEndDate}T${activityEndTime}`,
        )

      const durationHours =
        (end.getTime() -
          start.getTime()) /
        (1000 * 60 * 60)

      const cleanTitle =
        title.trim()

      const slug =
        `${cleanTitle
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
            /^-|-$/g,
            '',
          )}-${Date.now()}`

      // =================================================
      // DADOS DA MÚSICA
      // =================================================

      const musicData =
        selectedMusic
          ? {
              music_title:
                selectedMusic.title,

              music_artist:
                selectedMusic.artist,

              music_url:
                selectedMusic.audio_url,

              music_start_seconds:
                Math.round(
                  musicStartSeconds,
                ),

              music_duration_seconds:
                getClipDuration(
                  selectedMusic,
                ),
            }
          : {
              music_title:
                null,

              music_artist:
                null,

              music_url:
                null,

              music_start_seconds:
                null,

              music_duration_seconds:
                null,
            }

      // =================================================
      // INSERIR EXPERIÊNCIA
      // =================================================

      const {
        error: insertError,
      } =
        await supabase
          .from('experiences')
          .insert({
            agency_id:
              agency.id,

            title:
              cleanTitle,

            slug,

            description:
              description.trim(),

            category,

            province:
              province.trim(),

            city:
              city.trim(),

            location:
              location.trim(),

            price:
              Number(price),

            duration_hours:
              Number(
                durationHours.toFixed(
                  2,
                ),
              ),

            capacity:
              Number(capacity),

            cover_image:
              coverImage ||
              null,

            activity_start_at:
              start.toISOString(),

            activity_end_at:
              end.toISOString(),

            ...musicData,
          })

      if (insertError) {
        throw insertError
      }

      router.push(
        '/agency',
      )
    } catch (error: any) {
      console.error(
        error,
      )

      setUploadingImage(
        false,
      )

      setMessage(
        error?.message ||
          'Não foi possível publicar a experiência.',
      )
    } finally {
      setLoading(
        false,
      )
    }
  }

  // =====================================================
  // PREVIEW
  // =====================================================

  const previewDate =
    activityStartDate
      ? toLuandaDate(
          activityStartDate,
        )
      : 'Data da experiência'

  const previewDuration =
    activityStartDate &&
    activityStartTime &&
    activityEndDate &&
    activityEndTime
      ? (() => {
          const start =
            new Date(
              `${activityStartDate}T${activityStartTime}`,
            )

          const end =
            new Date(
              `${activityEndDate}T${activityEndTime}`,
            )

          const hours =
            (end.getTime() -
              start.getTime()) /
            (1000 * 60 * 60)

          return hours > 0
            ? formatDuration(
                Number(
                  hours.toFixed(
                    2,
                  ),
                ),
              )
            : 'Duração'
        })()
      : 'Duração'

  const selectedMusicClipEnd =
    selectedMusic
      ? musicStartSeconds +
        getClipDuration(
          selectedMusic,
        )
      : 0

  const selectedMusicTotal =
    selectedMusic
      ? Number(
          selectedMusic.duration_seconds ??
            0,
        )
      : 0

  const selectedMusicClipWidth =
    selectedMusic &&
    selectedMusicTotal > 0
      ? Math.min(
          100,
          (getClipDuration(
            selectedMusic,
          ) /
            selectedMusicTotal) *
            100,
        )
      : 100

  const selectedMusicClipLeft =
    selectedMusic &&
    selectedMusicTotal > 0
      ? Math.min(
          100 -
            selectedMusicClipWidth,
          Math.max(
            0,
            (musicStartSeconds /
              selectedMusicTotal) *
              100,
          ),
        )
      : 0

  // =====================================================
  // WAVEFORM
  // =====================================================

  const waveformBars = useMemo(() => {
    const bars: number[] = []

    for (
      let i = 0;
      i < 90;
      i++
    ) {
      const value =
        Math.abs(
          Math.sin(
            i * 1.37,
          ) *
            0.55 +
            Math.sin(
              i * 0.47,
            ) *
              0.3 +
            Math.cos(
              i * 2.17,
            ) *
              0.15,
        )

      bars.push(
        Math.round(
          20 +
            value * 70,
        ),
      )
    }

    return bars
  }, [])

  return (
    <div className="min-h-screen bg-[#f6f7f9] text-[#111827]">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="sticky top-0 z-40 border-b border-gray-200 bg-white/95 backdrop-blur">

        <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-4 sm:px-6 lg:px-8">

          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="flex items-center gap-2 text-sm font-medium text-gray-600 transition hover:text-black"
          >
            <ArrowLeft
              size={18}
            />

            Voltar
          </button>

          <div className="flex items-center gap-2">

            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-black text-white">
              <Sparkles
                size={17}
              />
            </div>

            <div>
              <p className="text-sm font-bold tracking-tight">
                Nova experiência
              </p>

              <p className="hidden text-[11px] text-gray-500 sm:block">
                Crie algo inesquecível
              </p>
            </div>

          </div>

          <div className="hidden items-center gap-2 rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 sm:flex">

            <span className="h-2 w-2 rounded-full bg-green-500" />

            Modo agência

          </div>

        </div>

      </header>

      {/* ================================================= */}
      {/* MAIN */}
      {/* ================================================= */}

      <main className="mx-auto max-w-[1500px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_430px]">

          {/* ================================================= */}
          {/* ESQUERDA */}
          {/* ================================================= */}

          <form
            onSubmit={
              handleSubmit
            }
            className="min-w-0"
          >

            {/* INTRO */}

            <div className="mb-8">

              <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-gray-400">
                Publicar
              </p>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Crie uma nova experiência
              </h1>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500">
                Apresente aos viajantes uma experiência que merece ser descoberta.
              </p>

            </div>

            {/* ================================================= */}
            {/* 01 */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  01
                </div>

                <div>
                  <h2 className="font-bold">
                    Informações principais
                  </h2>

                  <p className="text-xs text-gray-500">
                    Dê personalidade à sua experiência.
                  </p>
                </div>

              </div>

              <div className="space-y-5">

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Título
                  </label>

                  <input
                    value={title}
                    onChange={(e) =>
                      setTitle(
                        e.target.value,
                      )
                    }
                    placeholder="Ex.: Pôr do sol inesquecível na Ilha"
                    maxLength={100}
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
                  />

                  <div className="mt-1 text-right text-[11px] text-gray-400">
                    {title.length}/100
                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Descrição
                  </label>

                  <textarea
                    value={
                      description
                    }
                    onChange={(e) =>
                      setDescription(
                        e.target.value,
                      )
                    }
                    placeholder="Conte aos viajantes o que torna esta experiência especial..."
                    rows={6}
                    maxLength={1000}
                    className="w-full resize-none rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm leading-6 outline-none transition focus:border-black focus:bg-white"
                  />

                  <div className="mt-1 text-right text-[11px] text-gray-400">
                    {description.length}/1000
                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Categoria
                  </label>

                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">

                    {categories.map(
                      (item) => (

                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            setCategory(
                              item,
                            )
                          }
                          className={`rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                            category ===
                            item
                              ? 'border-black bg-black text-white'
                              : 'border-gray-200 bg-gray-50 text-gray-600 hover:border-gray-400'
                          }`}
                        >
                          {item}
                        </button>

                      ),
                    )}

                  </div>

                </div>

              </div>

            </section>

            {/* ================================================= */}
            {/* 02 */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  02
                </div>

                <div>
                  <h2 className="font-bold">
                    Localização
                  </h2>

                  <p className="text-xs text-gray-500">
                    Onde acontece a experiência?
                  </p>
                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Província
                  </label>

                  <input
                    value={
                      province
                    }
                    onChange={(e) =>
                      setProvince(
                        e.target.value,
                      )
                    }
                    placeholder="Ex.: Luanda"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Cidade
                  </label>

                  <input
                    value={city}
                    onChange={(e) =>
                      setCity(
                        e.target.value,
                      )
                    }
                    placeholder="Ex.: Luanda"
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none transition focus:border-black focus:bg-white"
                  />

                </div>

                <div className="sm:col-span-2">

                  <label className="mb-2 block text-sm font-semibold">
                    Local
                  </label>

                  <div className="relative">

                    <MapPin
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      value={
                        location
                      }
                      onChange={(e) =>
                        setLocation(
                          e.target.value,
                        )
                      }
                      placeholder="Ex.: Ilha de Luanda"
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* ================================================= */}
            {/* 03 */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  03
                </div>

                <div>
                  <h2 className="font-bold">
                    Data e horário
                  </h2>

                  <p className="text-xs text-gray-500">
                    Defina quando a experiência acontece.
                  </p>
                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Início — data
                  </label>

                  <div className="relative">

                    <CalendarDays
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="date"
                      min={
                        minDate
                      }
                      value={
                        activityStartDate
                      }
                      onChange={(e) =>
                        setActivityStartDate(
                          e.target.value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-black focus:bg-white"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Início — hora
                  </label>

                  <div className="relative">

                    <Clock3
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="time"
                      value={
                        activityStartTime
                      }
                      onChange={(e) =>
                        setActivityStartTime(
                          e.target.value,
                        )
                      }
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-black focus:bg-white"
                    />

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Fim — data
                  </label>

                  <input
                    type="date"
                    min={
                      activityStartDate ||
                      minDate
                    }
                    value={
                      activityEndDate
                    }
                    onChange={(e) =>
                      setActivityEndDate(
                        e.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Fim — hora
                  </label>

                  <input
                    type="time"
                    value={
                      activityEndTime
                    }
                    onChange={(e) =>
                      setActivityEndTime(
                        e.target.value,
                      )
                    }
                    className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 text-sm outline-none focus:border-black focus:bg-white"
                  />

                </div>

              </div>

              <div className="mt-5 rounded-xl bg-gray-50 p-4 text-xs text-gray-500">

                <strong className="text-gray-700">
                  Horário de Luanda:
                </strong>{' '}

                {nowLuanda
                  ? nowLuanda.replace(
                      'T',
                      ' ',
                    )
                  : '—'}

              </div>

            </section>

            {/* ================================================= */}
            {/* 04 */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  04
                </div>

                <div>
                  <h2 className="font-bold">
                    Preço e capacidade
                  </h2>

                  <p className="text-xs text-gray-500">
                    Defina as condições para participar.
                  </p>
                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Preço por pessoa
                  </label>

                  <div className="relative">

                    <input
                      type="number"
                      min="0"
                      value={
                        price
                      }
                      onChange={(e) =>
                        setPrice(
                          e.target.value,
                        )
                      }
                      placeholder="0"
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 px-4 pr-16 text-sm outline-none focus:border-black focus:bg-white"
                    />

                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-gray-400">
                      Kz
                    </span>

                  </div>

                </div>

                <div>

                  <label className="mb-2 block text-sm font-semibold">
                    Capacidade
                  </label>

                  <div className="relative">

                    <Users
                      size={17}
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                      type="number"
                      min="1"
                      value={
                        capacity
                      }
                      onChange={(e) =>
                        setCapacity(
                          e.target.value,
                        )
                      }
                      placeholder="Ex.: 20"
                      className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none focus:border-black focus:bg-white"
                    />

                  </div>

                </div>

              </div>

            </section>

            {/* ================================================= */}
            {/* 05 */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  05
                </div>

                <div>
                  <h2 className="font-bold">
                    Imagem de capa
                  </h2>

                  <p className="text-xs text-gray-500">
                    Escolha uma imagem que represente a experiência.
                  </p>
                </div>

              </div>

              <label className="group block cursor-pointer">

                <input
                  type="file"
                  accept="image/*"
                  onChange={
                    handleImageChange
                  }
                  className="hidden"
                />

                {imagePreview ? (

                  <div className="relative overflow-hidden rounded-2xl border border-gray-200">

                    <img
                      src={
                        imagePreview
                      }
                      alt="Pré-visualização"
                      className="h-72 w-full object-cover"
                    />

                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-5">

                      <p className="text-xs font-medium text-white">
                        Clique para trocar a imagem
                      </p>

                    </div>

                  </div>

                ) : (

                  <div className="flex min-h-60 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50 px-6 text-center transition group-hover:border-gray-400 group-hover:bg-white">

                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm">

                      <Camera
                        size={24}
                        className="text-gray-500"
                      />

                    </div>

                    <p className="text-sm font-bold">
                      Adicionar imagem de capa
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG ou WEBP · máximo 8 MB
                    </p>

                  </div>

                )}

              </label>

            </section>

            {/* ================================================= */}
            {/* 06 - MÚSICA */}
            {/* ================================================= */}

            <section className="mb-6 rounded-3xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7">

              <div className="mb-6 flex items-center gap-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-sm font-bold text-white">
                  06
                </div>

                <div>
                  <h2 className="font-bold">
                    Música
                  </h2>

                  <p className="text-xs text-gray-500">
                    Adicione uma música autorizada à publicação.
                  </p>
                </div>

              </div>

              {selectedMusic ? (

                <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">

                  {/* ================================================= */}
                  {/* MÚSICA SELECIONADA */}
                  {/* ================================================= */}

                  <div className="flex items-start gap-4">

                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                      {selectedMusic.cover_url ? (

                        <img
                          src={
                            selectedMusic.cover_url
                          }
                          alt={
                            selectedMusic.title
                          }
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        <div className="flex h-full w-full items-center justify-center bg-black text-white">

                          <Music2
                            size={20}
                          />

                        </div>

                      )}

                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-2">

                        <p className="truncate text-sm font-bold">
                          {
                            selectedMusic.title
                          }
                        </p>

                        <span className="shrink-0 rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white">
                          Selecionada
                        </span>

                      </div>

                      <p className="truncate text-xs text-gray-500">
                        {
                          selectedMusic.artist
                        }
                      </p>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[10px] text-gray-400">

                        {selectedMusic.genre && (
                          <>
                            <span>
                              {
                                selectedMusic.genre
                              }
                            </span>

                            <span>
                              •
                            </span>
                          </>
                        )}

                        <span>
                          Música{' '}
                          {formatMusicDuration(
                            selectedMusic.duration_seconds,
                          )}
                        </span>

                      </div>

                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        setMusicOpen(
                          true,
                        )
                      }
                      className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold transition hover:border-black"
                    >
                      Trocar
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        stopMusicPreview()

                        setSelectedMusic(
                          null,
                        )

                        setMusicStartSeconds(
                          0,
                        )
                      }}
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:text-black"
                    >
                      <X
                        size={16}
                      />
                    </button>

                  </div>

                  {/* ================================================= */}
                  {/* EDITOR DE TRECHO */}
                  {/* ================================================= */}

                  <div className="mt-5 border-t border-gray-200 pt-5">

                    <div className="flex items-start justify-between gap-4">

                      <div>

                        <div className="flex items-center gap-2">

                          <p className="text-xs font-bold text-gray-900">
                            Escolha o trecho
                          </p>

                          <span className="rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white">
                            Até 30s
                          </span>

                        </div>

                        <p className="mt-1 text-[11px] leading-5 text-gray-500">
                          Arraste a seleção para qualquer parte da música.
                        </p>

                      </div>

                      <div className="shrink-0 rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-gray-700 shadow-sm">

                        {formatMusicDuration(
                          musicStartSeconds,
                        )}

                        {' → '}

                        {formatMusicDuration(
                          selectedMusicClipEnd,
                        )}

                      </div>

                    </div>

                    {/* ================================================= */}
                    {/* TIMELINE / WAVEFORM */}
                    {/* ================================================= */}

                    <div className="mt-5">

                      <div
                        ref={
                          musicTimelineRef
                        }
                        onClick={
                          handleTimelineClick
                        }
                        className="relative h-28 cursor-pointer overflow-hidden rounded-2xl border border-gray-200 bg-white select-none touch-none"
                      >

                        <div className="absolute inset-0 bg-gradient-to-b from-gray-50 to-white" />

                        <div className="absolute inset-x-3 inset-y-5 flex items-center gap-[2px]">

                          {waveformBars.map(
                            (
                              height,
                              index,
                            ) => {

                              const total =
                                selectedMusicTotal

                              const barStart =
                                total > 0
                                  ? (index /
                                      waveformBars.length) *
                                    100
                                  : 0

                              const barEnd =
                                total > 0
                                  ? ((index +
                                      1) /
                                      waveformBars.length) *
                                    100
                                  : 0

                              const selected =
                                barStart <
                                  selectedMusicClipLeft +
                                    selectedMusicClipWidth &&
                                barEnd >
                                  selectedMusicClipLeft

                              return (

                                <div
                                  key={
                                    index
                                  }
                                  className={`flex-1 rounded-full transition-all ${
                                    selected
                                      ? 'bg-black'
                                      : 'bg-gray-300'
                                  }`}
                                  style={{
                                    height: `${height}%`,
                                    opacity:
                                      selected
                                        ? 1
                                        : 0.55,
                                  }}
                                />

                              )
                            },
                          )}

                        </div>

                        {/* JANELA DE SELEÇÃO */}

                        <div
                          className="absolute bottom-2 top-2 z-10 rounded-xl border-2 border-black bg-black/5 shadow-lg"
                          style={{
                            left: `${selectedMusicClipLeft}%`,
                            width: `${selectedMusicClipWidth}%`,
                          }}
                          onPointerDown={
                            handleClipPointerDown
                          }
                          onPointerMove={
                            handleClipPointerMove
                          }
                          onPointerUp={
                            handleClipPointerUp
                          }
                          onPointerCancel={
                            handleClipPointerUp
                          }
                        >

                          <div className="absolute left-[-3px] top-1/2 flex h-12 w-1.5 -translate-y-1/2 items-center justify-center rounded-full bg-black shadow-md">
                            <div className="h-5 w-0.5 rounded-full bg-white/80" />
                          </div>

                          <div className="absolute right-[-3px] top-1/2 flex h-12 w-1.5 -translate-y-1/2 items-center justify-center rounded-full bg-black shadow-md">
                            <div className="h-5 w-0.5 rounded-full bg-white/80" />
                          </div>

                          <div className="absolute inset-0 flex items-center justify-center">

                            <div className="rounded-full bg-black px-3 py-1 text-[9px] font-bold text-white shadow-lg">
                              {formatMusicDuration(
                                getClipDuration(
                                  selectedMusic,
                                ),
                              )}
                            </div>

                          </div>

                        </div>

                        <div className="absolute bottom-1 left-3 right-3 flex justify-between text-[8px] font-medium text-gray-400">

                          <span>
                            0:00
                          </span>

                          <span>
                            {formatMusicDuration(
                              selectedMusic.duration_seconds,
                            )}
                          </span>

                        </div>

                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2">

                        <div className="rounded-xl bg-white p-3">

                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Início
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {formatMusicDuration(
                              musicStartSeconds,
                            )}
                          </p>

                        </div>

                        <div className="rounded-xl bg-white p-3">

                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Fim
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {formatMusicDuration(
                              selectedMusicClipEnd,
                            )}
                          </p>

                        </div>

                        <div className="rounded-xl bg-white p-3">

                          <p className="text-[9px] font-bold uppercase tracking-wide text-gray-400">
                            Trecho
                          </p>

                          <p className="mt-1 text-sm font-bold">
                            {formatMusicDuration(
                              getClipDuration(
                                selectedMusic,
                              ),
                            )}
                          </p>

                        </div>

                      </div>

                    </div>

                    {/* BOTÃO OUVIR */}

                    <button
                      type="button"
                      onClick={
                        previewSelectedMusic
                      }
                      className="mt-4 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-black text-xs font-bold text-white transition hover:bg-gray-800"
                    >

                      {playingMusic ===
                      selectedMusic.id ? (
                        <>
                          <Pause
                            size={15}
                          />

                          Parar trecho
                        </>
                      ) : (
                        <>
                          <Play
                            size={15}
                          />

                          Ouvir este trecho
                        </>
                      )}

                    </button>

                    <p className="mt-3 text-center text-[10px] leading-5 text-gray-400">
                      Clique na faixa para posicionar o trecho ou arraste a seleção.
                    </p>

                  </div>

                </div>

              ) : (

                <button
                  type="button"
                  onClick={() =>
                    setMusicOpen(
                      true,
                    )
                  }
                  className="flex w-full items-center gap-4 rounded-2xl border border-dashed border-gray-300 bg-gray-50 p-5 text-left transition hover:border-black hover:bg-white"
                >

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-black text-white">

                    <Music2
                      size={21}
                    />

                  </div>

                  <div className="flex-1">

                    <p className="text-sm font-bold">
                      Adicionar música
                    </p>

                    <p className="mt-1 text-xs text-gray-500">
                      Escolha uma música do catálogo da Wizenda.
                    </p>

                  </div>

                  <ChevronDown
                    size={18}
                    className="-rotate-90 text-gray-400"
                  />

                </button>

              )}

            </section>

            {/* ================================================= */}
            {/* MENSAGEM */}
            {/* ================================================= */}

            {message && (

              <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {message}
              </div>

            )}

            {/* ================================================= */}
            {/* PUBLICAR */}
            {/* ================================================= */}

            <button
              type="submit"
              disabled={
                loading
              }
              className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-black px-6 text-sm font-bold text-white shadow-lg shadow-black/10 transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  {uploadingImage
                    ? 'A enviar imagem...'
                    : 'A publicar...'}
                </>
              ) : (
                <>
                  <Sparkles
                    size={18}
                  />

                  Publicar experiência
                </>
              )}

            </button>

          </form>

          {/* ================================================= */}
          {/* DIREITA - PREVIEW */}
          {/* ================================================= */}

          <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-7rem)]">

            <div className="flex h-full flex-col">

              <div className="mb-4 flex items-center justify-between">

                <div>

                  <p className="text-xs font-bold uppercase tracking-[0.15em] text-gray-400">
                    Preview
                  </p>

                  <h2 className="mt-1 text-lg font-bold">
                    Como os viajantes verão
                  </h2>

                </div>

                <div className="hidden rounded-full bg-white px-3 py-1.5 text-[11px] font-semibold text-gray-500 shadow-sm sm:block">
                  Atualização em tempo real
                </div>

              </div>

              <div className="overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-xl shadow-black/5">

                <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">

                  {imagePreview ? (

                    <img
                      src={
                        imagePreview
                      }
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />

                  ) : (

                    <div className="flex h-full w-full flex-col items-center justify-center text-gray-400">

                      <ImageIcon
                        size={38}
                      />

                      <p className="mt-3 text-xs font-medium">
                        A imagem da experiência aparecerá aqui
                      </p>

                    </div>

                  )}

                  <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {category && (

                    <div className="absolute left-4 top-4 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wide text-black shadow-sm">
                      {category}
                    </div>

                  )}

                  {selectedMusic && (

                    <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 text-white">

                      <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white/15 backdrop-blur">

                        {selectedMusic.cover_url ? (

                          <img
                            src={
                              selectedMusic.cover_url
                            }
                            alt={
                              selectedMusic.title
                            }
                            className="h-full w-full object-cover"
                          />

                        ) : (

                          <div className="flex h-full w-full items-center justify-center">

                            <Music2
                              size={15}
                            />

                          </div>

                        )}

                      </div>

                      <div className="min-w-0 flex-1">

                        <p className="truncate text-xs font-bold">
                          {
                            selectedMusic.title
                          }
                        </p>

                        <p className="truncate text-[10px] text-white/70">
                          {
                            selectedMusic.artist
                          }
                        </p>

                        <p className="mt-0.5 text-[9px] text-white/50">
                          Trecho{' '}
                          {formatMusicDuration(
                            musicStartSeconds,
                          )}
                          {' → '}
                          {formatMusicDuration(
                            selectedMusicClipEnd,
                          )}
                        </p>

                      </div>

                    </div>

                  )}

                </div>

                <div className="p-5">

                  <h3 className="text-xl font-bold leading-tight">
                    {title ||
                      'Título da experiência'}
                  </h3>

                  <p className="mt-2 line-clamp-3 text-sm leading-5 text-gray-500">
                    {description ||
                      'A descrição da sua experiência aparecerá aqui para os viajantes.'}
                  </p>

                  <div className="mt-5 flex items-center gap-2 text-xs text-gray-600">

                    <MapPin
                      size={15}
                    />

                    <span>
                      {location ||
                        city ||
                        province ||
                        'Local da experiência'}
                    </span>

                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">

                    <CalendarDays
                      size={15}
                    />

                    <span>
                      {activityStartDate
                        ? `${previewDate}${
                            activityStartTime
                              ? ` · ${activityStartTime}`
                              : ''
                          }`
                        : 'Data da experiência'}
                    </span>

                  </div>

                  <div className="mt-3 flex items-center gap-2 text-xs text-gray-600">

                    <Clock3
                      size={15}
                    />

                    <span>
                      {
                        previewDuration
                      }
                    </span>

                  </div>

                  {selectedMusic && (

                    <div className="mt-4 rounded-xl bg-gray-50 p-3">

                      <div className="flex items-center gap-3">

                        <div className="h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-gray-100">

                          {selectedMusic.cover_url ? (

                            <img
                              src={
                                selectedMusic.cover_url
                              }
                              alt={
                                selectedMusic.title
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            <div className="flex h-full w-full items-center justify-center bg-black text-white">

                              <Music2
                                size={14}
                              />

                            </div>

                          )}

                        </div>

                        <div className="min-w-0 flex-1">

                          <p className="truncate text-[11px] font-bold">
                            {
                              selectedMusic.title
                            }
                          </p>

                          <p className="truncate text-[10px] text-gray-500">
                            {
                              selectedMusic.artist
                            }
                          </p>

                        </div>

                        <span className="shrink-0 text-[9px] font-semibold text-gray-400">
                          {formatMusicDuration(
                            musicStartSeconds,
                          )}
                          {' — '}
                          {formatMusicDuration(
                            selectedMusicClipEnd,
                          )}
                        </span>

                      </div>

                    </div>

                  )}

                  <div className="my-5 border-t border-gray-100" />

                  <div className="flex items-end justify-between">

                    <div>

                      <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                        A partir de
                      </p>

                      <p className="mt-1 text-xl font-bold">
                        {price
                          ? `${Number(
                              price,
                            ).toLocaleString(
                              'pt-AO',
                            )} Kz`
                          : 'Preço'}
                      </p>

                    </div>

                    {capacity && (

                      <div className="flex items-center gap-1.5 text-xs text-gray-500">

                        <Users
                          size={14}
                        />

                        {capacity} lugares

                      </div>

                    )}

                  </div>

                  <button
                    type="button"
                    className="mt-5 h-11 w-full rounded-xl bg-black text-xs font-bold text-white"
                  >
                    Ver experiência
                  </button>

                </div>

              </div>

              <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-4">

                <div className="flex gap-3">

                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gray-100">

                    <Sparkles
                      size={16}
                    />

                  </div>

                  <div>

                    <p className="text-xs font-bold">
                      Dica para uma boa publicação
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-gray-500">
                      Use uma imagem de qualidade, um título claro e uma descrição que mostre por que esta experiência merece ser vivida.
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </main>

      {/* ===================================================== */}
      {/* MODAL DE MÚSICA */}
      {/* ===================================================== */}

      {musicOpen && (

        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-6">

          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-[28px] bg-white shadow-2xl sm:rounded-[28px]">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4 sm:px-6">

              <div className="flex items-center gap-3">

                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-black text-white">

                  <Music2
                    size={18}
                  />

                </div>

                <div>

                  <h3 className="font-bold">
                    Adicionar música
                  </h3>

                  <p className="text-[11px] text-gray-500">
                    Catálogo autorizado da Wizenda
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={() => {
                  setMusicOpen(
                    false,
                  )

                  stopMusicPreview()
                }}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-500 transition hover:bg-gray-200 hover:text-black"
              >
                <X
                  size={17}
                />
              </button>

            </div>

            {/* PESQUISA */}

            <div className="border-b border-gray-100 p-5">

              <div className="relative">

                <Search
                  size={17}
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400"
                />

                <input
                  value={
                    musicSearch
                  }
                  onChange={(e) =>
                    setMusicSearch(
                      e.target.value,
                    )
                  }
                  placeholder="Pesquisar música ou artista..."
                  className="h-12 w-full rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm outline-none transition focus:border-black focus:bg-white"
                />

              </div>

              <div className="mt-3 flex gap-2 overflow-x-auto pb-1">

                {musicGenres.map(
                  (genre) => (

                    <button
                      key={
                        genre
                      }
                      type="button"
                      onClick={() =>
                        setMusicGenre(
                          genre,
                        )
                      }
                      className={`whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                        musicGenre ===
                        genre
                          ? 'bg-black text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {genre}
                    </button>

                  ),
                )}

              </div>

              <div className="mt-4 rounded-xl bg-gray-50 px-3 py-2.5">

                <p className="text-[10px] leading-5 text-gray-500">

                  <span className="font-bold text-gray-700">
                    Como funciona:
                  </span>{' '}

                  escolha uma música e depois mova o trecho de até 30 segundos para a parte que preferir.

                </p>

              </div>

            </div>

            {/* LISTA */}

            <div className="min-h-0 flex-1 overflow-y-auto p-5">

              {loadingMusic ? (

                <div className="flex flex-col items-center justify-center py-16 text-gray-400">

                  <Loader2
                    size={26}
                    className="animate-spin"
                  />

                  <p className="mt-3 text-xs">
                    A carregar músicas...
                  </p>

                </div>

              ) : filteredMusic.length === 0 ? (

                <div className="flex flex-col items-center justify-center py-16 text-center">

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gray-100">

                    <Music2
                      size={23}
                      className="text-gray-400"
                    />

                  </div>

                  <p className="mt-4 text-sm font-bold">
                    Nenhuma música encontrada
                  </p>

                  <p className="mt-1 max-w-xs text-xs leading-5 text-gray-500">
                    Tente outro termo de pesquisa ou verifique se existem músicas ativas no catálogo.
                  </p>

                </div>

              ) : (

                <div className="space-y-2">

                  {filteredMusic.map(
                    (music) => {

                      const isPlaying =
                        playingMusic ===
                        music.id

                      const isSelected =
                        selectedMusic?.id ===
                        music.id

                      return (

                        <div
                          key={
                            music.id
                          }
                          className={`group flex items-center gap-3 rounded-2xl border p-3 transition ${
                            isSelected
                              ? 'border-black bg-gray-50'
                              : 'border-gray-100 hover:border-gray-300'
                          }`}
                        >

                          {/* CAPA + PLAY */}

                          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100">

                            {music.cover_url ? (

                              <img
                                src={
                                  music.cover_url
                                }
                                alt={
                                  music.title
                                }
                                className="h-full w-full object-cover"
                              />

                            ) : (

                              <div className="flex h-full w-full items-center justify-center bg-black text-white">

                                <Music2
                                  size={19}
                                />

                              </div>

                            )}

                            <button
                              type="button"
                              onClick={() =>
                                toggleMusicPreview(
                                  music,
                                )
                              }
                              className="absolute inset-0 flex items-center justify-center bg-black/30 text-white transition hover:bg-black/45"
                              aria-label={
                                isPlaying
                                  ? 'Parar pré-visualização'
                                  : 'Ouvir pré-visualização'
                              }
                            >

                              {isPlaying ? (

                                <Pause
                                  size={17}
                                />

                              ) : (

                                <Play
                                  size={17}
                                  className="ml-0.5"
                                />

                              )}

                            </button>

                          </div>

                          {/* INFO */}

                          <div className="min-w-0 flex-1">

                            <div className="flex items-center gap-2">

                              <p className="truncate text-sm font-bold">
                                {
                                  music.title
                                }
                              </p>

                              {isSelected && (

                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-black px-2 py-0.5 text-[9px] font-bold text-white">

                                  <Check
                                    size={9}
                                  />

                                  Selecionada

                                </span>

                              )}

                            </div>

                            <p className="truncate text-xs text-gray-500">
                              {
                                music.artist
                              }
                            </p>

                            <div className="mt-1 flex items-center gap-2 text-[10px] text-gray-400">

                              {music.genre && (

                                <span>
                                  {
                                    music.genre
                                  }
                                </span>

                              )}

                              <span>
                                •
                              </span>

                              <span>
                                {formatMusicDuration(
                                  music.duration_seconds,
                                )}
                              </span>

                            </div>

                          </div>

                          {/* USAR */}

                          <button
                            type="button"
                            onClick={() =>
                              selectMusic(
                                music,
                              )
                            }
                            className={`shrink-0 rounded-xl px-3 py-2 text-[11px] font-bold transition ${
                              isSelected
                                ? 'bg-black text-white'
                                : 'border border-gray-200 bg-white text-gray-700 hover:border-black hover:text-black'
                            }`}
                          >
                            {isSelected
                              ? 'Usada'
                              : 'Usar'}
                          </button>

                        </div>

                      )
                    },
                  )}

                </div>

              )}

            </div>

            {/* FOOTER */}

            <div className="border-t border-gray-100 bg-gray-50 px-5 py-3">

              <p className="text-center text-[10px] leading-5 text-gray-400">
                As músicas disponíveis neste catálogo são disponibilizadas para utilização conforme as respectivas autorizações/licenças.
              </p>

            </div>

          </div>

        </div>

      )}

    </div>
  )
}