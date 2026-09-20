'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type PageProps = {
  params: Promise<{
    id: string
  }>
}

const categories = [
  'Praia',
  'Aventura',
  'Natureza',
  'Cultura',
  'Gastronomia',
]

export default function EditExperiencePage({
  params,
}: PageProps) {
  const supabase = createClient()

  const [id, setId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Praia',
    province: '',
    city: '',
    location: '',
    price: '',
    duration_hours: '',
    capacity: '',
    cover_image: '',
    status: 'draft',
  })

  useEffect(() => {
    async function loadExperience() {
      const { id: experienceId } = await params

      setId(experienceId)

      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        setMessage('Precisas iniciar sessão.')
        setLoading(false)
        return
      }

      const { data: agency } = await supabase
        .from('agencies')
        .select('id')
        .eq('owner_id', user.id)
        .maybeSingle()

      if (!agency) {
        setMessage('Agência não encontrada.')
        setLoading(false)
        return
      }

      const { data: experience, error } =
        await supabase
          .from('experiences')
          .select(`
            title,
            description,
            category,
            province,
            city,
            location,
            price,
            duration_hours,
            capacity,
            cover_image,
            status
          `)
          .eq('id', experienceId)
          .eq('agency_id', agency.id)
          .single()

      if (error || !experience) {
        setMessage(
          'Experiência não encontrada ou sem permissão.'
        )
        setLoading(false)
        return
      }

      setForm({
        title: experience.title || '',
        description: experience.description || '',
        category: experience.category || 'Praia',
        province: experience.province || '',
        city: experience.city || '',
        location: experience.location || '',
        price: String(experience.price || ''),
        duration_hours: String(
          experience.duration_hours || ''
        ),
        capacity: String(experience.capacity || ''),
        cover_image: experience.cover_image || '',
        status: experience.status || 'draft',
      })

      setLoading(false)
    }

    loadExperience()
  }, [])

  function updateField(
    field: keyof typeof form,
    value: string
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function saveExperience() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('experiences')
      .update({
        title: form.title,
        description: form.description,
        category: form.category,
        province: form.province,
        city: form.city,
        location: form.location,
        price: Number(form.price),
        duration_hours: Number(form.duration_hours),
        capacity: Number(form.capacity),
        cover_image: form.cover_image || null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage(
        'Não foi possível guardar as alterações.'
      )
      setSaving(false)
      return
    }

    setMessage('Alterações guardadas com sucesso.')
    setSaving(false)
  }

  async function publishExperience() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('experiences')
      .update({
        status: 'published',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage(
        'Não foi possível publicar a experiência.'
      )
      setSaving(false)
      return
    }

    setForm((current) => ({
      ...current,
      status: 'published',
    }))

    setMessage('Experiência publicada com sucesso.')
    setSaving(false)
  }

  async function unpublishExperience() {
    setSaving(true)
    setMessage('')

    const { error } = await supabase
      .from('experiences')
      .update({
        status: 'draft',
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)

    if (error) {
      console.error(error)
      setMessage(
        'Não foi possível retirar a experiência da publicação.'
      )
      setSaving(false)
      return
    }

    setForm((current) => ({
      ...current,
      status: 'draft',
    }))

    setMessage('Experiência voltou para rascunho.')
    setSaving(false)
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2
          size={30}
          className="animate-spin text-orange-500"
        />
      </main>
    )
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
            Gestão da experiência
          </p>

          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Editar experiência
            </h1>

            <span
              className={`w-fit rounded-full px-3 py-1.5 text-xs font-bold ${
                form.status === 'published'
                  ? 'bg-green-50 text-green-600'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              {form.status === 'published'
                ? 'Publicada'
                : 'Rascunho'}
            </span>
          </div>
        </div>

        <div className="mt-8 space-y-5">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Nome da experiência
            </label>

            <input
              value={form.title}
              onChange={(e) =>
                updateField('title', e.target.value)
              }
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Descrição
            </label>

            <textarea
              rows={6}
              value={form.description}
              onChange={(e) =>
                updateField(
                  'description',
                  e.target.value
                )
              }
              className="mt-2 w-full resize-none rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
            />
          </div>

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

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">
              Localização
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <input
                value={form.province}
                onChange={(e) =>
                  updateField(
                    'province',
                    e.target.value
                  )
                }
                placeholder="Província"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                value={form.city}
                onChange={(e) =>
                  updateField('city', e.target.value)
                }
                placeholder="Cidade"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>

            <input
              value={form.location}
              onChange={(e) =>
                updateField(
                  'location',
                  e.target.value
                )
              }
              placeholder="Local específico"
              className="mt-4 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <h2 className="font-bold">
              Informações
            </h2>

            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <input
                type="number"
                min="0"
                value={form.price}
                onChange={(e) =>
                  updateField(
                    'price',
                    e.target.value
                  )
                }
                placeholder="Preço (Kz)"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
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
                placeholder="Duração"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />

              <input
                type="number"
                min="1"
                value={form.capacity}
                onChange={(e) =>
                  updateField(
                    'capacity',
                    e.target.value
                  )
                }
                placeholder="Capacidade"
                className="rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
              />
            </div>
          </div>

          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <label className="text-sm font-bold">
              Imagem de capa
            </label>

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
              className="mt-2 w-full rounded-2xl border border-gray-200 px-4 py-3 outline-none focus:border-orange-500"
            />
          </div>

          {message && (
            <div className="rounded-2xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-700">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={saveExperience}
              disabled={saving}
              className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gray-950 px-5 py-4 font-bold text-white transition hover:bg-gray-800 disabled:opacity-60"
            >
              {saving && (
                <Loader2
                  size={18}
                  className="animate-spin"
                />
              )}
              Guardar alterações
            </button>

            {form.status === 'draft' ? (
              <button
                type="button"
                onClick={publishExperience}
                disabled={saving}
                className="flex flex-1 items-center justify-center rounded-2xl bg-orange-500 px-5 py-4 font-bold text-white transition hover:bg-orange-600 disabled:opacity-60"
              >
                Publicar experiência
              </button>
            ) : (
              <button
                type="button"
                onClick={unpublishExperience}
                disabled={saving}
                className="flex flex-1 items-center justify-center rounded-2xl border border-gray-200 bg-white px-5 py-4 font-bold text-gray-800 transition hover:bg-gray-50 disabled:opacity-60"
              >
                Voltar para rascunho
              </button>
            )}
          </div>
        </div>
      </div>
    </main>
  )
}