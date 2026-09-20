'use client'

import { MapPin } from 'lucide-react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'

const provinces = [
  'Luanda',
  'Benguela',
  'Huíla',
  'Cabinda',
  'Namibe',
  'Huambo',
  'Malanje',
  'Kwanza Sul',
]

export default function LocationFilter() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function handleChange(
    event: React.ChangeEvent<HTMLSelectElement>,
  ) {
    const province = event.target.value

    const params = new URLSearchParams(
      searchParams.toString(),
    )

    if (province) {
      params.set('province', province)
    } else {
      params.delete('province')
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
      <MapPin
        size={19}
        className="shrink-0 text-orange-500"
      />

      <select
        value={searchParams.get('province') || ''}
        onChange={handleChange}
        className="w-full bg-transparent text-sm font-semibold text-gray-800 outline-none"
      >
        <option value="">
          Todas as províncias
        </option>

        {provinces.map((province) => (
          <option
            key={province}
            value={province}
          >
            {province}
          </option>
        ))}
      </select>
    </div>
  )
}