'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  ChevronRight,
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
        <div className="relative overflow-hidden rounded-[4px] bg-gray-100">

          {ad.image_url && (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}

          <div className="relative flex h-[120px] w-full items-end justify-start overflow-hidden px-4 py-4 sm:h-[300px] sm:px-10 sm:py-10">

            {ad.button_text && ad.button_url && (
              <div className="relative z-10">
                <Link
                  href={ad.button_url}
                 className="inline-flex h-8 items-center rounded-[4px] bg-orange-500 px-3 text-[10px] font-bold text-white shadow-md transition hover:bg-orange-600 sm:h-9 sm:px-4 sm:text-xs"
                >
                  {ad.button_text}
                </Link>
              </div>
            )}

            {ads.length > 1 && (
              <>
                {/* Setas apenas no desktop */}
                <button
                  type="button"
                  onClick={previousAd}
                  aria-label="Publicidade anterior"
                  className="absolute left-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 sm:flex"
                >
                  <ChevronLeft size={17} />
                </button>

                <button
                  type="button"
                  onClick={nextAd}
                  aria-label="Próxima publicidade"
                  className="absolute right-4 top-1/2 z-10 hidden h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur transition hover:bg-black/50 sm:flex"
                >
                  <ChevronRight size={17} />
                </button>
              </>
            )}

            {ads.length > 1 && (
              <div className="absolute bottom-3 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 sm:bottom-4">
                {ads.map((item, index) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setCurrent(index)}
                    aria-label={`Publicidade ${index + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      index === current
                        ? 'w-5 bg-white sm:w-6'
                        : 'w-1.5 bg-white/70'
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