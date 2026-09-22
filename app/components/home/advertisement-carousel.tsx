
'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
  Megaphone,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type Advertisement = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  button_text: string | null
  button_url: string | null
  advertiser_name: string | null
  priority: number
}

export default function AdvertisementCarousel() {
  const supabase = createClient()

  const [ads, setAds] = useState<Advertisement[]>([])
  const [current, setCurrent] = useState(0)
  const [loading, setLoading] = useState(true)

  async function loadAdvertisements() {
    const { data, error } = await supabase
      .from('advertisements')
      .select(
        `
          id,
          title,
          description,
          image_url,
          button_text,
          button_url,
          advertiser_name,
          priority
        `,
      )
      .eq('status', 'active')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error(
        'Erro ao carregar publicidades:',
        error,
      )

      setLoading(false)
      return
    }

    setAds((data ?? []) as Advertisement[])
    setLoading(false)
  }

  useEffect(() => {
    loadAdvertisements()
  }, [])

  useEffect(() => {
    if (ads.length <= 1) {
      return
    }

    const interval = window.setInterval(() => {
      setCurrent((value) =>
        value >= ads.length - 1 ? 0 : value + 1,
      )
    }, 6000)

    return () => {
      window.clearInterval(interval)
    }
  }, [ads.length])

  if (loading || ads.length === 0) {
    return null
  }

  const ad = ads[current]

  if (!ad) {
    return null
  }

  function previousAd() {
    setCurrent((value) =>
      value === 0 ? ads.length - 1 : value - 1,
    )
  }

  function nextAd() {
    setCurrent((value) =>
      value === ads.length - 1 ? 0 : value + 1,
    )
  }

  return (
    <section className="w-full">
      <div className="w-full">

        <div className="relative overflow-hidden rounded-[4px] bg-gray-950">

          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="absolute inset-0 bg-black/55" />

          <div className="relative flex min-h-[230px] w-full flex-col justify-center px-5 py-7 sm:min-h-[300px] sm:px-10 sm:py-10">

            <div className="max-w-[calc(100%-40px)] sm:max-w-xl">

              <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1.5 text-[10px] font-bold text-white backdrop-blur sm:mb-4 sm:px-3 sm:text-xs">
                <Megaphone size={13} />

                Publicidade
              </div>

              {ad.advertiser_name && (
                <p className="mb-1.5 truncate text-[10px] font-semibold uppercase tracking-wider text-white/70 sm:mb-2 sm:text-xs">
                  {ad.advertiser_name}
                </p>
              )}

              <h2 className="line-clamp-3 text-xl font-black leading-tight tracking-tight text-white sm:text-4xl">
                {ad.title}
              </h2>

              {ad.description && (
                <p className="mt-2 line-clamp-3 max-w-lg text-xs leading-5 text-white/80 sm:mt-3 sm:text-base sm:leading-6">
                  {ad.description}
                </p>
              )}

              {ad.button_text && ad.button_url && (
                <div className="mt-4 sm:mt-6">
                  <Link
                    href={ad.button_url}
                    className="inline-flex h-10 items-center rounded-[4px] bg-orange-500 px-4 text-xs font-bold text-white transition hover:bg-orange-600 sm:h-11 sm:px-5 sm:text-sm"
                  >
                    {ad.button_text}
                  </Link>
                </div>
              )}

            </div>

            {ads.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={previousAd}
                  aria-label="Publicidade anterior"
                  className="absolute left-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 sm:left-4 sm:h-9 sm:w-9"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={nextAd}
                  aria-label="Próxima publicidade"
                  className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 sm:right-4 sm:h-9 sm:w-9"
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}

            {ads.length > 1 && (
              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                {ads.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Publicidade ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === current
                        ? 'w-5 bg-white sm:w-6'
                        : 'w-1.5 bg-white/50'
                    }`}
                  />
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </section>
  )
}
