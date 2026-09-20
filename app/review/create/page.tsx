
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
  Video,
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

const MAX_VIDEO_SECONDS = 60

const VIDEO_DB_NAME = 'wizenda-review'
const VIDEO_STORE_NAME = 'videos'

function openVideoDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(VIDEO_DB_NAME, 1)

    request.onupgradeneeded = () => {
      const db = request.result

      if (!db.objectStoreNames.contains(VIDEO_STORE_NAME)) {
        db.createObjectStore(VIDEO_STORE_NAME)
      }
    }

    request.onsuccess = () => {
      resolve(request.result)
    }

    request.onerror = () => {
      reject(request.error)
    }
  })
}

async function saveVideoBlob(blob: Blob) {
  const db = await openVideoDatabase()

  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction(
      VIDEO_STORE_NAME,
      'readwrite',
    )

    transaction.objectStore(VIDEO_STORE_NAME).put(
      blob,
      'current',
    )

    transaction.oncomplete = () => {
      db.close()
      resolve()
    }

    transaction.onerror = () => {
      db.close()
      reject(transaction.error)
    }
  })
}

async function clearVideoBlob() {
  try {
    const db = await openVideoDatabase()

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(
        VIDEO_STORE_NAME,
        'readwrite',
      )

      transaction.objectStore(VIDEO_STORE_NAME).delete(
        'current',
      )

      transaction.oncomplete = () => resolve()
      transaction.onerror = () =>
        reject(transaction.error)
    })

    db.close()
  } catch (error) {
    console.error(
      'Erro ao limpar vídeo temporário:',
      error,
    )
  }
}

export default function CreateReviewPage() {
  const router = useRouter()

  const videoRef = useRef<HTMLVideoElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const mediaRecorderRef =
    useRef<MediaRecorder | null>(null)

  const recordedChunksRef = useRef<Blob[]>([])
  const recordingTimerRef =
    useRef<ReturnType<typeof setInterval> | null>(null)

  const [cameraReady, setCameraReady] = useState(false)

  const [facingMode, setFacingMode] = useState<
    'user' | 'environment'
  >('environment')

  const [selectedFilter, setSelectedFilter] =
    useState('original')

  const [capturedImage, setCapturedImage] =
    useState<string | null>(null)

  const [capturedVideo, setCapturedVideo] =
    useState<string | null>(null)

  const [cameraError, setCameraError] =
    useState<string | null>(null)

  const [captureMode, setCaptureMode] =
    useState<'photo' | 'video'>('photo')

  const [isRecording, setIsRecording] =
    useState(false)

  const [recordingSeconds, setRecordingSeconds] =
    useState(0)

  const currentFilter =
    filters.find(
      (filter) => filter.id === selectedFilter,
    ) ?? filters[0]

  useEffect(() => {
    startCamera()

    return () => {
      stopCamera()
      stopRecordingTimer()
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
    if (isRecording) {
      return
    }

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
    setCapturedVideo(null)

    stopCamera()
  }

  function getSupportedVideoMimeType() {
    const types = [
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=vp8,opus',
      'video/webm',
      'video/mp4',
    ]

    return (
      types.find((type) =>
        MediaRecorder.isTypeSupported(type),
      ) ?? ''
    )
  }

  function startRecording() {
    if (
      !streamRef.current ||
      !cameraReady ||
      isRecording
    ) {
      return
    }

    if (
      typeof MediaRecorder === 'undefined'
    ) {
      setCameraError(
        'Este navegador não suporta gravação de vídeo.',
      )
      return
    }

    const mimeType =
      getSupportedVideoMimeType()

    try {
      const recorder = mimeType
        ? new MediaRecorder(
            streamRef.current,
            { mimeType },
          )
        : new MediaRecorder(
            streamRef.current,
          )

      recordedChunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(
            event.data,
          )
        }
      }

      recorder.onstop = async () => {
        const finalType =
          mimeType || 'video/webm'

        const blob = new Blob(
          recordedChunksRef.current,
          {
            type: finalType,
          },
        )

        try {
          await saveVideoBlob(blob)

          const previewUrl =
            URL.createObjectURL(blob)

          setCapturedVideo(previewUrl)
          setCapturedImage(null)

          sessionStorage.setItem(
            'wizenda-review-media-type',
            'video',
          )

          sessionStorage.setItem(
            'wizenda-review-filter',
            selectedFilter,
          )

          stopCamera()
        } catch (error) {
          console.error(
            'Erro ao guardar vídeo:',
            error,
          )

          setCameraError(
            'Não foi possível preparar o vídeo. Tenta novamente.',
          )
        }
      }

      mediaRecorderRef.current = recorder

      recorder.start(250)

      setIsRecording(true)
      setRecordingSeconds(0)

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingSeconds(
            (current) => {
              const next = current + 1

              if (
                next >= MAX_VIDEO_SECONDS
              ) {
                stopRecording()
              }

              return next
            },
          )
        }, 1000)
    } catch (error) {
      console.error(
        'Erro ao iniciar gravação:',
        error,
      )

      setCameraError(
        'Não foi possível iniciar a gravação de vídeo.',
      )
    }
  }

  function stopRecordingTimer() {
    if (recordingTimerRef.current) {
      clearInterval(
        recordingTimerRef.current,
      )

      recordingTimerRef.current = null
    }
  }

  function stopRecording() {
    const recorder =
      mediaRecorderRef.current

    if (!recorder || !isRecording) {
      return
    }

    stopRecordingTimer()

    setIsRecording(false)

    if (recorder.state !== 'inactive') {
      recorder.stop()
    }

    mediaRecorderRef.current = null
  }

  function toggleRecording() {
    if (isRecording) {
      stopRecording()
      return
    }

    startRecording()
  }

  function retake() {
    if (capturedVideo) {
      URL.revokeObjectURL(capturedVideo)
    }

    setCapturedImage(null)
    setCapturedVideo(null)

    sessionStorage.removeItem(
      'wizenda-review-media-type',
    )

    clearVideoBlob()
    startCamera()
  }

  function continueToEditor() {
    if (!capturedImage && !capturedVideo) {
      return
    }

    try {
      sessionStorage.setItem(
        'wizenda-review-filter',
        selectedFilter,
      )

      if (capturedImage) {
        sessionStorage.setItem(
          'wizenda-review-image',
          capturedImage,
        )

        sessionStorage.setItem(
          'wizenda-review-media-type',
          'image',
        )
      }

      if (capturedVideo) {
        sessionStorage.setItem(
          'wizenda-review-media-type',
          'video',
        )
      }

      router.push(
        '/review/create/publish',
      )
    } catch (error) {
      console.error(
        'Erro ao preparar mídia:',
        error,
      )

      alert(
        'Não foi possível preparar a mídia. Tenta novamente.',
      )
    }
  }

  const hasPreview =
    Boolean(capturedImage || capturedVideo)

  return (
    <main className="fixed inset-0 overflow-hidden bg-black text-white">
      <canvas
        ref={canvasRef}
        className="hidden"
      />

      {/* CÂMERA */}
      {!hasPreview && (
        <>
          <video
            ref={videoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 h-full w-full object-cover ${currentFilter.className}`}
          />

          <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/70 to-transparent" />

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-72 bg-gradient-to-t from-black/90 to-transparent" />

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
              disabled={isRecording}
              aria-label="Trocar câmera"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md disabled:opacity-40"
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

          {/* GRAVAÇÃO */}
          {isRecording && (
            <div className="absolute left-1/2 top-24 z-30 -translate-x-1/2">
              <div className="flex items-center gap-2 rounded-full bg-red-600/90 px-4 py-2 text-sm font-bold shadow-lg">
                <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-white" />

                REC {recordingSeconds}s
              </div>
            </div>
          )}

          {/* FILTROS */}
          <div className="absolute inset-x-0 bottom-40 z-20">
            <div className="flex items-center gap-3 overflow-x-auto px-5 pb-2 scrollbar-hide">
              {filters.map((filter) => {
                const active =
                  selectedFilter === filter.id

                return (
                  <button
                    key={filter.id}
                    type="button"
                    disabled={isRecording}
                    onClick={() =>
                      setSelectedFilter(
                        filter.id,
                      )
                    }
                    className="flex shrink-0 flex-col items-center gap-2 disabled:opacity-50"
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
                disabled={isRecording}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-md disabled:opacity-40"
                aria-label="Galeria"
              >
                <ImageIcon size={22} />
              </button>

              {/* CAPTURA / VÍDEO */}
              <div className="flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={
                    captureMode === 'photo'
                      ? capturePhoto
                      : toggleRecording
                  }
                  disabled={!cameraReady}
                  aria-label={
                    captureMode === 'photo'
                      ? 'Capturar foto'
                      : isRecording
                        ? 'Parar gravação'
                        : 'Gravar vídeo'
                  }
                  className={`flex h-20 w-20 items-center justify-center rounded-full border-4 ${
                    isRecording
                      ? 'border-red-500'
                      : 'border-white'
                  } disabled:opacity-40`}
                >
                  <span
                    className={`transition ${
                      isRecording
                        ? 'h-9 w-9 rounded-[6px] bg-red-500'
                        : captureMode === 'photo'
                          ? 'h-16 w-16 rounded-full bg-white active:scale-90'
                          : 'h-16 w-16 rounded-full bg-red-500 active:scale-90'
                    }`}
                  />
                </button>

                <div className="flex items-center gap-2 rounded-full bg-black/40 p-1 backdrop-blur-md">
                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() =>
                      setCaptureMode('photo')
                    }
                    className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                      captureMode === 'photo'
                        ? 'bg-white text-black'
                        : 'text-white/70'
                    }`}
                  >
                    FOTO
                  </button>

                  <button
                    type="button"
                    disabled={isRecording}
                    onClick={() =>
                      setCaptureMode('video')
                    }
                    className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold ${
                      captureMode === 'video'
                        ? 'bg-red-500 text-white'
                        : 'text-white/70'
                    }`}
                  >
                    <Video size={11} />
                    VÍDEO
                  </button>
                </div>
              </div>

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

      {/* FOTO / VÍDEO CAPTURADO */}
      {hasPreview && (
        <>
          {capturedImage && (
            <img
              src={capturedImage}
              alt="Foto capturada"
              className={`absolute inset-0 h-full w-full object-cover ${currentFilter.className}`}
            />
          )}

          {capturedVideo && (
            <video
              src={capturedVideo}
              autoPlay
              muted
              loop
              playsInline
              controls
              className={`absolute inset-0 h-full w-full object-cover ${currentFilter.className}`}
            />
          )}

          <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-5 py-5">
            <button
              type="button"
              onClick={retake}
              className="flex h-10 items-center gap-2 rounded-full bg-black/40 px-4 backdrop-blur-md"
            >
              <ChevronLeft size={19} />

              <span className="text-sm font-semibold">
                Refazer
              </span>
            </button>

            <span className="rounded-full bg-black/40 px-4 py-2 text-sm font-semibold backdrop-blur-md">
              {capturedVideo
                ? 'Vídeo'
                : 'Foto'}
            </span>

            <Link
              href="/review"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 backdrop-blur-md"
            >
              <X size={21} />
            </Link>
          </div>

          {/* AVANÇAR */}
          <div className="absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 to-transparent px-5 pb-7 pt-20">
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
