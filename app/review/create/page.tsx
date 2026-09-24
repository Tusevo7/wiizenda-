'use client'

import {
  ArrowLeft,
  Check,
  ChevronDown,
  Circle,
  Image as ImageIcon,
  MapPin,
  Music2,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Type,
  Upload,
  Video,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type MediaType = 'image' | 'video'
type Screen = 'camera' | 'editor'

type Sound = {
  id: string
  title: string
  artist: string | null
  genre: string | null
  audio_url: string
  cover_url: string | null
  duration_seconds: number | null
  preview_start_seconds: number | null
  preview_duration_seconds: number | null
  license_type: string | null
  license_url: string | null
  is_active: boolean
}

type TagType = 'agency' | 'hotel'

type TagItem = {
  id: string
  name: string
  image_url: string | null
  cover_image: string | null
}

const filters = [
  {
    id: 'normal',
    name: 'Normal',
    css: 'none',
  },
  {
    id: 'bw',
    name: 'P&B',
    css: 'grayscale(1)',
  },
  {
    id: 'warm',
    name: 'Quente',
    css: 'sepia(.2) saturate(1.35) contrast(1.04)',
  },
  {
    id: 'cool',
    name: 'Frio',
    css: 'saturate(.9) hue-rotate(12deg) brightness(1.04)',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    css: 'sepia(.32) saturate(.82) contrast(.92)',
  },
]

export default function ReviewCreatePage() {
  const router = useRouter()
  const supabase = createClient()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const photoInputRef =
    useRef<HTMLInputElement | null>(null)

  const videoInputRef =
    useRef<HTMLInputElement | null>(null)

  const galleryInputRef =
    useRef<HTMLInputElement | null>(null)

  const cameraStreamRef =
    useRef<MediaStream | null>(null)

  const recorderRef =
    useRef<MediaRecorder | null>(null)

  const recordedChunksRef =
    useRef<Blob[]>([])

  const recordingTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(
      null,
    )

  const soundAudioRef =
    useRef<HTMLAudioElement | null>(null)

  const soundPreviewTimerRef =
    useRef<ReturnType<typeof setTimeout> | null>(
      null,
    )

  const [screen, setScreen] =
    useState<Screen>('camera')

  const [mediaType, setMediaType] =
    useState<MediaType>('image')

  const [mediaFile, setMediaFile] =
    useState<File | null>(null)

  const [mediaUrl, setMediaUrl] =
    useState<string | null>(null)

  const [cameraReady, setCameraReady] =
    useState(false)

  const [cameraError, setCameraError] =
    useState('')

  const [cameraFacing, setCameraFacing] =
    useState<'user' | 'environment'>(
      'environment',
    )

  const [isRecording, setIsRecording] =
    useState(false)

  const [recordingSeconds, setRecordingSeconds] =
    useState(0)

  const [originalAudioEnabled, setOriginalAudioEnabled] =
    useState(true)

  /* -------------------------------------------------------
     SOUNDS
  ------------------------------------------------------- */

  const [sounds, setSounds] =
    useState<Sound[]>([])

  const [loadingSounds, setLoadingSounds] =
    useState(false)

  const [soundSearch, setSoundSearch] =
    useState('')

  const [selectedSound, setSelectedSound] =
    useState<Sound | null>(null)

  const [soundPlaying, setSoundPlaying] =
    useState(false)

  /* -------------------------------------------------------
     EDITOR
  ------------------------------------------------------- */

  const [selectedFilter, setSelectedFilter] =
    useState('normal')

  const [caption, setCaption] =
    useState('')

  const [textMode, setTextMode] =
    useState(false)

  const [location, setLocation] =
    useState('')

  const [locationMode, setLocationMode] =
    useState(false)

  const [tagType, setTagType] =
    useState<TagType | null>(null)

  const [taggedItem, setTaggedItem] =
    useState<TagItem | null>(null)

  const [tagMode, setTagMode] =
    useState(false)

  const [tagSearch, setTagSearch] =
    useState('')

  const [tagItems, setTagItems] =
    useState<TagItem[]>([])

  const [loadingTags, setLoadingTags] =
    useState(false)

  const [soundMode, setSoundMode] =
    useState(false)

  const [filterMode, setFilterMode] =
    useState(false)

  const [publishing, setPublishing] =
    useState(false)

  const [error, setError] =
    useState('')

  const [showPermissionHint, setShowPermissionHint] =
    useState(false)

  const currentFilter =
    filters.find(
      (item) => item.id === selectedFilter,
    )?.css || 'none'

  /* -------------------------------------------------------
     CAMERA
  ------------------------------------------------------- */

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop())

      cameraStreamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setCameraReady(false)
  }, [])

  const startCamera = useCallback(async () => {
    try {
      setCameraError('')
      setShowPermissionHint(false)

      stopCamera()

      if (
        !navigator.mediaDevices?.getUserMedia
      ) {
        setCameraError(
          'Este navegador não suporta acesso direto à câmera. Usa a opção Galeria.',
        )

        return
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: cameraFacing,
            width: {
              ideal: 1920,
            },
            height: {
              ideal: 1080,
            },
          },
          audio: true,
        })

      cameraStreamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.muted = true

        await videoRef.current.play()
      }

      setCameraReady(true)
    } catch (err) {
      console.error(err)

      setCameraError(
        'Não foi possível abrir a câmera. Verifica a permissão do navegador.',
      )

      setShowPermissionHint(true)
    }
  }, [cameraFacing, stopCamera])

  useEffect(() => {
    if (screen === 'camera') {
      startCamera()
    }

    return () => {
      stopCamera()
    }
  }, [
    screen,
    startCamera,
    stopCamera,
  ])

  /* -------------------------------------------------------
     CLEANUP
  ------------------------------------------------------- */

  useEffect(() => {
    return () => {
      stopCamera()

      if (recordingTimerRef.current) {
        clearInterval(
          recordingTimerRef.current,
        )
      }

      if (soundPreviewTimerRef.current) {
        clearTimeout(
          soundPreviewTimerRef.current,
        )
      }

      if (soundAudioRef.current) {
        soundAudioRef.current.pause()
      }
    }
  }, [stopCamera])

  /* -------------------------------------------------------
     MEDIA
  ------------------------------------------------------- */

  const setSelectedMedia = (
    file: File,
    type: MediaType,
  ) => {
    if (!file) return

    setError('')

    if (
      mediaUrl?.startsWith('blob:')
    ) {
      URL.revokeObjectURL(mediaUrl)
    }

    const url =
      URL.createObjectURL(file)

    setMediaFile(file)
    setMediaType(type)
    setMediaUrl(url)

    setOriginalAudioEnabled(true)
    setSelectedFilter('normal')

    setScreen('editor')

    stopCamera()
  }

  const handlePhotoInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError(
        'Seleciona uma imagem válida.',
      )

      return
    }

    setSelectedMedia(
      file,
      'image',
    )

    event.target.value = ''
  }

  const handleVideoInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('video/')) {
      setError(
        'Seleciona um vídeo válido.',
      )

      return
    }

    setSelectedMedia(
      file,
      'video',
    )

    event.target.value = ''
  }

  const handleGalleryInput = (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file =
      event.target.files?.[0]

    if (!file) return

    if (file.type.startsWith('image/')) {
      setSelectedMedia(
        file,
        'image',
      )
    } else if (
      file.type.startsWith('video/')
    ) {
      setSelectedMedia(
        file,
        'video',
      )
    } else {
      setError(
        'Formato não suportado.',
      )
    }

    event.target.value = ''
  }

  /* -------------------------------------------------------
     CAPTURE PHOTO
  ------------------------------------------------------- */

  const capturePhoto = () => {
    const video = videoRef.current

    if (!video || !cameraReady) {
      setError(
        'A câmera ainda não está pronta.',
      )

      return
    }

    const canvas = canvasRef.current

    if (!canvas) return

    const width =
      video.videoWidth

    const height =
      video.videoHeight

    if (!width || !height) {
      setError(
        'Não foi possível capturar a imagem.',
      )

      return
    }

    canvas.width = width
    canvas.height = height

    const ctx =
      canvas.getContext('2d')

    if (!ctx) return

    if (cameraFacing === 'user') {
      ctx.translate(width, 0)
      ctx.scale(-1, 1)
    }

    ctx.drawImage(
      video,
      0,
      0,
      width,
      height,
    )

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError(
            'Não foi possível criar a foto.',
          )

          return
        }

        const file = new File(
          [blob],
          `wizenda-${Date.now()}.jpg`,
          {
            type: 'image/jpeg',
          },
        )

        setSelectedMedia(
          file,
          'image',
        )
      },
      'image/jpeg',
      0.94,
    )
  }

  /* -------------------------------------------------------
     VIDEO RECORDING
  ------------------------------------------------------- */

  const stopRecording = useCallback(() => {
    if (
      recorderRef.current &&
      recorderRef.current.state !==
        'inactive'
    ) {
      recorderRef.current.stop()
    }

    if (recordingTimerRef.current) {
      clearInterval(
        recordingTimerRef.current,
      )

      recordingTimerRef.current = null
    }
  }, [])

  const startRecording = () => {
    const stream =
      cameraStreamRef.current

    if (!stream) {
      setError(
        'A câmera não está disponível.',
      )

      return
    }

    if (!window.MediaRecorder) {
      setError(
        'Este navegador não suporta gravação de vídeo.',
      )

      return
    }

    const mimeTypes = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
    ]

    const mimeType =
      mimeTypes.find((type) =>
        MediaRecorder.isTypeSupported(
          type,
        ),
      ) || ''

    try {
      const recorder = mimeType
        ? new MediaRecorder(stream, {
            mimeType,
            videoBitsPerSecond:
              6_000_000,
          })
        : new MediaRecorder(stream)

      recordedChunksRef.current = []

      recorder.ondataavailable = (
        event,
      ) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(
            event.data,
          )
        }
      }

      recorder.onstop = () => {
        const blob = new Blob(
          recordedChunksRef.current,
          {
            type:
              recorder.mimeType ||
              'video/webm',
          },
        )

        const extension =
          blob.type.includes('mp4')
            ? 'mp4'
            : 'webm'

        const file = new File(
          [blob],
          `wizenda-video-${Date.now()}.${extension}`,
          {
            type: blob.type,
          },
        )

        setSelectedMedia(
          file,
          'video',
        )

        setIsRecording(false)
        setRecordingSeconds(0)

        if (
          recordingTimerRef.current
        ) {
          clearInterval(
            recordingTimerRef.current,
          )

          recordingTimerRef.current =
            null
        }
      }

      recorder.onerror = () => {
        setIsRecording(false)

        if (
          recordingTimerRef.current
        ) {
          clearInterval(
            recordingTimerRef.current,
          )

          recordingTimerRef.current =
            null
        }

        setError(
          'Ocorreu um erro durante a gravação.',
        )
      }

      recorderRef.current = recorder

      recorder.start(250)

      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (current) => {
              const next =
                current + 1

              if (next >= 60) {
                setTimeout(
                  () => {
                    stopRecording()
                  },
                  0,
                )

                return 60
              }

              return next
            },
          )
        }, 1000)
    } catch (err) {
      console.error(err)

      setError(
        'Não foi possível iniciar a gravação.',
      )
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording()
    } else {
      startRecording()
    }
  }

  /* -------------------------------------------------------
     SWITCH CAMERA
  ------------------------------------------------------- */

  const switchCamera = () => {
    setCameraFacing(
      (current) =>
        current === 'environment'
          ? 'user'
          : 'environment',
    )
  }

  /* -------------------------------------------------------
     MUSIC FROM SUPABASE
  ------------------------------------------------------- */

  const loadSounds = useCallback(
    async () => {
      setLoadingSounds(true)

      try {
        const {
          data,
          error: soundsError,
        } = await supabase
          .from('music_tracks')
          .select(
            `
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
              license_url,
              is_active
            `,
          )
          .eq(
            'is_active',
            true,
          )
          .order(
            'title',
            {
              ascending: true,
            },
          )

        if (soundsError) {
          throw soundsError
        }

        setSounds(
          (data || []) as Sound[],
        )
      } catch (err) {
        console.error(
          'Erro ao carregar músicas:',
          err,
        )

        setSounds([])

        setError(
          'Não foi possível carregar as músicas.',
        )
      } finally {
        setLoadingSounds(false)
      }
    },
    [supabase],
  )

  useEffect(() => {
    if (!soundMode) return

    loadSounds()
  }, [
    soundMode,
    loadSounds,
  ])

  const stopSoundPreview = () => {
    if (soundPreviewTimerRef.current) {
      clearTimeout(
        soundPreviewTimerRef.current,
      )

      soundPreviewTimerRef.current =
        null
    }

    if (soundAudioRef.current) {
      soundAudioRef.current.pause()
    }

    setSoundPlaying(false)
  }

  const toggleSoundPreview = (
    sound: Sound,
  ) => {
    if (!sound.audio_url) {
      setError(
        'Esta música não possui áudio disponível.',
      )

      return
    }

    if (
      !soundAudioRef.current
    ) {
      soundAudioRef.current =
        new Audio()

      soundAudioRef.current.preload =
        'auto'
    }

    const audio =
      soundAudioRef.current

    if (
      selectedSound?.id ===
        sound.id &&
      soundPlaying
    ) {
      stopSoundPreview()
      return
    }

    stopSoundPreview()

    setSelectedSound(sound)

    audio.src = sound.audio_url

    const previewStart =
      Math.max(
        0,
        sound.preview_start_seconds ||
          0,
      )

    const previewDuration =
      sound.preview_duration_seconds &&
      sound.preview_duration_seconds >
        0
        ? sound.preview_duration_seconds
        : 30

    const playPreview =
      async () => {
        try {
          audio.currentTime =
            previewStart

          await audio.play()

          setSoundPlaying(true)

          if (
            soundPreviewTimerRef.current
          ) {
            clearTimeout(
              soundPreviewTimerRef.current,
            )
          }

          soundPreviewTimerRef.current =
            setTimeout(() => {
              audio.pause()
              setSoundPlaying(false)
            }, previewDuration * 1000)
        } catch (err) {
          console.error(
            'Erro ao reproduzir música:',
            err,
          )

          setSoundPlaying(false)

          setError(
            'Não foi possível reproduzir esta música.',
          )
        }
      }

    if (audio.readyState >= 1) {
      playPreview()
    } else {
      audio.onloadedmetadata =
        () => {
          playPreview()
        }
    }
  }

  const removeSound = () => {
    stopSoundPreview()
    setSelectedSound(null)
  }

  const filteredSounds =
    sounds.filter((sound) => {
      const search =
        soundSearch
          .toLowerCase()
          .trim()

      if (!search) return true

      return (
        sound.title
          .toLowerCase()
          .includes(search) ||
        (
          sound.artist || ''
        )
          .toLowerCase()
          .includes(search) ||
        (
          sound.genre || ''
        )
          .toLowerCase()
          .includes(search)
      )
    })

  /* -------------------------------------------------------
     TAGS
  ------------------------------------------------------- */

  const openTagMode = async (
    type: TagType,
  ) => {
    setTagType(type)
    setTagMode(true)
    setTagSearch('')
    setLoadingTags(true)
    setError('')

    try {
      if (type === 'agency') {
        const {
          data,
          error: tagError,
        } = await supabase
          .from('agencies')
          .select(
            'id,name,logo_url,cover_image',
          )
          .order('name')
          .limit(100)

        if (tagError) {
          throw tagError
        }

        setTagItems(
          (data || []).map(
            (item) => ({
              id: item.id,
              name: item.name,
              image_url:
                item.logo_url ||
                null,
              cover_image:
                item.cover_image ||
                null,
            }),
          ),
        )
      } else {
        const {
          data,
          error: tagError,
        } = await supabase
          .from('weekend_places')
          .select(
            'id,name',
          )
          .order('name')
          .limit(100)

        if (tagError) {
          throw tagError
        }

        setTagItems(
          (data || []).map(
            (item) => ({
              id: item.id,
              name: item.name,
              image_url: null,
              cover_image: null,
            }),
          ),
        )
      }
    } catch (err) {
      console.error(err)

      setTagItems([])

      setError(
        'Não foi possível carregar os locais da base de dados.',
      )
    } finally {
      setLoadingTags(false)
    }
  }

  const filteredTagItems =
    tagItems.filter((item) =>
      item.name
        .toLowerCase()
        .includes(
          tagSearch.toLowerCase(),
        ),
    )

  /* -------------------------------------------------------
     IMAGE FILTER
  ------------------------------------------------------- */

  const prepareImage = async (
    file: File,
    filterCss: string,
  ): Promise<Blob> => {
    if (
      filterCss === 'none'
    ) {
      return file
    }

    const url =
      URL.createObjectURL(file)

    try {
      const image = new Image()

      image.src = url

      await image.decode()

      const canvas =
        document.createElement(
          'canvas',
        )

      canvas.width =
        image.naturalWidth

      canvas.height =
        image.naturalHeight

      const ctx =
        canvas.getContext('2d')

      if (!ctx) {
        return file
      }

      ctx.filter = filterCss

      ctx.drawImage(
        image,
        0,
        0,
        canvas.width,
        canvas.height,
      )

      const blob =
        await new Promise<Blob | null>(
          (resolve) => {
            canvas.toBlob(
              resolve,
              'image/jpeg',
              0.94,
            )
          },
        )

      return blob || file
    } finally {
      URL.revokeObjectURL(url)
    }
  }

  /* -------------------------------------------------------
     PUBLISH
  ------------------------------------------------------- */

  const publish = async () => {
    if (!mediaFile) {
      setError(
        'Primeiro tira uma foto, grava um vídeo ou importa uma mídia.',
      )

      return
    }

    if (publishing) return

    setPublishing(true)
    setError('')

    try {
      const {
        data: { user },
        error: authError,
      } =
        await supabase.auth.getUser()

      if (
        authError ||
        !user
      ) {
        throw new Error(
          'Precisas estar autenticado para publicar.',
        )
      }

      let uploadBlob: Blob =
        mediaFile

      let extension = 'jpg'

      let contentType =
        'image/jpeg'

      /* FOTO */

      if (
        mediaType === 'image'
      ) {
        uploadBlob =
          await prepareImage(
            mediaFile,
            currentFilter,
          )

        extension = 'jpg'
        contentType =
          'image/jpeg'
      }

      /* VÍDEO */

      else {
        extension =
          mediaFile.name
            .toLowerCase()
            .endsWith('.mp4')
            ? 'mp4'
            : 'webm'

        contentType =
          mediaFile.type ||
          'video/webm'
      }

      const filePath =
        `${user.id}/${crypto.randomUUID()}.${extension}`

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'community-media',
          )
          .upload(
            filePath,
            uploadBlob,
            {
              contentType,
              upsert: false,
            },
          )

      if (uploadError) {
        throw uploadError
      }

      const {
        data: { publicUrl },
      } =
        supabase.storage
          .from(
            'community-media',
          )
          .getPublicUrl(
            filePath,
          )

      const {
        data: profile,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            user.id,
          )
          .maybeSingle()

      const postType =
        profile?.role === 'agency'
          ? 'agency'
          : 'traveler'

      const payload: Record<
        string,
        unknown
      > = {
        user_id: user.id,

        post_type:
          postType,

        media_type:
          mediaType,

        media_url:
          publicUrl,

        caption:
          caption.trim() ||
          null,

        location:
          location.trim() ||
          null,

        rating: null,

        sound_name:
          selectedSound?.title ||
          null,

        sound_url:
          selectedSound?.audio_url ||
          null,
      }

      /* MARCAÇÃO */

      if (
        tagType &&
        taggedItem
      ) {
        payload.tagged_type =
          tagType

        payload.tagged_id =
          taggedItem.id
      }

      const {
        error: insertError,
      } =
        await supabase
          .from(
            'community_posts',
          )
          .insert(payload)

      if (insertError) {
        await supabase.storage
          .from(
            'community-media',
          )
          .remove([
            filePath,
          ])

        throw insertError
      }

      stopSoundPreview()

      if (
        mediaUrl?.startsWith(
          'blob:',
        )
      ) {
        URL.revokeObjectURL(
          mediaUrl,
        )
      }

      router.replace(
        '/review',
      )
    } catch (err: any) {
      console.error(err)

      setError(
        err?.message ||
          'Não foi possível publicar o review.',
      )
    } finally {
      setPublishing(false)
    }
  }

  /* -------------------------------------------------------
     EXIT
  ------------------------------------------------------- */

  const exit = () => {
    if (isRecording) {
      stopRecording()
    }

    stopCamera()
    stopSoundPreview()

    if (
      mediaUrl?.startsWith(
        'blob:',
      )
    ) {
      URL.revokeObjectURL(
        mediaUrl,
      )
    }

    router.back()
  }

  /* -------------------------------------------------------
     CAMERA SCREEN
  ------------------------------------------------------- */

  if (screen === 'camera') {
    return (
      <main className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
        {/* CAMERA */}

        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`absolute inset-0 h-full w-full object-cover ${
            cameraFacing === 'user'
              ? 'scale-x-[-1]'
              : ''
          }`}
        />

        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* GRADIENT */}

        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80" />

        {/* TOP */}

        <div className="absolute left-0 right-0 top-0 flex items-center justify-between p-5 pt-[max(20px,env(safe-area-inset-top))]">
          <button
            type="button"
            onClick={exit}
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-md"
          >
            <X size={24} />
          </button>

          <div className="rounded-full bg-black/35 px-5 py-2 backdrop-blur-md">
            <span className="text-sm font-semibold">
              Wizenda
            </span>
          </div>

          <button
            type="button"
            onClick={
              switchCamera
            }
            className="flex h-11 w-11 items-center justify-center rounded-full bg-black/35 backdrop-blur-md"
          >
            <RotateCcw size={22} />
          </button>
        </div>

        {/* ERROR */}

        {(cameraError ||
          error) && (
          <div className="absolute left-5 right-5 top-24 rounded-2xl bg-black/70 p-4 text-center text-sm backdrop-blur-xl">
            {cameraError ||
              error}
          </div>
        )}

        {/* PERMISSION */}

        {showPermissionHint && (
          <div className="absolute bottom-48 left-5 right-5 rounded-2xl bg-white p-4 text-black">
            <p className="text-sm font-semibold">
              Permissão da câmera
            </p>

            <p className="mt-1 text-xs text-black/60">
              Permite o acesso à
              câmera no navegador
              para tirar fotos e
              gravar vídeos.
            </p>
          </div>
        )}

        {/* BOTTOM */}

        <div className="absolute bottom-0 left-0 right-0 px-6 pb-[max(28px,env(safe-area-inset-bottom))]">
          <div className="flex items-center justify-between">
            {/* GALERIA */}

            <button
              type="button"
              onClick={() =>
                galleryInputRef.current?.click()
              }
              className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-white/30 bg-black/35 backdrop-blur-md"
            >
              <ImageIcon size={22} />
            </button>

            {/* CAPTURE */}

            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={
                  toggleRecording
                }
                onDoubleClick={
                  capturePhoto
                }
                className={`flex h-24 w-24 items-center justify-center rounded-full border-[5px] border-white ${
                  isRecording
                    ? 'bg-red-500'
                    : 'bg-white/10'
                }`}
              >
                <span
                  className={`block transition-all ${
                    isRecording
                      ? 'h-9 w-9 rounded-xl bg-white'
                      : 'h-[72px] w-[72px] rounded-full bg-white'
                  }`}
                />
              </button>

              <div className="mt-3 text-center">
                {isRecording ? (
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-semibold">
                    {recordingSeconds}s
                  </span>
                ) : (
                  <span className="text-xs text-white/75">
                    Toque = vídeo · Duplo toque = foto
                  </span>
                )}
              </div>
            </div>

            {/* FOTO */}

            <button
              type="button"
              onClick={
                capturePhoto
              }
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-white text-black"
            >
              <Circle
                size={22}
                fill="currentColor"
              />
            </button>
          </div>

          {/* IMPORT */}

          <div className="mt-5 flex justify-center">
            <button
              type="button"
              onClick={() =>
                photoInputRef.current?.click()
              }
              className="flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-medium backdrop-blur-md"
            >
              <Upload size={15} />
              Importar foto
            </button>

            <button
              type="button"
              onClick={() =>
                videoInputRef.current?.click()
              }
              className="ml-2 flex items-center gap-2 rounded-full bg-black/40 px-4 py-2 text-xs font-medium backdrop-blur-md"
            >
              <Video size={15} />
              Importar vídeo
            </button>
          </div>
        </div>

        {/* INPUT FOTO */}

        <input
          ref={photoInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={
            handlePhotoInput
          }
          className="hidden"
        />

        {/* INPUT VÍDEO */}

        <input
          ref={videoInputRef}
          type="file"
          accept="video/*"
          capture="environment"
          onChange={
            handleVideoInput
          }
          className="hidden"
        />

        {/* GALERIA */}

        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          onChange={
            handleGalleryInput
          }
          className="hidden"
        />
      </main>
    )
  }

  /* -------------------------------------------------------
     EDITOR
  ------------------------------------------------------- */

  return (
    <main className="fixed inset-0 z-50 overflow-hidden bg-black text-white">
      {/* MEDIA */}

      <div className="absolute inset-0 flex items-center justify-center bg-black">
        {mediaType ===
          'image' &&
          mediaUrl && (
            <img
              src={mediaUrl}
              alt="Preview"
              className="h-full w-full object-contain"
              style={{
                filter:
                  currentFilter,
              }}
            />
          )}

        {mediaType ===
          'video' &&
          mediaUrl && (
            <video
              src={mediaUrl}
              autoPlay
              loop
              muted={
                !originalAudioEnabled
              }
              playsInline
              controls={false}
              className="h-full w-full object-contain"
            />
          )}
      </div>

      {/* OVERLAY */}

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/75" />

      {/* TOP */}

      <div className="absolute left-0 right-0 top-0 z-20 flex items-center justify-between p-5 pt-[max(20px,env(safe-area-inset-top))]">
        <button
          type="button"
          onClick={() => {
            if (
              mediaUrl?.startsWith(
                'blob:',
              )
            ) {
              URL.revokeObjectURL(
                mediaUrl,
              )
            }

            setMediaFile(null)
            setMediaUrl(null)
            setScreen('camera')
          }}
          className="pointer-events-auto flex h-11 w-11 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
        >
          <ArrowLeft size={23} />
        </button>

        <div className="rounded-full bg-black/40 px-4 py-2 text-xs font-semibold backdrop-blur-md">
          Editar
        </div>

        <button
          type="button"
          onClick={publish}
          disabled={
            publishing
          }
          className="pointer-events-auto flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-black disabled:opacity-50"
        >
          {publishing ? (
            'A publicar...'
          ) : (
            <>
              <Check size={18} />
              Publicar
            </>
          )}
        </button>
      </div>

      {/* TEXT ON MEDIA */}

      {caption && (
        <div className="pointer-events-none absolute left-6 right-6 top-1/2 z-10 -translate-y-1/2 text-center">
          <span className="rounded-lg bg-black/20 px-3 py-2 text-2xl font-bold drop-shadow-lg">
            {caption}
          </span>
        </div>
      )}

      {/* SIDE TOOLS */}

      <div className="absolute right-4 top-1/2 z-20 flex -translate-y-1/2 flex-col items-center gap-4">
        {/* ÁUDIO */}

        {mediaType ===
          'video' && (
          <button
            type="button"
            onClick={() =>
              setOriginalAudioEnabled(
                (current) =>
                  !current,
              )
            }
            className="pointer-events-auto flex flex-col items-center gap-1"
          >
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
              {originalAudioEnabled ? (
                <Volume2
                  size={21}
                />
              ) : (
                <VolumeX
                  size={21}
                />
              )}
            </span>

            <span className="text-[10px]">
              Áudio
            </span>
          </button>
        )}

        {/* MÚSICA */}

        <button
          type="button"
          onClick={() =>
            setSoundMode(true)
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/45 backdrop-blur-md">
            {selectedSound?.cover_url ? (
              <img
                src={
                  selectedSound.cover_url
                }
                alt=""
                className="absolute inset-0 h-full w-full object-cover opacity-80"
              />
            ) : null}

            <Music2
              size={21}
              className="relative z-10"
            />
          </span>

          <span className="text-[10px]">
            Música
          </span>
        </button>

        {/* LOCAL */}

        <button
          type="button"
          onClick={() =>
            setLocationMode(
              true,
            )
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
            <MapPin size={21} />
          </span>

          <span className="text-[10px]">
            Local
          </span>
        </button>

        {/* TEXTO */}

        <button
          type="button"
          onClick={() =>
            setTextMode(true)
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
            <Type size={21} />
          </span>

          <span className="text-[10px]">
            Texto
          </span>
        </button>

        {/* FILTRO */}

        <button
          type="button"
          onClick={() =>
            setFilterMode(true)
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
            <Sparkles
              size={21}
            />
          </span>

          <span className="text-[10px]">
            Filtro
          </span>
        </button>

        {/* AGÊNCIA */}

        <button
          type="button"
          onClick={() =>
            openTagMode(
              'agency',
            )
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full bg-black/45 backdrop-blur-md">
            {tagType ===
              'agency' &&
            taggedItem?.image_url ? (
              <img
                src={
                  taggedItem.image_url
                }
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-lg">
                🏢
              </span>
            )}
          </span>

          <span className="text-[10px]">
            Agência
          </span>
        </button>

        {/* HOTEL */}

        <button
          type="button"
          onClick={() =>
            openTagMode(
              'hotel',
            )
          }
          className="pointer-events-auto flex flex-col items-center gap-1"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/45 backdrop-blur-md">
            <span className="text-lg">
              🏨
            </span>
          </span>

          <span className="text-[10px]">
            Hotel
          </span>
        </button>
      </div>

      {/* BOTTOM */}

      <div className="absolute bottom-0 left-0 right-0 z-20 p-5 pb-[max(25px,env(safe-area-inset-bottom))]">
        {/* LOCAL */}

        {location && (
          <div className="mb-3 flex items-center gap-2">
            <div className="rounded-full bg-black/50 px-3 py-2 text-xs backdrop-blur-md">
              <MapPin
                size={13}
                className="mr-1 inline"
              />

              {location}
            </div>
          </div>
        )}

        {/* TAG */}

        {taggedItem && (
          <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs backdrop-blur-md">
            {taggedItem.image_url ||
            taggedItem.cover_image ? (
              <img
                src={
                  taggedItem.image_url ||
                  taggedItem.cover_image ||
                  ''
                }
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <span>
                {tagType ===
                'agency'
                  ? '🏢'
                  : '🏨'}
              </span>
            )}

            <span className="font-semibold">
              {taggedItem.name}
            </span>
          </div>
        )}

        {/* SOUND */}

        {selectedSound && (
          <button
            type="button"
            onClick={() =>
              setSoundMode(true)
            }
            className="mb-4 flex items-center gap-2 rounded-full bg-black/50 px-3 py-2 text-xs backdrop-blur-md"
          >
            {selectedSound.cover_url ? (
              <img
                src={
                  selectedSound.cover_url
                }
                alt=""
                className="h-6 w-6 rounded-full object-cover"
              />
            ) : (
              <Music2
                size={13}
              />
            )}

            <span className="max-w-[220px] truncate">
              {selectedSound.title}
              {selectedSound.artist
                ? ` · ${selectedSound.artist}`
                : ''}
            </span>
          </button>
        )}

        {/* DESCRIPTION */}

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() =>
              setTextMode(true)
            }
            className="flex-1 rounded-full bg-black/45 px-4 py-3 text-left text-sm backdrop-blur-md"
          >
            {caption ||
              'Adicionar descrição...'}
          </button>

          <button
            type="button"
            onClick={publish}
            disabled={
              publishing
            }
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-black disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>
      </div>

      {/* ---------------------------------------------------
          SOUND SHEET
      --------------------------------------------------- */}

      {soundMode && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/60">
          <div className="flex max-h-[88vh] w-full flex-col rounded-t-[32px] bg-[#111]">
            {/* HEADER */}

            <div className="shrink-0 p-5 pb-3">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">
                    Música
                  </h2>

                  <p className="mt-1 text-xs text-white/45">
                    Escolhe uma música para a tua publicação
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSoundMode(
                      false,
                    )

                    setSoundSearch(
                      '',
                    )
                  }}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
                >
                  <X size={19} />
                </button>
              </div>

              {/* SEARCH */}

              <div className="flex items-center gap-3 rounded-2xl bg-white/[0.07] px-4">
                <Search
                  size={18}
                  className="shrink-0 text-white/50"
                />

                <input
                  value={
                    soundSearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setSoundSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Pesquisar música, artista ou género..."
                  className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
                />
              </div>
            </div>

            {/* SELECTED SOUND */}

            {selectedSound && (
              <div className="mx-5 mb-3 flex items-center gap-3 rounded-2xl bg-white p-3 text-black">
                {selectedSound.cover_url ? (
                  <img
                    src={
                      selectedSound.cover_url
                    }
                    alt=""
                    className="h-12 w-12 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-black/10">
                    <Music2
                      size={20}
                    />
                  </div>
                )}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">
                    {
                      selectedSound.title
                    }
                  </p>

                  <p className="mt-0.5 truncate text-xs text-black/50">
                    {selectedSound.artist ||
                      selectedSound.genre ||
                      'Wizenda'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={
                    removeSound
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/10"
                >
                  <X size={17} />
                </button>
              </div>
            )}

            {/* LIST */}

            <div className="min-h-0 flex-1 overflow-y-auto px-5 pb-6">
              {loadingSounds ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />

                  <p className="mt-4 text-sm text-white/45">
                    A carregar músicas...
                  </p>
                </div>
              ) : sounds.length ===
                0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
                    <Music2
                      size={27}
                    />
                  </div>

                  <p className="mt-4 text-sm font-semibold">
                    Nenhuma música disponível
                  </p>

                  <p className="mt-1 max-w-[260px] text-xs leading-5 text-white/40">
                    As músicas ativas adicionadas ao catálogo da Wizenda aparecerão aqui.
                  </p>
                </div>
              ) : filteredSounds.length ===
                0 ? (
                <div className="py-16 text-center">
                  <Search
                    size={30}
                    className="mx-auto text-white/25"
                  />

                  <p className="mt-3 text-sm text-white/50">
                    Nenhuma música encontrada.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSounds.map(
                    (
                      sound,
                    ) => {
                      const isSelected =
                        selectedSound?.id ===
                        sound.id

                      const isPlaying =
                        isSelected &&
                        soundPlaying

                      return (
                        <button
                          key={
                            sound.id
                          }
                          type="button"
                          onClick={() =>
                            toggleSoundPreview(
                              sound,
                            )
                          }
                          className={`flex w-full items-center gap-3 rounded-2xl p-3 text-left transition ${
                            isSelected
                              ? 'bg-white text-black'
                              : 'bg-white/[0.055] text-white active:bg-white/10'
                          }`}
                        >
                          {/* COVER */}

                          {sound.cover_url ? (
                            <img
                              src={
                                sound.cover_url
                              }
                              alt=""
                              className="h-14 w-14 shrink-0 rounded-xl object-cover"
                            />
                          ) : (
                            <div
                              className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl ${
                                isSelected
                                  ? 'bg-black/10'
                                  : 'bg-white/10'
                              }`}
                            >
                              {isPlaying ? (
                                <Volume2
                                  size={
                                    21
                                  }
                                />
                              ) : (
                                <Music2
                                  size={
                                    21
                                  }
                                />
                              )}
                            </div>
                          )}

                          {/* INFO */}

                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">
                              {
                                sound.title
                              }
                            </p>

                            <div className="mt-1 flex min-w-0 items-center gap-2">
                              {sound.artist && (
                                <span
                                  className={`truncate text-xs ${
                                    isSelected
                                      ? 'text-black/50'
                                      : 'text-white/50'
                                  }`}
                                >
                                  {
                                    sound.artist
                                  }
                                </span>
                              )}

                              {sound.genre && (
                                <>
                                  {sound.artist && (
                                    <span
                                      className={
                                        isSelected
                                          ? 'text-black/20'
                                          : 'text-white/20'
                                      }
                                    >
                                      •
                                    </span>
                                  )}

                                  <span
                                    className={`truncate text-xs ${
                                      isSelected
                                        ? 'text-black/40'
                                        : 'text-white/35'
                                    }`}
                                  >
                                    {
                                      sound.genre
                                    }
                                  </span>
                                </>
                              )}

                              {sound.duration_seconds &&
                                sound.duration_seconds >
                                  0 && (
                                  <>
                                    <span
                                      className={
                                        isSelected
                                          ? 'text-black/20'
                                          : 'text-white/20'
                                      }
                                    >
                                      •
                                    </span>

                                    <span
                                      className={`shrink-0 text-xs ${
                                        isSelected
                                          ? 'text-black/50'
                                          : 'text-white/40'
                                      }`}
                                    >
                                      {Math.floor(
                                        sound.duration_seconds /
                                          60,
                                      )}
                                      :
                                      {String(
                                        Math.floor(
                                          sound.duration_seconds %
                                            60,
                                        ),
                                      ).padStart(
                                        2,
                                        '0',
                                      )}
                                    </span>
                                  </>
                                )}
                            </div>

                            {sound.license_type && (
                              <p
                                className={`mt-1 text-[10px] ${
                                  isSelected
                                    ? 'text-black/35'
                                    : 'text-white/25'
                                }`}
                              >
                                {sound.license_type ===
                                'royalty_free'
                                  ? 'Royalty free'
                                  : sound.license_type}
                              </p>
                            )}
                          </div>

                          {/* ACTION */}

                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                              isSelected
                                ? 'bg-black/10'
                                : 'bg-white/10'
                            }`}
                          >
                            {isPlaying ? (
                              <Volume2
                                size={18}
                              />
                            ) : isSelected ? (
                              <Check
                                size={18}
                              />
                            ) : (
                              <Music2
                                size={18}
                              />
                            )}
                          </div>
                        </button>
                      )
                    },
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
          LOCATION
      --------------------------------------------------- */}

      {locationMode && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full rounded-t-[30px] bg-[#111] p-5 pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Localização
              </h2>

              <button
                type="button"
                onClick={() =>
                  setLocationMode(
                    false,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4">
              <MapPin size={19} />

              <input
                autoFocus
                value={
                  location
                }
                onChange={(
                  event,
                ) =>
                  setLocation(
                    event.target
                      .value,
                  )
                }
                placeholder="Ex.: Ilha de Luanda"
                className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setLocationMode(
                  false,
                )
              }
              className="mt-4 w-full rounded-2xl bg-white py-4 text-sm font-bold text-black"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
          TEXT
      --------------------------------------------------- */}

      {textMode && (
        <div className="absolute inset-0 z-50 flex items-end bg-black/50">
          <div className="w-full rounded-t-[30px] bg-[#111] p-5 pb-[max(24px,env(safe-area-inset-bottom))]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Texto
              </h2>

              <button
                type="button"
                onClick={() =>
                  setTextMode(
                    false,
                  )
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <textarea
              autoFocus
              value={caption}
              onChange={(
                event,
              ) =>
                setCaption(
                  event.target.value,
                )
              }
              maxLength={500}
              rows={5}
              placeholder="Escreve algo sobre esta experiência..."
              className="w-full resize-none rounded-2xl bg-white/10 p-4 text-base outline-none placeholder:text-white/40"
            />

            <div className="mt-2 text-right text-xs text-white/40">
              {caption.length}/500
            </div>

            <button
              type="button"
              onClick={() =>
                setTextMode(
                  false,
                )
              }
              className="mt-4 w-full rounded-2xl bg-white py-4 text-sm font-bold text-black"
            >
              Concluir
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
          FILTERS
      --------------------------------------------------- */}

      {filterMode && (
        <div className="absolute inset-x-0 bottom-0 z-50 bg-black/90 p-5 pb-[max(24px,env(safe-area-inset-bottom))] backdrop-blur-xl">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold">
              Filtros
            </h2>

            <button
              type="button"
              onClick={() =>
                setFilterMode(
                  false,
                )
              }
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
            >
              <X size={18} />
            </button>
          </div>

          <div className="flex gap-3 overflow-x-auto pb-2">
            {filters.map(
              (filter) => (
                <button
                  key={
                    filter.id
                  }
                  type="button"
                  onClick={() =>
                    setSelectedFilter(
                      filter.id,
                    )
                  }
                  className="shrink-0"
                >
                  <div
                    className={`h-16 w-16 overflow-hidden rounded-xl border-2 ${
                      selectedFilter ===
                      filter.id
                        ? 'border-white'
                        : 'border-transparent'
                    }`}
                  >
                    {mediaUrl &&
                    mediaType ===
                      'image' ? (
                      <img
                        src={
                          mediaUrl
                        }
                        alt=""
                        className="h-full w-full object-cover"
                        style={{
                          filter:
                            filter.css,
                        }}
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-white/10">
                        <Sparkles
                          size={20}
                        />
                      </div>
                    )}
                  </div>

                  <span className="mt-1 block text-[10px]">
                    {
                      filter.name
                    }
                  </span>
                </button>
              ),
            )}
          </div>
        </div>
      )}

      {/* ---------------------------------------------------
          TAG MODAL
      --------------------------------------------------- */}

      {tagMode && (
        <div className="absolute inset-0 z-[60] flex items-end bg-black/60">
          <div className="max-h-[80vh] w-full overflow-hidden rounded-t-[30px] bg-[#111]">
            <div className="p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold">
                    {tagType ===
                    'agency'
                      ? 'Marcar agência'
                      : 'Marcar hotel'}
                  </h2>

                  <p className="mt-1 text-xs text-white/50">
                    Escolhe uma entidade da Wizenda
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setTagMode(
                      false,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-white/10 px-4">
                <Search size={18} />

                <input
                  autoFocus
                  value={
                    tagSearch
                  }
                  onChange={(
                    event,
                  ) =>
                    setTagSearch(
                      event.target
                        .value,
                    )
                  }
                  placeholder="Pesquisar..."
                  className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
                />
              </div>

              <div className="max-h-[48vh] space-y-2 overflow-y-auto">
                {loadingTags ? (
                  <div className="py-10 text-center text-sm text-white/50">
                    A carregar...
                  </div>
                ) : filteredTagItems.length ===
                  0 ? (
                  <div className="py-10 text-center text-sm text-white/50">
                    Nenhum resultado encontrado.
                  </div>
                ) : (
                  filteredTagItems.map(
                    (item) => (
                      <button
                        key={
                          item.id
                        }
                        type="button"
                        onClick={() => {
                          setTaggedItem(
                            item,
                          )

                          setTagMode(
                            false,
                          )
                        }}
                        className="flex w-full items-center gap-3 rounded-2xl bg-white/5 p-4 text-left"
                      >
                        {/* IMAGE */}

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                          {item.image_url ||
                          item.cover_image ? (
                            <img
                              src={
                                item.image_url ||
                                item.cover_image ||
                                ''
                              }
                              alt={
                                item.name
                              }
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-lg">
                              {tagType ===
                              'agency'
                                ? '🏢'
                                : '🏨'}
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold">
                            {
                              item.name
                            }
                          </p>

                          <p className="mt-1 text-xs text-white/40">
                            {tagType ===
                            'agency'
                              ? 'Agência'
                              : 'Hotel'}
                          </p>
                        </div>

                        <ChevronDown
                          size={18}
                          className="-rotate-90 opacity-40"
                        />
                      </button>
                    ),
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}

      {error && (
        <div className="absolute bottom-24 left-5 right-5 z-[100] rounded-2xl bg-red-500/90 p-4 text-center text-sm font-medium">
          {error}
        </div>
      )}

      {/* GALLERY INPUT */}

      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*,video/*"
        onChange={
          handleGalleryInput
        }
        className="hidden"
      />
    </main>
  )
}