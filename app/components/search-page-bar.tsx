'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import SearchBar from './search-bar'

export default function SearchPageBar() {
  const router = useRouter()
  const searchParams = useSearchParams()

  function handleSearch(value: string) {
    const params = new URLSearchParams(
      searchParams.toString(),
    )

    if (value.trim()) {
      params.set('q', value.trim())
    } else {
      params.delete('q')
    }

    const queryString = params.toString()

    router.push(
      queryString
        ? `/search?${queryString}`
        : '/search',
    )
  }

  return (
    <SearchBar
      placeholder="Pesquisar experiências, lugares..."
      onSearch={handleSearch}
    />
  )
}