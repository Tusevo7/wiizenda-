'use client'

import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type GalleryImage = {
  url: string
  alt: string
}

export default function ProvinceGallery({
  images,
}: {
  images: GalleryImage[]
}) {
  const [active, setActive] = useState(0)

  if (!images.length) {
    return null
  }

  const previous = () => {
    setActive((current) =>
      current === 0 ? images.length - 1 : current - 1
    )
  }

  const next = () => {
    setActive((current) =>
      current === images.length - 1 ? 0 : current + 1
    )
  }

  return (
    <div className="mt-8">

      {/* IMAGEM PRINCIPAL */}

      <div className="relative overflow-hidden rounded-[2rem] bg-black">

        <img
          src={images[active].url}
          alt={images[active].alt}
          className="h-[420px] w-full object-cover md:h-[560px]"
        />

        {/* BOTÃO ESQUERDO */}

        {images.length > 1 && (
          <button
            type="button"
            onClick={previous}
            className="absolute left-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"
            aria-label="Imagem anterior"
          >
            <ChevronLeft size={22} />
          </button>
        )}

        {/* BOTÃO DIREITO */}

        {images.length > 1 && (
          <button
            type="button"
            onClick={next}
            className="absolute right-5 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg transition hover:scale-105"
            aria-label="Próxima imagem"
          >
            <ChevronRight size={22} />
          </button>
        )}

        {/* CONTADOR */}

        {images.length > 1 && (
          <div className="absolute bottom-5 right-5 rounded-full bg-black/60 px-4 py-2 text-xs font-medium text-white backdrop-blur">
            {active + 1} / {images.length}
          </div>
        )}

      </div>

      {/* MINIATURAS */}

      {images.length > 1 && (
        <div className="mt-4 flex gap-3 overflow-x-auto pb-2">

          {images.map((image, index) => (
            <button
              key={`${image.url}-${index}`}
              type="button"
              onClick={() => setActive(index)}
              className={`h-20 w-28 shrink-0 overflow-hidden rounded-xl ${
                active === index
                  ? 'ring-2 ring-[#FF5A1F] ring-offset-2'
                  : 'opacity-60 hover:opacity-100'
              }`}
            >
              <img
                src={image.url}
                alt={image.alt}
                className="h-full w-full object-cover"
              />
            </button>
          ))}

        </div>
      )}

    </div>
  )
}