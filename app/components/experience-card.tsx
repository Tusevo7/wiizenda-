'use client'

import Link from 'next/link'
import {
  CalendarDays,
  Heart,
  MapPin,
  Star,
  Volume2,
  VolumeX,
} from 'lucide-react'
import {
  useEffect,
  useRef,
  useState,
} from 'react'
import { createClient } from '@/lib/supabase/client'

type ExperienceCardProps = {
  id: string
  slug: string
  title: string
  location: string
  price: string
  rating: number
  image: string
  activityStartAt: string
  agencyName: string
  agencyLogo: string | null

  musicTitle?: string | null
  musicArtist?: string | null
  musicUrl?: string | null
  musicStartSeconds?: number | null
  musicDurationSeconds?: number | null
}

type AudioPlayEvent = CustomEvent<{
  id: string
}>

type GlobalSoundEvent = CustomEvent<{
  enabled: boolean
}>

const AUDIO_EVENT_NAME =
  'wizenda-experience-audio-play'

const GLOBAL_SOUND_EVENT_NAME =
  'wizenda-global-sound-change'

const GLOBAL_SOUND_STORAGE_KEY =
  'wizenda-global-sound'

const FADE_IN_DURATION = 500
const FADE_OUT_DURATION = 400

export default function ExperienceCard({
  id,
  slug,
  title,
  location,
  price,
  rating,
  image,
  activityStartAt,
  agencyName,
  agencyLogo,
  musicUrl = null,
  musicStartSeconds = null,
  musicDurationSeconds = null,
}: ExperienceCardProps) {
  const [favorite, setFavorite] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [soundOn, setSoundOn] =
    useState(true)

  const [globalSoundOn, setGlobalSoundOn] =
    useState(true)

  const [audioLoading, setAudioLoading] =
    useState(false)

  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const cardRef =
    useRef<HTMLElement | null>(null)

  const isVisibleRef =
    useRef(false)

  const fadeFrameRef =
    useRef<number | null>(null)

  const globalSoundRef =
    useRef(true)

  const hasMusic =
    typeof musicUrl === 'string' &&
    musicUrl.trim().length > 0

  /*
   * =========================================================
   * FAVORITOS
   * =========================================================
   */

  useEffect(() => {
    async function checkFavorite() {
      const supabase =
        createClient()

      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      if (!user) return

      const { data } =
        await supabase
          .from('favorites')
          .select('id')
          .eq(
            'user_id',
            user.id,
          )
          .eq(
            'experience_id',
            id,
          )
          .maybeSingle()

      setFavorite(!!data)
    }

    checkFavorite()
  }, [id])

  async function toggleFavorite(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    setLoading(true)

    const supabase =
      createClient()

    const {
      data: { user },
    } =
      await supabase.auth.getUser()

    if (!user) {
      window.location.href =
        '/login'

      return
    }

    if (favorite) {
      const { error } =
        await supabase
          .from('favorites')
          .delete()
          .eq(
            'user_id',
            user.id,
          )
          .eq(
            'experience_id',
            id,
          )

      if (!error) {
        setFavorite(false)
      }
    } else {
      const { error } =
        await supabase
          .from('favorites')
          .insert({
            user_id: user.id,
            experience_id: id,
          })

      if (!error) {
        setFavorite(true)
      }
    }

    setLoading(false)
  }

  /*
   * =========================================================
   * MÚSICA
   * =========================================================
   */

  function getMusicStart() {
    const value =
      Number(
        musicStartSeconds ?? 0,
      )

    if (
      !Number.isFinite(value)
    ) {
      return 0
    }

    return Math.max(
      0,
      value,
    )
  }

  function getMusicClipDuration() {
    const value =
      Number(
        musicDurationSeconds ??
          30,
      )

    if (
      !Number.isFinite(value) ||
      value <= 0
    ) {
      return 30
    }

    return Math.min(
      30,
      value,
    )
  }

  /*
   * =========================================================
   * CANCELAR FADE
   * =========================================================
   */

  function cancelFade() {
    if (
      fadeFrameRef.current !== null
    ) {
      cancelAnimationFrame(
        fadeFrameRef.current,
      )

      fadeFrameRef.current =
        null
    }
  }

  /*
   * =========================================================
   * FADE
   * =========================================================
   */

  function fadeAudioTo(
    targetVolume: number,
    duration: number,
    onComplete?: () => void,
  ) {
    const audio =
      audioRef.current

    if (!audio) {
      onComplete?.()
      return
    }

    cancelFade()

    const startVolume =
      audio.volume

    const target =
      Math.max(
        0,
        Math.min(
          1,
          targetVolume,
        ),
      )

    if (
      Math.abs(
        startVolume - target,
      ) < 0.01
    ) {
      audio.volume =
        target

      onComplete?.()

      return
    }

    const startTime =
      performance.now()

    function animate(
      currentTime: number,
    ) {
      if (
        audioRef.current !==
        audio
      ) {
        fadeFrameRef.current =
          null

        return
      }

      const elapsed =
        currentTime -
        startTime

      const progress =
        Math.min(
          1,
          elapsed /
            duration,
        )

      const eased =
        progress < 0.5
          ? 2 *
            progress *
            progress
          : 1 -
            Math.pow(
              -2 *
                progress +
                2,
              2,
            ) /
              2

      audio.volume =
        startVolume +
        (target -
          startVolume) *
          eased

      if (
        progress < 1
      ) {
        fadeFrameRef.current =
          requestAnimationFrame(
            animate,
          )
      } else {
        audio.volume =
          target

        fadeFrameRef.current =
          null

        onComplete?.()
      }
    }

    fadeFrameRef.current =
      requestAnimationFrame(
        animate,
      )
  }

  /*
   * =========================================================
   * DESTRUIR ÁUDIO
   * =========================================================
   */

  function destroyMusic() {
    cancelFade()

    const audio =
      audioRef.current

    if (audio) {
      audio.pause()

      audio.removeAttribute(
        'src',
      )

      audio.load()
    }

    audioRef.current =
      null

    setSoundOn(false)
    setAudioLoading(false)
  }

  /*
   * =========================================================
   * PARAR MÚSICA
   * =========================================================
   */

  function stopMusic(
    smooth = true,
  ) {
    const audio =
      audioRef.current

    if (!audio) {
      setSoundOn(false)
      setAudioLoading(false)
      return
    }

    if (
      !smooth ||
      audio.volume <= 0.01
    ) {
      destroyMusic()
      return
    }

    fadeAudioTo(
      0,
      FADE_OUT_DURATION,
      () => {
        destroyMusic()
      },
    )
  }

  /*
   * =========================================================
   * SOM GLOBAL
   * =========================================================
   */

  useEffect(() => {
    const saved =
      window.localStorage.getItem(
        GLOBAL_SOUND_STORAGE_KEY,
      )

    const enabled =
      saved !== 'false'

    globalSoundRef.current =
      enabled

    setGlobalSoundOn(enabled)
    setSoundOn(enabled)

    function handleGlobalSound(
      event: Event,
    ) {
      const customEvent =
        event as GlobalSoundEvent

      const enabled =
        customEvent.detail?.enabled

      if (
        typeof enabled !==
        'boolean'
      ) {
        return
      }

      globalSoundRef.current =
        enabled

      setGlobalSoundOn(enabled)

      setSoundOn(enabled)

      if (!enabled) {
        stopMusic(true)
      } else {
        /*
         * Se este card estiver visível,
         * volta a tocar.
         */

        if (
          isVisibleRef.current
        ) {
          startMusic(true)
        }
      }
    }

    window.addEventListener(
      GLOBAL_SOUND_EVENT_NAME,
      handleGlobalSound,
    )

    return () => {
      window.removeEventListener(
        GLOBAL_SOUND_EVENT_NAME,
        handleGlobalSound,
      )
    }
  }, [id])

  /*
   * =========================================================
   * INICIAR MÚSICA
   * =========================================================
   */

  async function startMusic(
    withSound = true,
  ) {
    /*
     * O estado global manda.
     */

    if (
      !globalSoundRef.current
    ) {
      withSound = false
    }

    if (
      !hasMusic ||
      !musicUrl ||
      !isVisibleRef.current
    ) {
      return
    }

    /*
     * Áudio já existe
     */

    if (audioRef.current) {
      const audio =
        audioRef.current

      if (
        audio.paused
      ) {
        try {
          await audio.play()
        } catch {
          return
        }
      }

      if (withSound) {
        cancelFade()

        audio.muted =
          false

        setSoundOn(true)

        fadeAudioTo(
          1,
          FADE_IN_DURATION,
        )
      } else {
        cancelFade()

        audio.muted =
          true

        audio.volume =
          0

        setSoundOn(false)
      }

      return
    }

    /*
     * Avisar outros cards
     */

    window.dispatchEvent(
      new CustomEvent(
        AUDIO_EVENT_NAME,
        {
          detail: {
            id,
          },
        },
      ),
    )

    /*
     * Criar áudio
     */

    const audio =
      new Audio()

    audio.preload =
      'auto'

    /*
     * Começar tentando
     * com som.
     */

    audio.muted =
      !withSound

    audio.volume =
      0

    audioRef.current =
      audio

    const start =
      getMusicStart()

    const clipDuration =
      getMusicClipDuration()

    setAudioLoading(true)

    /*
     * =======================================================
     * METADATA
     * =======================================================
     */

    const handleLoadedMetadata =
      async () => {
        try {
          const realDuration =
            Number(
              audio.duration,
            )

          let safeStart =
            start

          if (
            Number.isFinite(
              realDuration,
            ) &&
            realDuration > 0
          ) {
            safeStart =
              Math.min(
                start,
                Math.max(
                  0,
                  realDuration -
                    0.1,
                ),
              )
          }

          audio.currentTime =
            safeStart

          /*
           * SOM GLOBAL DESLIGADO
           */

          if (
            !globalSoundRef.current
          ) {
            audio.muted =
              true

            audio.volume =
              0

            await audio.play()

            setAudioLoading(false)
            setSoundOn(false)

            return
          }

          /*
           * Tentar autoplay
           * COM SOM.
           */

          audio.muted =
            false

          audio.volume =
            0

          await audio.play()

          setAudioLoading(false)

          setSoundOn(true)

          fadeAudioTo(
            1,
            FADE_IN_DURATION,
          )
        } catch (error) {
          /*
           * Se o navegador bloquear
           * autoplay com som,
           * tentamos muted.
           */

          console.warn(
            'Autoplay com som bloqueado pelo navegador.',
            error,
          )

          try {
            audio.muted =
              true

            audio.volume =
              0

            await audio.play()

            setAudioLoading(false)
            setSoundOn(false)
          } catch (mutedError) {
            console.error(
              'Erro ao reproduzir música:',
              mutedError,
            )

            if (
              audioRef.current ===
              audio
            ) {
              audioRef.current =
                null
            }

            setAudioLoading(false)
            setSoundOn(false)
          }
        }
      }

    /*
     * =========================================================
     * LOOP DO TRECHO
     * =========================================================
     */

    const handleTimeUpdate =
      () => {
        if (
          audioRef.current !==
          audio
        ) {
          return
        }

        const end =
          start +
          clipDuration

        if (
          audio.currentTime >=
          end
        ) {
          audio.currentTime =
            start

          audio.play().catch(
            () => {
              setSoundOn(false)
            },
          )
        }
      }

    /*
     * =========================================================
     * FIM DO ARQUIVO
     * =========================================================
     */

    const handleEnded =
      () => {
        if (
          audioRef.current !==
          audio
        ) {
          return
        }

        audio.currentTime =
          start

        audio.play().catch(
          () => {
            setSoundOn(false)
          },
        )
      }

    /*
     * =========================================================
     * ERRO
     * =========================================================
     */

    const handleError =
      () => {
        console.error(
          'Não foi possível carregar o áudio.',
        )

        if (
          audioRef.current ===
          audio
        ) {
          audioRef.current =
            null
        }

        setAudioLoading(false)
        setSoundOn(false)
      }

    audio.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata,
      {
        once: true,
      },
    )

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate,
    )

    audio.addEventListener(
      'ended',
      handleEnded,
    )

    audio.addEventListener(
      'error',
      handleError,
    )

    audio.src =
      musicUrl

    audio.load()
  }

  /*
   * =========================================================
   * BOTÃO DE SOM — GLOBAL
   * =========================================================
   */

  async function toggleSound(
    event: React.MouseEvent<HTMLButtonElement>,
  ) {
    event.preventDefault()
    event.stopPropagation()

    if (
      !hasMusic ||
      !musicUrl
    ) {
      return
    }

    /*
     * DESLIGAR SOM GLOBALMENTE
     */

    if (
      globalSoundRef.current
    ) {
      globalSoundRef.current =
        false

      setGlobalSoundOn(false)
      setSoundOn(false)

      window.localStorage.setItem(
        GLOBAL_SOUND_STORAGE_KEY,
        'false',
      )

      window.dispatchEvent(
        new CustomEvent(
          GLOBAL_SOUND_EVENT_NAME,
          {
            detail: {
              enabled: false,
            },
          },
        ),
      )

      return
    }

    /*
     * LIGAR SOM GLOBALMENTE
     */

    globalSoundRef.current =
      true

    setGlobalSoundOn(true)
    setSoundOn(true)

    window.localStorage.setItem(
      GLOBAL_SOUND_STORAGE_KEY,
      'true',
    )

    window.dispatchEvent(
      new CustomEvent(
        GLOBAL_SOUND_EVENT_NAME,
        {
          detail: {
            enabled: true,
          },
        },
      ),
    )

    /*
     * Se este card estiver visível,
     * iniciar imediatamente.
     */

    if (
      isVisibleRef.current
    ) {
      await startMusic(true)
    }
  }

  /*
   * =========================================================
   * UM ÚNICO ÁUDIO ATIVO
   * =========================================================
   */

  useEffect(() => {
    function handleOtherAudio(
      event: Event,
    ) {
      const customEvent =
        event as AudioPlayEvent

      if (
        customEvent.detail?.id ===
        id
      ) {
        return
      }

      stopMusic(true)
    }

    window.addEventListener(
      AUDIO_EVENT_NAME,
      handleOtherAudio,
    )

    return () => {
      window.removeEventListener(
        AUDIO_EVENT_NAME,
        handleOtherAudio,
      )
    }
  }, [id])

  /*
   * =========================================================
   * INTERSECTION OBSERVER
   * =========================================================
   */

  useEffect(() => {
    const card =
      cardRef.current

    if (!card) return

    if (!hasMusic) return

    const observer =
      new IntersectionObserver(
        (entries) => {
          const entry =
            entries[0]

          if (!entry) return

          /*
           * CARD ATIVO
           */

          if (
            entry.isIntersecting &&
            entry.intersectionRatio >=
              0.65
          ) {
            isVisibleRef.current =
              true

            /*
             * O estado global
             * decide se terá som.
             */

            startMusic(
              globalSoundRef.current,
            )

            return
          }

          /*
           * CARD SAIU
           */

          isVisibleRef.current =
            false

          stopMusic(true)
        },
        {
          threshold: [
            0,
            0.65,
            1,
          ],
        },
      )

    observer.observe(card)

    return () => {
      observer.disconnect()

      isVisibleRef.current =
        false

      destroyMusic()
    }
  }, [
    hasMusic,
    musicUrl,
    musicStartSeconds,
    musicDurationSeconds,
  ])

  /*
   * =========================================================
   * LIMPEZA
   * =========================================================
   */

  useEffect(() => {
    return () => {
      destroyMusic()
    }
  }, [])

  /*
   * =========================================================
   * DATA
   * =========================================================
   */

  const formattedDate =
    new Date(
      activityStartAt,
    ).toLocaleDateString(
      'pt-AO',
      {
        day: '2-digit',
        month: 'short',
      },
    )

  /*
   * =========================================================
   * RENDER
   * =========================================================
   */

  return (
    <Link
      href={`/experience/${slug}`}
      className="block min-w-[300px] sm:min-w-[330px]"
    >
      <article
        ref={cardRef}
        className="group relative overflow-hidden rounded-3xl bg-gray-100 shadow-sm"
      >
        {/* FOTO */}

        <div className="relative h-[520px] w-full overflow-hidden sm:h-[560px] lg:h-[600px]">
          <img
            src={image}
            alt={title}
            className="h-full w-full object-cover transition duration-700 group-hover:scale-[1.05]"
          />

          {/* GRADIENTE INFERIOR */}

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 via-45% to-transparent" />

          {/* GRADIENTE SUPERIOR */}

          <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-black/40 to-transparent" />

          {/* RATING */}

          {rating > 0 && (
            <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/45 px-3 py-2 text-sm font-bold text-white backdrop-blur-md">
              <Star
                size={15}
                className="fill-orange-400 text-orange-400"
              />

              {rating.toFixed(1)}
            </div>
          )}

          {/* FAVORITO */}

          <button
            type="button"
            onClick={
              toggleFavorite
            }
            disabled={loading}
            aria-label={
              favorite
                ? 'Remover dos favoritos'
                : 'Adicionar aos favoritos'
            }
            className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 shadow-lg backdrop-blur transition hover:scale-105 disabled:opacity-60"
          >
            <Heart
              size={20}
              className={
                favorite
                  ? 'fill-orange-500 text-orange-500'
                  : 'text-gray-900'
              }
            />
          </button>

          {/* SOM */}

          {hasMusic && (
            <button
              type="button"
              onClick={
                toggleSound
              }
              disabled={
                audioLoading
              }
              aria-label={
                globalSoundOn
                  ? 'Silenciar'
                  : 'Ativar som'
              }
              className="absolute right-4 top-[68px] flex h-11 w-11 items-center justify-center rounded-full bg-black/55 text-white shadow-lg backdrop-blur-md transition hover:scale-105 hover:bg-black/70 disabled:cursor-wait disabled:opacity-70"
            >
              {globalSoundOn ? (
                <Volume2
                  size={20}
                  strokeWidth={2.5}
                />
              ) : (
                <VolumeX
                  size={20}
                  strokeWidth={2.5}
                />
              )}
            </button>
          )}

          {/* CONTEÚDO */}

          <div className="absolute inset-x-0 bottom-0 p-5 text-white sm:p-6 lg:p-7">
            {/* AGÊNCIA */}

            <div className="mb-5 flex items-center gap-3">
              <div className="h-11 w-11 shrink-0 overflow-hidden rounded-full border-2 border-white/90 bg-white shadow-lg">
                {agencyLogo ? (
                  <img
                    src={agencyLogo}
                    alt={agencyName}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-orange-50 text-sm font-black text-orange-500">
                    {agencyName
                      ? agencyName
                          .charAt(
                            0,
                          )
                          .toUpperCase()
                      : 'A'}
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-white">
                  {agencyName}
                </p>

                <p className="text-xs text-white/70">
                  Agência parceira
                </p>
              </div>
            </div>

            {/* TÍTULO */}

            <h3 className="line-clamp-2 text-2xl font-black leading-tight tracking-tight text-white sm:text-3xl">
              {title}
            </h3>

            {/* LOCALIZAÇÃO + DATA */}

            <div className="mt-4 flex items-center gap-4 text-sm text-white/85">
              <div className="flex min-w-0 items-center gap-1.5">
                <MapPin
                  size={15}
                  className="shrink-0"
                />

                <span className="truncate">
                  {location}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-1.5">
                <CalendarDays
                  size={15}
                />

                <span>
                  {formattedDate}
                </span>
              </div>
            </div>

            {/* PREÇO + BOTÃO */}

            <div className="mt-5 flex items-end justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-white/65">
                  A partir de
                </p>

                <p className="mt-0.5 text-xl font-black text-white sm:text-2xl">
                  {price}
                </p>
              </div>

              <span className="shrink-0 rounded-full bg-white px-4 py-2.5 text-xs font-bold text-gray-950 transition group-hover:bg-orange-500 group-hover:text-white">
                Ver experiência
              </span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  )
}