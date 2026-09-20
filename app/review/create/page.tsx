
'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Camera,
  ChevronLeft,
  ChevronRight,
  FlipHorizontal2,
  Image as ImageIcon,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

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
    className: 'sepia-[0.4] contrast-[0.9] saturate-[0.8]',
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

export default function CreateReviewPage() {
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [cameraReady, setCameraReady] = useState(false)
  const [facingMode, setFacingMode] = useState<
    'user' | 'environment'
  >('environment')

  const [selectedFilter, setSelectedFilter] =
    useState('original')

  const [capturedImage, setCapturedImage] =
    useState<string | null>(null)

  const [cameraError, setCameraError] =
    useState<string | null>(null)

  const currentFilter =
    filters.find(
      (filter) => filter.id === selectedFilter,
    ) ?? filters[0]

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
    }
  }, [facingMode])

  async function startCamera() {
    stopCamera()

    try {
      setCameraError(null)
      setCameraReady(false)

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setCameraError(
          'Este navegador não suporta acesso à câmera.',
        )
        return
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: {
              ideal: 1080,
            },
            height: {
              ideal: 1920,
            },
          },
          audio: true,
        })

      streamRef.current = stream

      if (videoRef.current) {
        videoRef.current.srcObject = stream

        await videoRef.current.play()
      }

      setCameraReady(true)
    } catch (error) {
      console.error(error)

      setCameraReady(false)

      setCameraError(
        'Não foi possível aceder à câmera. Verifica as permissões do navegador.',
      )
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop())

      streamRef.current = null
    }
  }

  function switchCamera() {
    setFacingMode((current) =>
      current === 'environment'
        ? 'user'
        : 'environment',
    )
  }

  function capturePhoto() {
    const video = videoRef.current
    const canvas = canvasRef.current

    if (!video || !canvas || !cameraReady) {
      return
    }

    const context = canvas.getContext('2d')

    if (!context) {
      return
    }

    canvas.width = video.videoWidth
    canvas.height = video.videoHeight

    context.drawImage(
      video,
      0,
      0,
      canvas.width,
      canvas.height,
    )

    const image = canvas.toDataURL(
      'image/jpeg',
      0.9,
    )

    setCapturedImage(image)

    stopCamera()
  }

  function retakePhoto() {
    setCapturedImage(null)

    startCamera()
  }

  function continueToEditor() {
    if (!capturedImage) {
      console.log(
        'Nenhuma imagem foi capturada.',
      )
      return
    }

    try {
      sessionStorage.setItem(
        'wizenda-review-image',
        capturedImage,
      )

      sessionStorage.setItem(
        'wizenda-review-filter',
        selectedFilter,
      )

      console.log(
        'Imagem guardada. A abrir editor...',
      )

      router.push(
        '/review/create/publish',
      )
    } catch (error) {
      console.error(
        'Erro ao guardar imagem:',
        error,
      )

      alert(
        'Não foi possível preparar a imagem. Tenta novamente.',
      )
    }
  }

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* CÂMERA */}
      {!capturedImage && (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 h-full w-full object-cover ${currentFilter.className}`}
          />

          {/* Gradiente superior */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />

          {/* Gradiente inferior */}
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-black/80 to-transparent" />

          {/* TOPO */}
          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
            <Link
              href="/review"
              aria-label="Fechar"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
            >
              <X size={22} />
            </Link>

            <div className="flex items-center gap-2 rounded-full bg-black/30 px-4 py-2 backdrop-blur-md">
              <Sparkles
                size={16}
                className="text-orange-400"
              />

              <span className="text-sm font-semibold">
                Review
              </span>
            </div>

            <button
              type="button"
              onClick={switchCamera}
              aria-label="Trocar câmera"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
            >
              <FlipHorizontal2 size={21} />
            </button>
          </div>

          {/* ERRO */}
          {cameraError && (
            <div className="absolute inset-x-5 top-1/2 z-30 -translate-y-1/2 rounded-2xl bg-black/70 p-5 text-center backdrop-blur-md">
              <Camera
                size={32}
                className="mx-auto mb-3 text-orange-400"
              />

              <p className="text-sm text-white">
                {cameraError}
              </p>

              <button
                type="button"
                onClick={startCamera}
                className="mt-4 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold"
              >
                Tentar novamente
              </button>
            </div>
          )}

          {/* FILTROS */}
          <div className="absolute inset-x-0 bottom-36 z-20">
            <div className="flex items-center gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
              {filters.map((filter) => {
                const active =
                  selectedFilter === filter.id

                return (
                  <button
                    key={filter.id}
                    type="button"
                    onClick={() =>
                      setSelectedFilter(
                        filter.id,
                      )
                    }
                    className="flex shrink-0 flex-col items-center gap-2"
                  >
                    <div
                      className={`flex h-14 w-14 items-center justify-center overflow-hidden rounded-full border-2 ${
                        active
                          ? 'border-orange-500'
                          : 'border-white/50'
                      }`}
                    >
                      <div
                        className={`h-full w-full bg-gradient-to-br from-orange-400 via-pink-500 to-purple-600 ${filter.className}`}
                      />
                    </div>

                    <span
                      className={`text-[10px] font-medium ${
                        active
                          ? 'text-white'
                          : 'text-white/70'
                      }`}
                    >
                      {filter.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* CONTROLOS */}
          <div className="absolute inset-x-0 bottom-5 z-20 flex items-center justify-center">
            <div className="flex w-full max-w-sm items-center justify-between px-8">
              {/* GALERIA */}
              <button
                type="button"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
                aria-label="Galeria"
              >
                <ImageIcon size={22} />
              </button>

              {/* CAPTURAR */}
              <button
                type="button"
                onClick={capturePhoto}
                disabled={!cameraReady}
                aria-label="Capturar"
                className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white disabled:opacity-40"
              >
                <span className="h-16 w-16 rounded-full bg-white transition active:scale-90" />
              </button>

              {/* FILTROS */}
              <button
                type="button"
                aria-label="Filtros"
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
              >
                <Sparkles size={22} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* FOTO CAPTURADA */}
      {capturedImage && (
        <>
          <img
            src={capturedImage}
            alt="Foto capturada"
            className={`absolute inset-0 h-full w-full object-cover ${currentFilter.className}`}
          />

          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
            <button
              type="button"
              onClick={retakePhoto}
              className="flex h-10 items-center gap-2 rounded-full bg-black/40 px-4 backdrop-blur-md"
            >
              <ChevronLeft size={19} />

              <span className="text-sm font-semibold">
                Refazer
              </span>
            </button>

            <span className="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              Pré-visualização
            </span>

            <Link
              href="/review"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
            >
              <X size={21} />
            </Link>
          </div>

          {/* AVANÇAR */}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/80 to-transparent px-5 pb-7 pt-20">
            <button
              type="button"
              onClick={continueToEditor}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 py-4 text-base font-bold text-white shadow-lg transition active:scale-[0.98]"
            >
              <span>Avançar</span>

              <ChevronRight size={20} />
            </button>
          </div>
        </>
      )}
    </main>
  )
}
