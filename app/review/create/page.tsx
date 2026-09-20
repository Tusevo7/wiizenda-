
'use client'

import {
  ArrowLeft,
  Check,
  MapPin,
  Music2,
  Star,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

type Sound = {
  id: string
  name: string
  category: string
  url: string
}

type StoredVideo = {
  blob: Blob
  mimeType: string
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

async function getStoredVideo(): Promise<StoredVideo | null> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(null)
      return
    }

    const request = indexedDB.open(
      'wizenda-review',
      1,
    )

    request.onerror = () => {
      console.error(
        'Erro ao abrir IndexedDB:',
        request.error,
      )

      resolve(null)
    }

    request.onsuccess = () => {
      const db = request.result

      try {
        const transaction = db.transaction(
          'videos',
          'readonly',
        )

        const store =
          transaction.objectStore('videos')

        const getRequest =
          store.get('current')

        getRequest.onsuccess = () => {
          const result = getRequest.result

          if (result instanceof Blob) {
            resolve({
              blob: result,
              mimeType:
                result.type || 'video/webm',
            })

            db.close()
            return
          }

          if (
            result &&
            result.blob instanceof Blob
          ) {
            resolve({
              blob: result.blob,
              mimeType:
                result.mimeType ||
                result.blob.type ||
                'video/webm',
            })

            db.close()
            return
          }

          console.error(
            'Vídeo não encontrado no IndexedDB.',
            result,
          )

          resolve(null)
          db.close()
        }

        getRequest.onerror = () => {
          console.error(
            'Erro ao ler vídeo do IndexedDB:',
            getRequest.error,
          )

          resolve(null)
          db.close()
        }
      } catch (error) {
        console.error(
          'Erro ao acessar vídeo:',
          error,
        )

        resolve(null)

        try {
          db.close()
        } catch {
          // Ignorar
        }
      }
    }
  })
}

export default function CreateReviewPublishPage() {
  const router = useRouter()
  const supabase = createClient()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const [mediaType, setMediaType] =
    useState<'image' | 'video'>('image')

  const [imageUrl, setImageUrl] =
    useState<string | null>(null)

  const [videoUrl, setVideoUrl] =
    useState<string | null>(null)

  const [videoBlob, setVideoBlob] =
    useState<Blob | null>(null)

  const [caption, setCaption] =
    useState('')

  const [location, setLocation] =
    useState('')

  const [rating, setRating] =
    useState(0)

  const [selectedSound, setSelectedSound] =
    useState<Sound | null>(null)

  const [showSounds, setShowSounds] =
    useState(false)

  const [showLocation, setShowLocation] =
    useState(false)

  const [showRating, setShowRating] =
    useState(false)

  const [originalAudioEnabled, setOriginalAudioEnabled] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  useEffect(() => {
    let active = true
    let objectUrl: string | null = null

    async function loadMedia() {
      const type =
        sessionStorage.getItem(
          'wizenda-review-media-type',
        )

      if (type === 'video') {
        setMediaType('video')

        const storedVideo =
          await getStoredVideo()

        if (!active) {
          return
        }

        if (!storedVideo) {
          setError(
            'Não foi possível recuperar o vídeo gravado.',
          )

          return
        }

        objectUrl = URL.createObjectURL(
          storedVideo.blob,
        )

        setVideoBlob(storedVideo.blob)
        setVideoUrl(objectUrl)

        return
      }

      const storedImage =
        sessionStorage.getItem(
          'wizenda-review-image',
        )

      if (storedImage) {
        setMediaType('image')
        setImageUrl(storedImage)
      }
    }

    loadMedia()

    return () => {
      active = false

      if (objectUrl) {
        URL.revokeObjectURL(objectUrl)
      }
    }
  }, [])

  function toggleOriginalAudio() {
    const next =
      !originalAudioEnabled

    setOriginalAudioEnabled(next)

    if (videoRef.current) {
      videoRef.current.muted = !next
    }
  }

  function selectSound(sound: Sound) {
    setSelectedSound(sound)
    setShowSounds(false)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }

    setTimeout(() => {
      audioRef.current?.play().catch(() => {
        // O navegador pode bloquear autoplay.
      })
    }, 100)
  }

  function removeSound() {
    setSelectedSound(null)

    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
  }

  async function publish() {
    if (saving) {
      return
    }

    setSaving(true)
    setError('')

    try {
      const {
        data: {
          user,
        },
        error: authError,
      } = await supabase.auth.getUser()

      if (authError || !user) {
        throw new Error(
          'Precisas iniciar sessão para publicar.',
        )
      }

      let mediaUrl = ''
      let uploadedPath = ''

      if (mediaType === 'image') {
        if (!imageUrl) {
          throw new Error(
            'Imagem não encontrada.',
          )
        }

        const response =
          await fetch(imageUrl)

        const blob =
          await response.blob()

        const path =
          `${user.id}/${crypto.randomUUID()}.jpg`

        const { error: uploadError } =
          await supabase.storage
            .from('community-media')
            .upload(
              path,
              blob,
              {
                contentType:
                  blob.type || 'image/jpeg',
                upsert: false,
              },
            )

        if (uploadError) {
          throw uploadError
        }

        uploadedPath = path

        const {
          data: publicData,
        } = supabase.storage
          .from('community-media')
          .getPublicUrl(path)

        mediaUrl =
          publicData.publicUrl
      } else {
        if (!videoBlob) {
          throw new Error(
            'Vídeo não encontrado.',
          )
        }

        const extension =
          videoBlob.type.includes('mp4')
            ? 'mp4'
            : 'webm'

        const path =
          `${user.id}/${crypto.randomUUID()}.${extension}`

        const { error: uploadError } =
          await supabase.storage
            .from('community-media')
            .upload(
              path,
              videoBlob,
              {
                contentType:
                  videoBlob.type ||
                  'video/webm',
                upsert: false,
              },
            )

        if (uploadError) {
          throw uploadError
        }

        uploadedPath = path

        const {
          data: publicData,
        } = supabase.storage
          .from('community-media')
          .getPublicUrl(path)

        mediaUrl =
          publicData.publicUrl
      }

      const { data: profile } =
        await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .maybeSingle()

      const postType =
        profile?.role === 'agency'
          ? 'agency'
          : 'traveler'

      const { error: insertError } =
        await supabase
          .from('community_posts')
          .insert({
            user_id: user.id,
            post_type: postType,
            media_type: mediaType,
            media_url: mediaUrl,
            caption:
              caption.trim() || null,
            location:
              location.trim() || null,
            rating:
              rating > 0
                ? rating
                : null,
            sound_name:
              selectedSound?.name ?? null,
            sound_url:
              selectedSound?.url ?? null,
          })

      if (insertError) {
        if (uploadedPath) {
          await supabase.storage
            .from('community-media')
            .remove([uploadedPath])
        }

        throw insertError
      }

      sessionStorage.removeItem(
        'wizenda-review-image',
      )

      sessionStorage.removeItem(
        'wizenda-review-media-type',
      )

      sessionStorage.removeItem(
        'wizenda-review-filter',
      )

      const dbRequest =
        indexedDB.open(
          'wizenda-review',
          1,
        )

      dbRequest.onsuccess = () => {
        const db = dbRequest.result

        try {
          const transaction =
            db.transaction(
              'videos',
              'readwrite',
            )

          transaction
            .objectStore('videos')
            .delete('current')

          transaction.oncomplete = () => {
            db.close()
          }
        } catch {
          try {
            db.close()
          } catch {
            // Ignorar
          }
        }
      }

      router.replace('/review')
    } catch (err) {
      console.error(
        'Erro ao publicar review:',
        err,
      )

      setError(
        err instanceof Error
          ? err.message
          : 'Não foi possível publicar.',
      )

      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-white pb-28">
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <button
            type="button"
            onClick={() =>
              router.back()
            }
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft
              size={21}
            />
          </button>

          <h1 className="text-base font-bold text-gray-950">
            Novo Review
          </h1>

          <button
            type="button"
            onClick={publish}
            disabled={saving}
            className="flex h-10 items-center justify-center rounded-full bg-orange-500 px-5 text-sm font-bold text-white disabled:opacity-50"
          >
            {saving
              ? 'A publicar...'
              : 'Publicar'}
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-2xl px-4 pt-5">
        <div className="overflow-hidden rounded-[4px] bg-black">
          {mediaType === 'image' &&
            imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-[70vh] w-full object-contain"
              />
            )}

          {mediaType === 'video' &&
            videoUrl && (
              <video
                ref={videoRef}
                src={videoUrl}
                controls
                playsInline
                className="max-h-[70vh] w-full object-contain"
                muted={
                  !originalAudioEnabled
                }
              />
            )}
        </div>

        {mediaType === 'video' && (
          <div className="mt-3 flex items-center justify-between rounded-[4px] border border-gray-200 bg-white p-3">
            <div className="flex items-center gap-3">
              {originalAudioEnabled ? (
                <Volume2
                  size={20}
                  className="text-orange-500"
                />
              ) : (
                <VolumeX
                  size={20}
                  className="text-gray-400"
                />
              )}

              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Áudio original
                </p>

                <p className="text-xs text-gray-500">
                  {originalAudioEnabled
                    ? 'Ligado'
                    : 'Desligado'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={
                toggleOriginalAudio
              }
              className={`relative h-7 w-12 rounded-full transition ${
                originalAudioEnabled
                  ? 'bg-orange-500'
                  : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white transition ${
                  originalAudioEnabled
                    ? 'left-6'
                    : 'left-1'
                }`}
              />
            </button>
          </div>
        )}

        <div className="mt-5">
          <textarea
            value={caption}
            onChange={(event) =>
              setCaption(
                event.target.value,
              )
            }
            placeholder="Conta a tua experiência..."
            rows={4}
            className="w-full resize-none rounded-[4px] border border-gray-200 bg-gray-50 p-4 text-sm outline-none focus:border-orange-500"
          />
        </div>

        <div className="mt-4 grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() =>
              setShowSounds(true)
            }
            className="flex flex-col items-center gap-2 rounded-[4px] border border-gray-200 p-3"
          >
            <Music2
              size={20}
              className="text-orange-500"
            />

            <span className="text-xs font-medium">
              Som
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowLocation(true)
            }
            className="flex flex-col items-center gap-2 rounded-[4px] border border-gray-200 p-3"
          >
            <MapPin
              size={20}
              className="text-orange-500"
            />

            <span className="text-xs font-medium">
              Local
            </span>
          </button>

          <button
            type="button"
            onClick={() =>
              setShowRating(true)
            }
            className="flex flex-col items-center gap-2 rounded-[4px] border border-gray-200 p-3"
          >
            <Star
              size={20}
              className="text-orange-500"
            />

            <span className="text-xs font-medium">
              Avaliar
            </span>
          </button>

          <button
            type="button"
            onClick={publish}
            disabled={saving}
            className="flex flex-col items-center gap-2 rounded-[4px] bg-orange-500 p-3 text-white disabled:opacity-50"
          >
            <Check size={20} />

            <span className="text-xs font-bold">
              Publicar
            </span>
          </button>
        </div>

        {selectedSound && (
          <div className="mt-4 flex items-center justify-between rounded-[4px] bg-orange-50 p-3">
            <div className="flex items-center gap-3">
              <Music2
                size={20}
                className="text-orange-500"
              />

              <div>
                <p className="text-sm font-semibold">
                  {selectedSound.name}
                </p>

                <p className="text-xs text-gray-500">
                  {selectedSound.category}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeSound}
              className="text-gray-500"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {location && (
          <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
            <MapPin
              size={16}
              className="text-orange-500"
            />

            {location}
          </div>
        )}

        {rating > 0 && (
          <div className="mt-3 flex items-center gap-1">
            {Array.from({
              length: 5,
            }).map((_, index) => (
              <Star
                key={index}
                size={17}
                className={
                  index < rating
                    ? 'fill-orange-500 text-orange-500'
                    : 'text-gray-300'
                }
              />
            ))}
          </div>
        )}

        {error && (
          <div className="mt-4 rounded-[4px] bg-red-50 p-3 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>

      {selectedSound && (
        <audio
          ref={audioRef}
          src={selectedSound.url}
          loop
        />
      )}

      {showSounds && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="w-full rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Escolher som
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowSounds(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              {sounds.map(
                (sound) => (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() =>
                      selectSound(
                        sound,
                      )
                    }
                    className="flex w-full items-center gap-3 rounded-[4px] border border-gray-200 p-4 text-left hover:bg-gray-50"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100">
                      <Music2
                        size={20}
                        className="text-orange-500"
                      />
                    </div>

                    <div>
                      <p className="text-sm font-semibold">
                        {sound.name}
                      </p>

                      <p className="text-xs text-gray-500">
                        {sound.category}
                      </p>
                    </div>
                  </button>
                ),
              )}
            </div>
          </div>
        </div>
      )}

      {showLocation && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="w-full rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Localização
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowLocation(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex items-center gap-3 rounded-[4px] border border-gray-200 px-4">
              <MapPin
                size={19}
                className="text-orange-500"
              />

              <input
                autoFocus
                value={location}
                onChange={(event) =>
                  setLocation(
                    event.target.value,
                  )
                }
                placeholder="Ex.: Ilha do Mussulo, Luanda"
                className="h-12 flex-1 bg-transparent text-sm outline-none"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                setShowLocation(false)
              }
              className="mt-4 w-full rounded-[4px] bg-orange-500 py-3 text-sm font-bold text-white"
            >
              Confirmar localização
            </button>
          </div>
        </div>
      )}

      {showRating && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/40">
          <div className="w-full rounded-t-2xl bg-white p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                Avaliar experiência
              </h2>

              <button
                type="button"
                onClick={() =>
                  setShowRating(false)
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex justify-center gap-3 py-5">
              {Array.from({
                length: 5,
              }).map((_, index) => {
                const value =
                  index + 1

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() =>
                      setRating(
                        value,
                      )
                    }
                  >
                    <Star
                      size={34}
                      className={
                        value <= rating
                          ? 'fill-orange-500 text-orange-500'
                          : 'text-gray-300'
                      }
                    />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                setShowRating(false)
              }
              className="w-full rounded-[4px] bg-orange-500 py-3 text-sm font-bold text-white"
            >
              Confirmar
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
