'use client'

import { SlidersHorizontal } from 'lucide-react'
import {
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation'

const prices = [
  {
    label: 'Até 10.000 Kz',
    value: '10000',
  },
  {
    label: 'Até 25.000 Kz',
    value: '25000',
  },
  {
    label: 'Até 50.000 Kz',
    value: '50000',
  },
  {
    label: 'Até 100.000 Kz',
    value: '100000',
  },
]

export default function PriceFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const maxPrice = event.target.value

    const params = new URLSearchParams(
      searchParams.toString(),
    )

    if (maxPrice) {
      params.set('maxPrice', maxPrice)
    } else {
      params.delete('maxPrice')
    }

    const queryString = params.toString()

    router.push(
      queryString
        ? `${pathname}?${queryString}`
        : pathname,
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
      <SlidersHorizontal
        size={19}
        className="shrink-0 text-orange-500"
      />

      <select
        value={searchParams.get('maxPrice') || ''}
        onChange={handleChange}
        className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
      >
        <option value="">
          Qualquer preço
        </option>

        {prices.map((price) => (
          <option
            key={price.value}
            value={price.value}
          >
            {price.label}
          </option>
        ))}
      </select>
    </div>
  )
}