'use client'

import {
  Waves,
  Mountain,
  Trees,
  Landmark,
  Utensils,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

const icons = {
  Praia: Waves,
  Aventura: Mountain,
  Natureza: Trees,
  Cultura: Landmark,
  Gastronomia: Utensils,
}

type CategoryChipProps = {
  name: keyof typeof icons
  active?: boolean
}

export default function CategoryChip({
  name,
  active = false,
}: CategoryChipProps) {
  const Icon = icons[name]
  const router = useRouter()

  function handleClick() {
    router.push(
      `/search?category=${encodeURIComponent(name)}`
    )
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-3 text-sm font-semibold transition ${
        active
          ? 'border-gray-950 bg-gray-950 text-white'
          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
      }`}
    >
      <Icon size={17} />

      {name}
    </button>
  )
}