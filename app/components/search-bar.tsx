'use client'

import { Search, X } from 'lucide-react'
import { useState } from 'react'

type SearchBarProps = {
  placeholder?: string
  onSearch?: (value: string) => void
}

export default function SearchBar({
  placeholder = 'O que queres descobrir?',
  onSearch,
}: SearchBarProps) {
  const [value, setValue] = useState('')

  function clearSearch() {
    setValue('')
    onSearch?.('')
  }

  function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const search = value.trim()

    if (!search) {
      return
    }

    onSearch?.(search)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex h-14 items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 shadow-sm transition focus-within:border-orange-500 focus-within:ring-4 focus-within:ring-orange-500/10"
    >
      <Search
        size={20}
        className="shrink-0 text-gray-400"
      />

      <input
        type="text"
        value={value}
        onChange={(event) =>
          setValue(event.target.value)
        }
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm text-gray-900 outline-none placeholder:text-gray-400"
      />

      {value && (
        <button
          type="button"
          onClick={clearSearch}
          aria-label="Limpar pesquisa"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
        >
          <X size={17} />
        </button>
      )}
    </form>
  )
}