'use client'

import SearchBar from './search-bar'
import { useRouter } from 'next/navigation'

export default function HomeSearch() {
  const router = useRouter()

  function handleSearch(value: string) {
    router.push(
      `/search?q=${encodeURIComponent(value)}`
    )
  }

  return (
    <SearchBar
      placeholder="Para onde queres ir?"
      onSearch={handleSearch}
    />
  )
}