'use client'

import { X } from 'lucide-react'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

export default function ActiveFilters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const category = searchParams.get('category')
  const province = searchParams.get('province')
  const maxPrice = searchParams.get('maxPrice')

  const filters = [
    category
      ? {
          key: 'category',
          label: category,
        }
      : null,

    province
      ? {
          key: 'province',
          label: province,
        }
      : null,

    maxPrice
      ? {
          key: 'maxPrice',
          label: `Até ${Number(
            maxPrice,
          ).toLocaleString('pt-AO')} Kz`,
        }
      : null,
  ].filter(Boolean) as {
    key: string
    label: string
  }[]

  if (filters.length === 0) {
    return null
  }

  function removeFilter(key: string) {
    const params = new URLSearchParams(
      searchParams.toString(),
    )

    params.delete(key)

    const queryString = params.toString()

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
    )
  }

  function clearFilters() {
    const params = new URLSearchParams(
      searchParams.toString(),
    )

    params.delete('category')
    params.delete('province')
    params.delete('maxPrice')

    const queryString = params.toString()

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
    )
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-2">
      {filters.map((filter) => (
        <button
          key={filter.key}
          type="button"
          onClick={() => removeFilter(filter.key)}
          className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-3.5 py-2 text-sm font-semibold text-orange-700 transition hover:bg-orange-100"
        >
          {filter.label}

          <X size={15} />
        </button>
      ))}

      <button
        type="button"
        onClick={clearFilters}
        className="px-2 py-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
      >
        Limpar filtros
      </button>
    </div>
  )
}