
'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Check,
  MapPin,
  Music2,
  Star,
  Type,
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

const sounds = [
  {
    id: 'angola-vibes',
    name: 'Angola Vibes',
    category: 'África',
  },
  {
    id: 'african-sunset',
    name: 'African Sunset',
    category: 'Relax',
  },
  {
    id: 'travel-africa',
    name: 'Travel Africa',
    category: 'Viagem',
  },
  {
    id: 'luanda-nights',
    name: 'Luanda Nights',
    category: 'Em alta',
  },
]

export default function PublishReviewPage() {
  const router = useRouter()
  const supabase = createClient()

  const [image, setImage] = useState<string | null>(null)
  const [selectedFilter, setSelectedFilter] =
    useState('original')

  const [caption, setCaption] = useState('')
  const [location, setLocation] = useState('')
  const [rating, setRating] = useState<number | null>(null)
  const [selectedSound, setSelectedSound] =
    useState<string | null>(null)

  const [activeTool, setActiveTool] =
    useState<'sound' | 'text' | 'location' | 'rating' | null>(
      null,
    )

  const [publishing, setPublishing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const savedImage = sessionStorage.getItem(
      'wizenda-review-image',
    )

    const savedFilter = sessionStorage.getItem(
      'wizenda-review-filter',
    )

    if (!savedImage) {
      router.replace('/review/create')
      return
    }

    setImage(savedImage)

    if (savedFilter) {
      setSelectedFilter(savedFilter)
    }
  }, [router])

  const currentFilter =
    filters.find(
      (filter) => filter.id === selectedFilter,
    ) ?? filters[0]

  function dataUrlToBlob(dataUrl: string) {
    const parts = dataUrl.split(',')

    const mimeMatch = parts[0].match(
      /data:(.*?);base64/,
    )

    const mime =
      mimeMatch?.[1] ?? 'image/jpeg'

    const byteString = atob(parts[1])

    const arrayBuffer = new ArrayBuffer(
      byteString.length,
    )

    const uint8Array = new Uint8Array(
      arrayBuffer,
    )

    for (let index = 0; index < byteString.length; index++) {
      uint8Array[index] =
        byteString.charCodeAt(index)
    }

    return new Blob([arrayBuffer], {
      type: mime,
    })
  }

  async function publishPost() {
    if (!image || publishing) {
      return
    }

    try {
      setPublishing(true)
      setError(null)

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !user) {
        router.push('/login')
        return
      }

      const { data: profile, error: profileError } =
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

      if (profile?.role === 'agency') {
        postType = 'agency'
      }

      const blob = dataUrlToBlob(image)

      const fileName = `${crypto.randomUUID()}.jpg`

      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } =
        await supabase.storage
          .from('community-media')
          .upload(filePath, blob, {
            contentType: 'image/jpeg',
            cacheControl: '3600',
            upsert: false,
          })

      if (uploadError) {
        throw uploadError
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from('community-media')
        .getPublicUrl(filePath)

      const mediaUrl =
        publicUrlData.publicUrl

      const { error: postError } =
        await supabase
          .from('community_posts')
          .insert({
            user_id: user.id,
            post_type: postType,
            media_type: 'image',
            media_url: mediaUrl,
            caption:
              caption.trim() || null,
            location:
              location.trim() || null,
            rating,
            sound_name:
              selectedSound || null,
          })

      if (postError) {
        await supabase.storage
          .from('community-media')
          .remove([filePath])

        throw postError
      }

      sessionStorage.removeItem(
        'wizenda-review-image',
      )

      sessionStorage.removeItem(
        'wizenda-review-filter',
      )

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
    }
  }

  function toggleTool(
    tool:
      | 'sound'
      | 'text'
      | 'location'
      | 'rating',
  ) {
    setActiveTool((current) =>
      current === tool ? null : tool,
    )
  }

  if (!image) {
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
          <Link
            href="/review/create"
            onClick={() => {
              sessionStorage.removeItem(
                'wizenda-review-image',
              )

              sessionStorage.removeItem(
                'wizenda-review-filter',
              )
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10"
            aria-label="Voltar"
          >
            <ArrowLeft size={21} />
          </Link>

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
          <img
            src={image}
            alt="Pré-visualização do Review"
            className={`h-full w-full object-cover ${currentFilter.className}`}
          />

          {/* TEXTO SOBRE A FOTO */}
          {caption.trim() && (
            <div className="absolute inset-x-5 bottom-5">
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
              activeTool === 'location'
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
              activeTool === 'rating'
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
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-bold">
                Escolher som
              </h2>

              {selectedSound && (
                <button
                  type="button"
                  onClick={() =>
                    setSelectedSound(null)
                  }
                  className="text-xs text-white/50"
                >
                  Remover
                </button>
              )}
            </div>

            <div className="space-y-2">
              {sounds.map((sound) => {
                const active =
                  selectedSound === sound.name

                return (
                  <button
                    key={sound.id}
                    type="button"
                    onClick={() =>
                      setSelectedSound(
                        sound.name,
                      )
                    }
                    className={`flex w-full items-center gap-3 rounded-[4px] border p-3 text-left ${
                      active
                        ? 'border-orange-500 bg-orange-500/10'
                        : 'border-white/10 bg-white/5'
                    }`}
                  >
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10">
                      <Music2 size={17} />
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
              })}
            </div>
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
                setCaption(event.target.value)
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
        {activeTool === 'location' && (
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
        {activeTool === 'rating' && (
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
                      setRating(value)
                    }
                    aria-label={`${value} estrelas`}
                  >
                    <Star
                      size={31}
                      fill={
                        rating !== null &&
                        value <= rating
                          ? 'currentColor'
                          : 'none'
                      }
                      className={
                        rating !== null &&
                        value <= rating
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
            onClick={publishPost}
            disabled={publishing}
            className="flex w-full items-center justify-center gap-2 rounded-[4px] bg-orange-500 py-4 text-sm font-bold text-white transition active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {publishing ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />

                A publicar...
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
