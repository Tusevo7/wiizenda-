'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

export default function NewExperiencePage() {
  const supabase = createClient()

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Praia',
    province: 'Luanda',
    city: 'Luanda',
    location: '',
    price: '',
    duration_hours: '',
    capacity: '',
    cover_image: '',
  })

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('Precisas iniciar sessão.')
        setLoading(false)
        return
      }

      const { data: agency, error: agencyError } =
        await supabase
          .from('agencies')
          .select('id')
          .eq('owner_id', user.id)
          .maybeSingle()

      if (agencyError) {
        throw agencyError
      }

      if (!agency) {
        setMessage(
          'Não encontrámos uma agência associada à tua conta.'
        )
        setLoading(false)
        return
      }

      const slug = form.title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')

      const { error } = await supabase
        .from('experiences')
        .insert({
          agency_id: agency.id,
          title: form.title,
          slug,
          description: form.description,
          category: form.category,
          province: form.province,
          city: form.city,
          location: form.location,
          price: Number(form.price),
          duration_hours: Number(
            form.duration_hours
          ),
          capacity: Number(form.capacity),
          cover_image: form.cover_image || null,
          status: 'draft',
        })

      if (error) {
        throw error
      }

      window.location.href = '/agency'
    } catch (error) {
      console.error(error)

      setMessage(
        'Não foi possível criar a experiência. Verifica os dados e tenta novamente.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">
        <Link
          href="/agency"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-gray-950"
        >
          <ArrowLeft size={18} />
          Voltar para a agência
        </Link>

        <div className="mt-8">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-orange-500">
            Nova experiência
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">
            Cria uma nova experiência
          </h1>

          <p className="mt-3 text-gray-500">
            Preenche os detalhes da experiência que queres
            oferecer aos viajantes.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >
          {/* Nome */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Nome da experiência
            </label>

            <input
              required
              value={form.title}
              onChange={(e) =>
                updateField('title', e.target.value)
              }
              placeholder="Ex.: Passeio de barco no Mussulo"
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          {/* Descrição */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Descrição
            </label>

            <textarea
              required
              rows={5}
              value={form.description}
              onChange={(e) =>
                updateField(
                  'description',
                  e.target.value
                )
              }
              placeholder="Descreve o que o viajante vai viver..."
              className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          {/* Categoria */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Categoria
            </label>

            <select
              value={form.category}
              onChange={(e) =>
                updateField(
                  'category',
                  e.target.value
                )
              }
              className="mt-2 w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 outline-none focus:border-orange-500"
            >
              {categories.map((category) => (
                <option
                  key={category}
                  value={category}
                >
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Localização */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">
              Localização
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm text-gray-500">
                  Província
                </label>

                <input
                  required
                  value={form.province}
                  onChange={(e) =>
                    updateField(
                      'province',
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">
                  Cidade
                </label>

                <input
                  value={form.city}
                  onChange={(e) =>
                    updateField(
                      'city',
                      e.target.value
                    )
                  }
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="text-sm text-gray-500">
                Local específico
              </label>

              <input
                required
                value={form.location}
                onChange={(e) =>
                  updateField(
                    'location',
                    e.target.value
                  )
                }
                placeholder="Ex.: Ilha do Mussulo"
                className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Preço e capacidade */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">
              Informações da experiência
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <label className="text-sm text-gray-500">
                  Preço (Kz)
                </label>

                <input
                  required
                  type="number"
                  min="0"
                  value={form.price}
                  onChange={(e) =>
                    updateField(
                      'price',
                      e.target.value
                    )
                  }
                  placeholder="25000"
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">
                  Duração (horas)
                </label>

                <input
                  required
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={form.duration_hours}
                  onChange={(e) =>
                    updateField(
                      'duration_hours',
                      e.target.value
                    )
                  }
                  placeholder="8"
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm text-gray-500">
                  Capacidade
                </label>

                <input
                  required
                  type="number"
                  min="1"
                  value={form.capacity}
                  onChange={(e) =>
                    updateField(
                      'capacity',
                      e.target.value
                    )
                  }
                  placeholder="20"
                  className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
                />
              </div>
            </div>
          </div>

          {/* Imagem */}
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Imagem de capa
            </label>

            <p className="mt-1 text-xs text-gray-500">
              Por enquanto usamos uma URL. Depois vamos
              integrar o Supabase Storage para upload direto.
            </p>

            <input
              type="url"
              value={form.cover_image}
              onChange={(e) =>
                updateField(
                  'cover_image',
                  e.target.value
                )
              }
              placeholder="https://..."
              className="mt-3 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading && (
              <Loader2
                size={19}
                className="animate-spin"
              />
            )}

            {loading
              ? 'A criar experiência...'
              : 'Criar experiência'}
          </button>
        </form>
      </div>
    </main>
  )
}