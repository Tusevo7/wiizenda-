'use client'

import {
  Music,
  Volume2,
  VolumeX,
} from 'lucide-react'

import {
  useEffect,
  useRef,
  useState,
} from 'react'

type ExperienceMusicProps = {
  musicTitle?: string | null
  musicArtist?: string | null
  musicUrl?: string | null
  musicStartSeconds?: number | null
  musicDurationSeconds?: number | null
}

const GLOBAL_SOUND_KEY = 'wizenda-global-sound'

export default function ExperienceMusic({
  musicTitle,
  musicArtist,
  musicUrl,
  musicStartSeconds,
  musicDurationSeconds,
}: ExperienceMusicProps) {
  const audioRef =
    useRef<HTMLAudioElement | null>(null)

  const [soundOn, setSoundOn] =
    useState(true)

  const [playing, setPlaying] =
    useState(false)

  const hasMusic =
    typeof musicUrl === 'string' &&
    musicUrl.trim().length > 0

  useEffect(() => {
    if (!hasMusic || !musicUrl) return

    const savedSound =
      localStorage.getItem(
        GLOBAL_SOUND_KEY,
      )

    const enabled =
      savedSound !== 'false'

    setSoundOn(enabled)

    const audio = new Audio()

    audio.src = musicUrl
    audio.preload = 'auto'
    audio.volume = enabled ? 1 : 0

    audioRef.current = audio

    const start =
      Number.isFinite(
        Number(musicStartSeconds),
      ) &&
      Number(musicStartSeconds) >= 0
        ? Number(musicStartSeconds)
        : 0

    const duration =
      Number.isFinite(
        Number(musicDurationSeconds),
      ) &&
      Number(musicDurationSeconds) > 0
        ? Math.min(
            Number(musicDurationSeconds),
            30,
          )
        : 30

    const handleLoadedMetadata =
      async () => {
        try {
          const realDuration =
            Number.isFinite(audio.duration)
              ? audio.duration
              : 0

          const safeStart =
            realDuration > 0
              ? Math.min(
                  start,
                  realDuration - 0.1,
                )
              : start

          audio.currentTime =
            Math.max(0, safeStart)

          try {
            await audio.play()
            setPlaying(true)
          } catch {
            audio.muted = true

            try {
              await audio.play()
              setPlaying(true)
            } catch {
              setPlaying(false)
            }
          }
        } catch {
          setPlaying(false)
        }
      }

    const handleTimeUpdate = () => {
      const clipEnd =
        start + duration

      if (
        audio.currentTime >= clipEnd
      ) {
        audio.currentTime = start

        if (!audio.paused) {
          audio.play().catch(() => {})
        }
      }
    }

    const handleEnded = () => {
      audio.currentTime = start

      audio.play().catch(() => {})
    }

    audio.addEventListener(
      'loadedmetadata',
      handleLoadedMetadata,
    )

    audio.addEventListener(
      'timeupdate',
      handleTimeUpdate,
    )

    audio.addEventListener(
      'ended',
      handleEnded,
    )

    audio.load()

    return () => {
      audio.pause()
      audio.removeAttribute('src')
      audio.load()

      audioRef.current = null
    }
  }, [
    hasMusic,
    musicUrl,
    musicStartSeconds,
    musicDurationSeconds,
  ])

  if (!hasMusic) {
    return null
  }

  const toggleSound = async () => {
    const audio = audioRef.current

    if (!audio) return

    const nextValue = !soundOn

    setSoundOn(nextValue)

    localStorage.setItem(
      GLOBAL_SOUND_KEY,
      String(nextValue),
    )

    window.dispatchEvent(
      new CustomEvent(
        'wizenda-global-sound-change',
        {
          detail: {
            enabled: nextValue,
          },
        },
      ),
    )

    if (nextValue) {
      audio.muted = false
      audio.volume = 1

      try {
        await audio.play()
        setPlaying(true)
      } catch {
        audio.muted = true

        try {
          await audio.play()
          setPlaying(true)
        } catch {
          setPlaying(false)
        }
      }
    } else {
      audio.muted = true
      audio.volume = 0
    }
  }

  return (
    <div className="flex w-full items-center justify-between gap-3">

      {/* MÚSICA */}
      <div className="flex min-w-0 max-w-[190px] items-center gap-1.5 text-white">

        {/* ÍCONE DA MÚSICA */}
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
          <Music
            size={12}
            strokeWidth={2.5}
          />
        </div>

        {/* NOME DA MÚSICA + ARTISTA */}
        <div className="min-w-0">
          <p className="truncate text-[11px] font-bold leading-tight text-white drop-shadow-md">
            {musicTitle || 'Música'}
          </p>

          <p className="mt-0.5 truncate text-[9px] font-medium leading-tight text-white/70 drop-shadow-md">
            {musicArtist || 'Artista'}
          </p>
        </div>

      </div>

      {/* CONTROLO DE SOM */}
      <button
        type="button"
        onClick={toggleSound}
        aria-label={
          soundOn
            ? 'Desligar música'
            : 'Ligar música'
        }
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-95"
      >
        {soundOn ? (
          <Volume2
            size={15}
            strokeWidth={2}
          />
        ) : (
          <VolumeX
            size={15}
            strokeWidth={2}
          />
        )}
      </button>

    </div>
  )
}