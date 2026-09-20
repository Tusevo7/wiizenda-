
'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  MapPin,
  Music2,
  Pause,
  Play,
  Star,
  Type,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

const filters = [
  {
    id: 'original',
    name: 'Original',
    className: '',
  },
  {
    id: 'warm',
    name: 'Warm',
    className: 'sepia-[0.18] saturate-[1.2]',
  },
  {
    id: 'tropical',
    name: 'Tropical',
    className: 'saturate-[1.45] contrast-[1.08]',
  },
  {
    id: 'cool',
    name: 'Cool',
    className: 'hue-rotate-[12deg] saturate-[0.9]',
  },
  {
    id: 'vintage',
    name: 'Vintage',
    className: 'sepia-[0.4] contrast-[0.8] saturate-[0.8]',
  },
  {
    id: 'bw',
    name: 'P&B',
    className: 'grayscale',
  },
  {
    id: 'dramatic',
    name: 'Drama',
    className: 'contrast-[1.35] saturate-[1.15]',
  },
]

type Sound = {
  id: string
  name: string
  category: string
  url: string
}

const sounds: Sound[] = [
  {
    id: 'angola-vibes',
    name: 'Angola Vibes',
    category: 'África',
    url: '/sounds/angola-vibes.mp3',
  },
  {
    id: 'african-sunset',
    name: 'African Sunset',
    category: 'Relax',
    url: '/sounds/african-sunset.mp3',
  },
  {
    id: 'travel-africa',
    name: 'Travel Africa',
    category: 'Viagem',
    url: '/sounds/travel-africa.mp3',
  },
  {
    id: 'luanda-nights',
    name: 'Luanda Nights',
    category: 'Em alta',
    url: '/sounds/luanda-nights.mp3',
  },
]

type MediaType = 'image' | 'video'

type StoredVideo = {
  blob: Blob
  mimeType: string
}

export default function PublishReviewPage() {
  const router = useRouter()
  const supabase = createClient()

  const [image, setImage] = useState<string | null>(null)
  const [videoUrl, setVideoUrl] = useState<string | null>(null)
  const [videoBlob, setVideoBlob] = useState<Blob | null>(null)
  const [mediaType, setMediaType] =
    useState<MediaType>('image')

  const [selectedFilter, setSelectedFilter] =
    useState('original')

  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] =
    useState<number | null>(null)

  const [selectedSound, setSelectedSound] =
    useState<Sound | null>(null)

  const [originalAudioEnabled, setOriginalAudioEnabled] =
    useState(true)

  const [soundPlaying, setSoundPlaying] =
    useState(false)

  const [activeTool, setActiveTool] =
    useState<
      | 'sound'
      | 'text'
      | 'location'
      | 'rating'
      | null
    >(null)

  const [publishing, setPublishing] =
    useState(false)

  const [processingVideo, setProcessingVideo] =
    useState(false)

  const [error, setError] =
    useState<string | null>(null)

  const [videoReady, setVideoReady] =
    useState(false)

  const previewVideoRef =
    useRef<HTMLVideoElement | null>(null)

  const soundAudioRef =
    useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    let objectUrl: string | null = null

    async function loadMedia() {
      const savedImage =
        sessionStorage.getItem(
          'wizenda-review-image',
        )

      const savedMediaType =
        sessionStorage.getItem(
          'wizenda-review-media-type',
        )

      const savedFilter =
        sessionStorage.getItem(
          'wizenda-review-filter',
        )

      if (savedFilter) {
        setSelectedFilter(savedFilter)
      }

      if (savedMediaType === 'video') {
        const stored =
          await getStoredVideo()

        if (!stored) {
          router.replace('/review/create')
          return
        }

        objectUrl = URL.createObjectURL(
          stored.blob,
        )

        setVideoBlob(stored.blob)
        setVideoUrl(objectUrl)
        setMediaType('video')

        return
      }

      if (!savedImage) {
        router.replace('/review/create')
        return
      }

      setImage(savedImage)
      setMediaType('image')
    }

    loadMedia()

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [router])

  useEffect(() => {
    return () => {
      if (videoUrl) {
        URL.revokeObjectURL(videoUrl)
      }
    }
  }, [videoUrl])

  const currentFilter =
    filters.find(
      (filter) =>
        filter.id === selectedFilter,
    ) ?? filters[0]

  async function getStoredVideo(): Promise<StoredVideo | null> {
    return new Promise((resolve) => {
      if (typeof window === 'undefined') {
        resolve(null)
        return
      }

      const request =
        indexedDB.open(
          'wizenda-review',
          1,
        )

      request.onerror = () => {
        resolve(null)
      }

      request.onsuccess = () => {
        const db = request.result

        try {
          const transaction =
            db.transaction(
              'videos',
              'readonly',
            )

          const store =
            transaction.objectStore(
              'videos',
            )

          const getRequest =
            store.get('current')

          getRequest.onsuccess = () => {
            const result =
              getRequest.result

            if (!result?.blob) {
              resolve(null)
              return
            }

            resolve({
              blob: result.blob,
              mimeType:
                result.mimeType ??
                result.blob.type ??
                'video/webm',
            })
          }

          getRequest.onerror = () => {
            resolve(null)
          }
        } catch {
          resolve(null)
        }
      }
    })
  }

  async function deleteStoredVideo() {
    return new Promise<void>((resolve) => {
      if (typeof window === 'undefined') {
        resolve()
        return
      }

      const request =
        indexedDB.open(
          'wizenda-review',
          1,
        )

      request.onerror = () => {
        resolve()
      }

      request.onsuccess = () => {
        const db = request.result

        try {
          const transaction =
            db.transaction(
              'videos',
              'readwrite',
            )

          const store =
            transaction.objectStore(
              'videos',
            )

          store.delete('current')

          transaction.oncomplete = () => {
            resolve()
          }

          transaction.onerror = () => {
            resolve()
          }
        } catch {
          resolve()
        }
      }
    })
  }

  function dataUrlToBlob(dataUrl: string) {
    const parts = dataUrl.split(',')

    const mimeMatch = parts[0].match(
      /data:(.*?);base64/,
    )

    const mime =
      mimeMatch?.[1] ??
      'image/jpeg'

    const byteString =
      atob(parts[1])

    const arrayBuffer =
      new ArrayBuffer(
        byteString.length,
      )

    const uint8Array =
      new Uint8Array(
        arrayBuffer,
      )

    for (
      let index = 0;
      index < byteString.length;
      index++
    ) {
      uint8Array[index] =
        byteString.charCodeAt(index)
    }

    return new Blob(
      [arrayBuffer],
      {
        type: mime,
      },
    )
  }

  function toggleTool(
    tool:
      | 'sound'
      | 'text'
      | 'location'
      | 'rating',
  ) {
    setActiveTool((current) =>
      current === tool
        ? null
        : tool,
    )
  }

  function selectSound(sound: Sound) {
    setSelectedSound(sound)

    if (soundAudioRef.current) {
      soundAudioRef.current.pause()
      soundAudioRef.current.currentTime = 0
    }

    setSoundPlaying(false)
  }

  async function toggleSoundPreview() {
    if (!selectedSound) {
      return
    }

    const audio =
      soundAudioRef.current

    if (!audio) {
      return
    }

    try {
      if (soundPlaying) {
        audio.pause()
        setSoundPlaying(false)
      } else {
        await audio.play()
        setSoundPlaying(true)
      }
    } catch (audioError) {
      console.error(
        'Erro ao reproduzir som:',
        audioError,
      )

      setError(
        'Não foi possível reproduzir este som.',
      )
    }
  }

  function getSupportedVideoMimeType() {
    if (
      typeof MediaRecorder ===
      'undefined'
    ) {
      return ''
    }

    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
      'video/mp4',
    ]

    return (
      types.find((type) =>
        MediaRecorder.isTypeSupported(
          type,
        ),
      ) ?? ''
    )
  }

  async function createVideoWithAudio(
    sourceBlob: Blob,
    musicUrl: string | null,
    keepOriginalAudio: boolean,
  ): Promise<Blob> {
    if (
      !musicUrl &&
      keepOriginalAudio
    ) {
      return sourceBlob
    }

    setProcessingVideo(true)

    try {
      const video =
        document.createElement(
          'video',
        )

      video.src =
        URL.createObjectURL(
          sourceBlob,
        )

      video.muted = false
      video.playsInline = true
      video.crossOrigin = 'anonymous'

      await new Promise<void>(
        (resolve, reject) => {
          video.onloadedmetadata =
            () => resolve()

          video.onerror = () =>
            reject(
              new Error(
                'Não foi possível carregar o vídeo.',
              ),
            )
        },
      )

      const canvas =
        document.createElement(
          'canvas',
        )

      canvas.width =
        video.videoWidth || 1080

      canvas.height =
        video.videoHeight || 1920

      const canvasContext =
        canvas.getContext('2d')

      if (!canvasContext) {
        throw new Error(
          'Canvas não disponível.',
        )
      }

      const canvasStream =
        canvas.captureStream(30)

      const audioContext =
        new AudioContext()

      const destination =
        audioContext.createMediaStreamDestination()

      let videoSource:
        MediaElementAudioSourceNode | null =
        null

      if (keepOriginalAudio) {
        videoSource =
          audioContext.createMediaElementSource(
            video,
          )

        videoSource.connect(
          destination,
        )
      }

      let musicAudio:
        HTMLAudioElement | null =
        null

      let musicSource:
        MediaElementAudioSourceNode | null =
        null

      if (musicUrl) {
        musicAudio =
          document.createElement(
            'audio',
          )

        musicAudio.src = musicUrl
        musicAudio.crossOrigin =
          'anonymous'
        musicAudio.loop = true

        await new Promise<void>(
          (resolve, reject) => {
            musicAudio!.oncanplay =
              () => resolve()

            musicAudio!.onerror =
              () =>
                reject(
                  new Error(
                    'Não foi possível carregar a música.',
                  ),
                )
          },
        )

        musicSource =
          audioContext.createMediaElementSource(
            musicAudio,
          )

        musicSource.connect(
          destination,
        )
      }

      const combinedStream =
        new MediaStream()

      canvasStream
        .getVideoTracks()
        .forEach((track) => {
          combinedStream.addTrack(
            track,
          )
        })

      destination.stream
        .getAudioTracks()
        .forEach((track) => {
          combinedStream.addTrack(
            track,
          )
        })

      const mimeType =
        getSupportedVideoMimeType()

      const recorder =
        mimeType
          ? new MediaRecorder(
              combinedStream,
              {
                mimeType,
              },
            )
          : new MediaRecorder(
              combinedStream,
            )

      const chunks: Blob[] = []

      recorder.ondataavailable = (
        event,
      ) => {
        if (
          event.data &&
          event.data.size > 0
        ) {
          chunks.push(
            event.data,
          )
        }
      }

      const recordingPromise =
        new Promise<Blob>(
          (resolve, reject) => {
            recorder.onstop = () => {
              const finalMime =
                recorder.mimeType ||
                mimeType ||
                'video/webm'

              resolve(
                new Blob(
                  chunks,
                  {
                    type: finalMime,
                  },
                ),
              )
            }

            recorder.onerror = () => {
              reject(
                new Error(
                  'Erro ao processar o vídeo.',
                ),
              )
            }
          },
        )

      await video.play()

      if (musicAudio) {
        await musicAudio.play()
      }

      const drawFrame = () => {
        if (
          video.paused ||
          video.ended
        ) {
          return
        }

        canvasContext.drawImage(
          video,
          0,
          0,
          canvas.width,
          canvas.height,
        )

        requestAnimationFrame(
          drawFrame,
        )
      }

      drawFrame()

      recorder.start(250)

      await new Promise<void>(
        (resolve) => {
          video.onended = () =>
            resolve()
        },
      )

      recorder.stop()

      const finalBlob =
        await recordingPromise

      video.pause()

      if (musicAudio) {
        musicAudio.pause()
      }

      videoSource?.disconnect()
      musicSource?.disconnect()

      await audioContext.close()

      canvasStream
        .getTracks()
        .forEach((track) =>
          track.stop(),
        )

      destination.stream
        .getTracks()
        .forEach((track) =>
          track.stop(),
        )

      URL.revokeObjectURL(
        video.src,
      )

      return finalBlob
    } finally {
      setProcessingVideo(false)
    }
  }

  async function uploadVideo(
    blob: Blob,
    userId: string,
  ) {
    const extension =
      blob.type.includes('mp4')
        ? 'mp4'
        : 'webm'

    const fileName = `${crypto.randomUUID()}.${extension}`

    const filePath =
      `${userId}/${fileName}`

    const { error: uploadError } =
      await supabase.storage
        .from('community-media')
        .upload(
          filePath,
          blob,
          {
            contentType:
              blob.type ||
              `video/${extension}`,
            cacheControl: '3600',
            upsert: false,
          },
        )

    if (uploadError) {
      throw uploadError
    }

    const {
      data: publicUrlData,
    } = supabase.storage
      .from('community-media')
      .getPublicUrl(filePath)

    return {
      filePath,
      mediaUrl:
        publicUrlData.publicUrl,
    }
  }

  async function uploadImage(
    blob: Blob,
    userId: string,
  ) {
    const fileName = `${crypto.randomUUID()}.jpg`

    const filePath =
      `${userId}/${fileName}`

    const { error: uploadError } =
      await supabase.storage
        .from('community-media')
        .upload(
          filePath,
          blob,
          {
            contentType:
              'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          },
        )

    if (uploadError) {
      throw uploadError
    }

    const {
      data: publicUrlData,
    } =
      supabase.storage
        .from(
          'community-media',
        )
        .getPublicUrl(
          filePath,
        )

    return {
      filePath,
      mediaUrl:
        publicUrlData.publicUrl,
    }
  }

  async function publishPost() {
    if (
      publishing ||
      processingVideo
    ) {
      return
    }

    if (
      mediaType === 'image' &&
      !image
    ) {
      return
    }

    if (
      mediaType === 'video' &&
      !videoBlob
    ) {
      return
    }

    try {
      setPublishing(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } =
        await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

      if (profileError) {
        throw profileError
      }

      let postType:
        | 'traveler'
        | 'agency'
        | 'hotel'
        | 'wizenda' =
        'traveler'

      if (
        profile?.role ===
        'agency'
      ) {
        postType = 'agency'
      }

      let filePath = ''
      let mediaUrl = ''

      if (mediaType === 'image') {
        const blob =
          dataUrlToBlob(
            image!,
          )

        const uploaded =
          await uploadImage(
            blob,
            user.id,
          )

        filePath =
          uploaded.filePath

        mediaUrl =
          uploaded.mediaUrl
      } else {
        const processedVideo =
          await createVideoWithAudio(
            videoBlob!,
            selectedSound?.url ??
              null,
            originalAudioEnabled,
          )

        const uploaded =
          await uploadVideo(
            processedVideo,
            user.id,
          )

        filePath =
          uploaded.filePath

        mediaUrl =
          uploaded.mediaUrl
      }

      const { error: postError } =
        await supabase
          .from(
            'community_posts',
          )
          .insert({
            user_id: user.id,
            post_type: postType,
            media_type:
              mediaType,
            media_url:
              mediaUrl,
            caption:
              caption.trim() ||
              null,
            location:
              location.trim() ||
              null,
            rating,
            sound_name:
              selectedSound?.name ??
              null,
            sound_url:
              selectedSound?.url ??
              null,
          })

      if (postError) {
        await supabase.storage
          .from(
            'community-media',
          )
          .remove([
            filePath,
          ])

        throw postError
      }

      sessionStorage.removeItem(
        'wizenda-review-image',
      )

      sessionStorage.removeItem(
        'wizenda-review-filter',
      )

      sessionStorage.removeItem(
        'wizenda-review-media-type',
      )

      await deleteStoredVideo()

      router.push('/review')
    } catch (publishError) {
      console.error(
        'Erro ao publicar Review:',
        publishError,
      )

      setError(
        'Não foi possível publicar o Review. Tenta novamente.',
      )
    } finally {
      setPublishing(false)
      setProcessingVideo(false)
    }
  }

  function goBack() {
    sessionStorage.removeItem(
      'wizenda-review-image',
    )

    sessionStorage.removeItem(
      'wizenda-review-filter',
    )

    sessionStorage.removeItem(
      'wizenda-review-media-type',
    )

    deleteStoredVideo()

    router.push('/review/create')
  }

  if (
    !image &&
    !videoUrl
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-sm text-white/70">
          A preparar o Review...
        </p>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col">

        {/* HEADER */}

        <header className="flex h-16 shrink-0 items-center justify-between border-b border-white/10 px-4">
          <button
            type="button"
            onClick={goBack}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft size={21} />
          </button>

          <span className="text-sm font-bold">
            Novo Review
          </span>

          <button
            type="button"
            onClick={() =>
              router.push('/review')
            }
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Fechar"
          >
            <X size={21} />
          </button>
        </header>

        {/* PREVIEW */}

        <div className="relative mx-4 mt-4 aspect-[4/5] overflow-hidden rounded-[4px] bg-gray-900">

          {mediaType === 'image' &&
            image && (
              <img
                src={image}
                alt="Pré-visualização do Review"
                className={`h-full w-full object-cover ${currentFilter.className}`}
              />
            )}

          {mediaType === 'video' &&
            videoUrl && (
              <video
                ref={previewVideoRef}
                src={videoUrl}
                autoPlay
                loop
                playsInline
                controls
                muted={
                  !originalAudioEnabled
                }
                onLoadedMetadata={() =>
                  setVideoReady(true)
                }
                className={`h-full w-full object-cover ${currentFilter.className}`}
              />
            )}

          {/* TEXTO */}

          {caption.trim() && (
            <div className="absolute inset-x-5 bottom-5 pointer-events-none">
              <p className="text-center text-lg font-bold text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                {caption}
              </p>
            </div>
          )}

          {/* LOCAL */}

          {location.trim() && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/50 px-3 py-2 text-xs backdrop-blur-md">
              <MapPin
                size={13}
                className="text-orange-400"
              />

              <span>
                {location}
              </span>
            </div>
          )}

          {/* INDICADOR DE VÍDEO */}

          {mediaType === 'video' &&
            videoReady && (
              <div className="absolute right-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[10px] backdrop-blur-md">
                Vídeo
              </div>
            )}
        </div>

        {/* FERRAMENTAS */}

        <div className="flex items-center justify-around px-4 py-5">

          <button
            type="button"
            onClick={() =>
              toggleTool('sound')
            }
            className={`flex flex-col items-center gap-1.5 ${
              activeTool === 'sound'
                ? 'text-orange-400'
                : 'text-white'
            }`}
          >
            <Music2 size={21} />

            <span className="text-[10px]">
              Som
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              toggleTool('text')
            }
            className={`flex flex-col items-center gap-1.5 ${
              activeTool === 'text'
                ? 'text-orange-400'
                : 'text-white'
            }`}
          >
            <Type size={21} />

            <span className="text-[10px]">
              Texto
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              toggleTool('location')
            }
            className={`flex flex-col items-center gap-1.5 ${
              activeTool ===
              'location'
                ? 'text-orange-400'
                : 'text-white'
            }`}
          >
            <MapPin size={21} />

            <span className="text-[10px]">
              Local
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              toggleTool('rating')
            }
            className={`flex flex-col items-center gap-1.5 ${
              activeTool ===
              'rating'
                ? 'text-orange-400'
                : 'text-white'
            }`}
          >
            <Star size={21} />

            <span className="text-[10px]">
              Avaliar
            </span>
          </button>
        </div>

        {/* PAINEL DE SOM */}

        {activeTool === 'sound' && (
          <section className="border-t border-white/10 px-4 py-4">

            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold">
                  Escolher som
                </h2>

                <p className="mt-1 text-[10px] text-white/40">
                  Adiciona música ao Review
                </p>
              </div>

              {selectedSound && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedSound(
                      null,
                    )

                    if (
                      soundAudioRef.current
                    ) {
                      soundAudioRef.current.pause()
                      soundAudioRef.current.currentTime = 0
                    }

                    setSoundPlaying(
                      false,
                    )
                  }}
                  className="text-xs text-white/50"
                >
                  Remover
                </button>
              )}
            </div>

            {/* ÁUDIO ORIGINAL DO VÍDEO */}

            {mediaType ===
              'video' && (
              <div className="mb-4 flex items-center justify-between rounded-[4px] border border-white/10 bg-white/5 p-3">

                <div className="flex items-center gap-3">

                  {originalAudioEnabled ? (
                    <Volume2
                      size={19}
                      className="text-orange-400"
                    />
                  ) : (
                    <VolumeX
                      size={19}
                      className="text-white/40"
                    />
                  )}

                  <div>
                    <p className="text-sm font-semibold">
                      Áudio original
                    </p>

                    <p className="text-[10px] text-white/40">
                      Som captado pelo microfone
                    </p>
                  </div>

                </div>

                <button
                  type="button"
                  onClick={() =>
                    setOriginalAudioEnabled(
                      (current) =>
                        !current,
                    )
                  }
                  className={`relative h-6 w-11 rounded-full transition ${
                    originalAudioEnabled
                      ? 'bg-orange-500'
                      : 'bg-white/20'
                  }`}
                  aria-label={
                    originalAudioEnabled
                      ? 'Desligar áudio original'
                      : 'Ligar áudio original'
                  }
                >
                  <span
                    className={`absolute top-1 h-4 w-4 rounded-full bg-white transition ${
                      originalAudioEnabled
                        ? 'left-6'
                        : 'left-1'
                    }`}
                  />
                </button>
              </div>
            )}

            {/* SOM SELECIONADO */}

            {selectedSound && (
              <div className="mb-4 rounded-[4px] border border-orange-500/40 bg-orange-500/10 p-3">

                <div className="flex items-center gap-3">

                  <button
                    type="button"
                    onClick={
                      toggleSoundPreview
                    }
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white"
                  >
                    {soundPlaying ? (
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

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">
                      {selectedSound.name}
                    </p>

                    <p className="text-[10px] text-white/50">
                      {selectedSound.category}
                    </p>
                  </div>

                </div>

                <audio
                  ref={
                    soundAudioRef
                  }
                  src={
                    selectedSound.url
                  }
                  onEnded={() =>
                    setSoundPlaying(
                      false,
                    )
                  }
                />
              </div>
            )}

            {/* LISTA DE SONS */}

            <div className="space-y-2">
              {sounds.map(
                (sound) => {
                  const active =
                    selectedSound?.id ===
                    sound.id

                  return (
                    <button
                      key={
                        sound.id
                      }
                      type="button"
                      onClick={() =>
                        selectSound(
                          sound,
                        )
                      }
                      className={`flex w-full items-center gap-3 rounded-[4px] border p-3 text-left ${
                        active
                          ? 'border-orange-500 bg-orange-500/10'
                          : 'border-white/10 bg-white/5'
                      }`}
                    >
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                        <Music2
                          size={17}
                        />
                      </div>

                      <div className="flex-1">
                        <p className="text-sm font-semibold">
                          {sound.name}
                        </p>

                        <p className="text-[11px] text-white/50">
                          {sound.category}
                        </p>
                      </div>

                      {active && (
                        <Check
                          size={18}
                          className="text-orange-400"
                        />
                      )}
                    </button>
                  )
                },
              )}
            </div>

            {mediaType ===
              'video' && (
              <p className="mt-4 text-center text-[10px] leading-4 text-white/35">
                Se escolher um som, ele será
                incorporado ao vídeo.
                Podes manter ou desligar
                o áudio original.
              </p>
            )}

          </section>
        )}

        {/* PAINEL DE TEXTO */}

        {activeTool === 'text' && (
          <section className="border-t border-white/10 px-4 py-4">

            <h2 className="mb-3 text-sm font-bold">
              Texto do Review
            </h2>

            <textarea
              value={caption}
              onChange={(event) =>
                setCaption(
                  event.target.value,
                )
              }
              maxLength={220}
              placeholder="Escreve algo sobre esta experiência..."
              className="min-h-24 w-full resize-none rounded-[4px] border border-white/10 bg-white/5 p-3 text-sm outline-none placeholder:text-white/35 focus:border-orange-500"
            />

            <p className="mt-1 text-right text-[10px] text-white/40">
              {caption.length}/220
            </p>

          </section>
        )}

        {/* PAINEL DE LOCAL */}

        {activeTool ===
          'location' && (
          <section className="border-t border-white/10 px-4 py-4">

            <h2 className="mb-3 text-sm font-bold">
              Localização
            </h2>

            <div className="flex items-center gap-2 rounded-[4px] border border-white/10 bg-white/5 px-3">

              <MapPin
                size={18}
                className="text-orange-400"
              />

              <input
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Ex.: Ilha do Mussulo, Luanda"
                className="h-12 flex-1 bg-transparent text-sm outline-none placeholder:text-white/35"
              />

            </div>

          </section>
        )}

        {/* PAINEL DE AVALIAÇÃO */}

        {activeTool ===
          'rating' && (
          <section className="border-t border-white/10 px-4 py-4">

            <h2 className="mb-3 text-sm font-bold">
              Avaliar experiência
            </h2>

            <div className="flex items-center justify-center gap-3">
              {[1, 2, 3, 4, 5].map(
                (value) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(
                        value,
                      )
                    }
                    aria-label={`${value} estrelas`}
                  >
                    <Star
                      size={31}
                      fill={
                        rating !==
                          null &&
                        value <=
                          rating
                          ? 'currentColor'
                          : 'none'
                      }
                      className={
                        rating !==
                          null &&
                        value <=
                          rating
                          ? 'text-orange-400'
                          : 'text-white/30'
                      }
                    />
                  </button>
                ),
              )}
            </div>

          </section>
        )}

        {/* PROCESSAMENTO */}

        {processingVideo && (
          <div className="mx-4 mt-3 rounded-[4px] border border-orange-500/30 bg-orange-500/10 p-3 text-center">

            <div className="flex items-center justify-center gap-2 text-xs text-orange-300">

              <span className="h-4 w-4 animate-spin rounded-full border-2 border-orange-300/30 border-t-orange-300" />

              A preparar o vídeo e o áudio...

            </div>

            <p className="mt-1 text-[10px] text-white/40">
              Isto pode demorar alguns segundos.
            </p>

          </div>
        )}

        {/* ERRO */}

        {error && (
          <div className="mx-4 mt-3 rounded-[4px] border border-red-500/30 bg-red-500/10 p-3 text-center text-xs text-red-300">
            {error}
          </div>
        )}

        {/* PUBLICAR */}

        <div className="mt-auto border-t border-white/10 p-4">

          <button
            type="button"
            onClick={
              publishPost
            }
            disabled={
              publishing ||
              processingVideo
            }
            className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-orange-500 py-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >

            {publishing ||
            processingVideo ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                {processingVideo
                  ? 'A preparar vídeo...'
                  : 'A publicar...'}
              </>
            ) : (
              <>
                <Check size={19} />

                Publicar Review
              </>
            )}

          </button>

        </div>

      </div>
    </main>
  )
}
