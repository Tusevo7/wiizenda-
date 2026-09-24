'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  Building2,
  ChevronRight,
  MapPin,
} from 'lucide-react'
import {
  FormEvent,
  useEffect,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

const categories = [
  'Hotéis e Resorts',
  'Restaurantes',
  'Lodges',
  'Piscinas e Clubes',
  'Praias',
  'Espaços de Lazer',
  'Parques',
  'Spas',
  'Entretenimento',
  'Eventos',
]

export default function BusinessRegisterPage() {
  const router = useRouter()

  const [loadingUser, setLoadingUser] =
    useState(true)

  const [saving, setSaving] =
    useState(false)

  const [error, setError] =
    useState('')

  const [userId, setUserId] =
    useState<string | null>(null)

  const [form, setForm] = useState({
    business_name: '',
    category: '',
    description: '',
    province: '',
    city: '',
    location: '',
    phone: '',
    website: '',
    instagram: '',
    price_from: '',
  })

  useEffect(() => {
    async function checkUser() {
      const supabase = createClient()

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setLoadingUser(false)
    }

    void checkUser()
  }, [router])

  function updateField(
    field: keyof typeof form,
    value: string,
  ) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function createSlug(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setError('')

    if (!userId) {
      setError(
        'Não foi possível identificar a tua conta.',
      )
      return
    }

    if (
      !form.business_name.trim() ||
      !form.category ||
      !form.province.trim() ||
      !form.city.trim()
    ) {
      setError(
        'Preenche o nome, categoria, província e cidade.',
      )
      return
    }

    setSaving(true)

    const supabase = createClient()

    const baseSlug =
      createSlug(form.business_name) ||
      `negocio-${Date.now()}`

    let slug = baseSlug

    const { data: existing } =
      await supabase
        .from('weekend_places')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

    if (existing) {
      slug = `${baseSlug}-${Date.now()}`
    }

    const price =
      form.price_from.trim() === ''
        ? null
        : Number(
            form.price_from.replace(/\D/g, ''),
          )

    const {
      data,
      error: insertError,
    } = await supabase
      .from('weekend_places')
      .insert({
        owner_id: userId,

        business_name:
          form.business_name.trim(),

        slug,

        category:
          form.category,

        description:
          form.description.trim() ||
          null,

        province:
          form.province.trim() ||
          null,

        city:
          form.city.trim() ||
          null,

        location:
          form.location.trim() ||
          null,

        phone:
          form.phone.trim() ||
          null,

        website:
          form.website.trim() ||
          null,

        instagram:
          form.instagram.trim() ||
          null,

        price_from:
          Number.isFinite(price)
            ? price
            : null,

        status: 'pending',

        is_featured: false,

        subscription_plan: null,

        subscription_expires_at: null,
      })
      .select('id')
      .single()

    if (insertError) {
      console.error(
        'Erro ao criar negócio:',
        insertError,
      )

      setError(
        insertError.message ||
          'Não foi possível criar o negócio.',
      )

      setSaving(false)
      return
    }

    router.push(
      `/business/dashboard`,
    )

    void data
  }

  if (loadingUser) {
    return (
      <main className="min-h-screen bg-[#FAFAFA]">

        <div className="mx-auto max-w-2xl px-5 py-10">

          <div className="animate-pulse">

            <div className="h-5 w-20 rounded bg-gray-200" />

            <div className="mt-8 h-9 w-72 rounded bg-gray-200" />

            <div className="mt-3 h-4 w-full rounded bg-gray-200" />

            <div className="mt-8 h-[600px] rounded-3xl bg-gray-200" />

          </div>

        </div>

      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA]">

      {/* HEADER */}
      <header className="border-b border-gray-100 bg-white">

        <div className="mx-auto flex max-w-3xl items-center px-5 py-4 sm:px-6">

          <Link
            href="/business/dashboard"
            className="flex items-center gap-2 text-sm font-bold text-gray-600 transition hover:text-gray-950"
          >
            <ArrowLeft size={17} />
            Voltar
          </Link>

        </div>

      </header>

      {/* CONTEÚDO */}
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6 sm:py-12">

        {/* INTRO */}
        <div>

          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
            <Building2 size={23} />
          </div>

          <p className="mt-6 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500">
            Presença na Wizenda
          </p>

          <h1 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">
            Cadastra o teu negócio
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-500 sm:text-base">
            Preenche as informações abaixo para
            criares a página do teu estabelecimento
            na Wizenda.
          </p>

        </div>

        {/* FORMULÁRIO */}
        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          {/* INFORMAÇÕES PRINCIPAIS */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6">

              <h2 className="text-lg font-black text-gray-950">
                Informações principais
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Estas informações serão apresentadas aos visitantes.
              </p>

            </div>

            <div className="space-y-5">

              {/* NOME */}
              <div>

                <label
                  htmlFor="business_name"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Nome do negócio *
                </label>

                <input
                  id="business_name"
                  type="text"
                  required
                  value={
                    form.business_name
                  }
                  onChange={(event) =>
                    updateField(
                      'business_name',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Resort Baía Azul"
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

              {/* CATEGORIA */}
              <div>

                <label
                  htmlFor="category"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Categoria *
                </label>

                <select
                  id="category"
                  required
                  value={form.category}
                  onChange={(event) =>
                    updateField(
                      'category',
                      event.target.value,
                    )
                  }
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                >
                  <option value="">
                    Seleciona uma categoria
                  </option>

                  {categories.map(
                    (item) => (
                      <option
                        key={item}
                        value={item}
                      >
                        {item}
                      </option>
                    ),
                  )}
                </select>

              </div>

              {/* DESCRIÇÃO */}
              <div>

                <label
                  htmlFor="description"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Descrição
                </label>

                <textarea
                  id="description"
                  rows={5}
                  value={
                    form.description
                  }
                  onChange={(event) =>
                    updateField(
                      'description',
                      event.target.value,
                    )
                  }
                  placeholder="Conta aos visitantes o que torna o teu lugar especial..."
                  className="w-full resize-none rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm leading-6 text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

            </div>

          </section>

          {/* LOCALIZAÇÃO */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6 flex items-start gap-3">

              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                <MapPin size={18} />
              </div>

              <div>

                <h2 className="text-lg font-black text-gray-950">
                  Localização
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Ajuda os visitantes a encontrar o teu negócio.
                </p>

              </div>

            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* PROVÍNCIA */}
              <div>

                <label
                  htmlFor="province"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Província *
                </label>

                <input
                  id="province"
                  type="text"
                  required
                  value={
                    form.province
                  }
                  onChange={(event) =>
                    updateField(
                      'province',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Luanda"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

              {/* CIDADE */}
              <div>

                <label
                  htmlFor="city"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Cidade *
                </label>

                <input
                  id="city"
                  type="text"
                  required
                  value={form.city}
                  onChange={(event) =>
                    updateField(
                      'city',
                      event.target.value,
                    )
                  }
                  placeholder="Ex.: Luanda"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

            </div>

            {/* LOCAL */}
            <div className="mt-5">

              <label
                htmlFor="location"
                className="mb-2 block text-xs font-bold text-gray-700"
              >
                Morada / localização
              </label>

              <input
                id="location"
                type="text"
                value={form.location}
                onChange={(event) =>
                  updateField(
                    'location',
                    event.target.value,
                  )
                }
                placeholder="Ex.: Ilha de Luanda, Av. 4 de Fevereiro"
                className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
              />

            </div>

          </section>

          {/* CONTACTOS */}
          <section className="rounded-3xl bg-white p-5 shadow-sm sm:p-7">

            <div className="mb-6">

              <h2 className="text-lg font-black text-gray-950">
                Contactos
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Estes contactos poderão ser utilizados pelos visitantes.
              </p>

            </div>

            <div className="space-y-5">

              {/* TELEFONE */}
              <div>

                <label
                  htmlFor="phone"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Telefone
                </label>

                <input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(event) =>
                    updateField(
                      'phone',
                      event.target.value,
                    )
                  }
                  placeholder="+244 9XX XXX XXX"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

              {/* WEBSITE */}
              <div>

                <label
                  htmlFor="website"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Website
                </label>

                <input
                  id="website"
                  type="url"
                  value={
                    form.website
                  }
                  onChange={(event) =>
                    updateField(
                      'website',
                      event.target.value,
                    )
                  }
                  placeholder="https://exemplo.com"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

              {/* INSTAGRAM */}
              <div>

                <label
                  htmlFor="instagram"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Instagram
                </label>

                <input
                  id="instagram"
                  type="url"
                  value={
                    form.instagram
                  }
                  onChange={(event) =>
                    updateField(
                      'instagram',
                      event.target.value,
                    )
                  }
                  placeholder="https://instagram.com/teunegocio"
                  className="h-12 w-full rounded-xl border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                />

              </div>

              {/* PREÇO */}
              <div>

                <label
                  htmlFor="price_from"
                  className="mb-2 block text-xs font-bold text-gray-700"
                >
                  Preço a partir de
                </label>

                <div className="relative">

                  <input
                    id="price_from"
                    type="text"
                    inputMode="numeric"
                    value={
                      form.price_from
                    }
                    onChange={(event) =>
                      updateField(
                        'price_from',
                        event.target.value.replace(
                          /\D/g,
                          '',
                        ),
                      )
                    }
                    placeholder="Ex.: 25000"
                    className="h-12 w-full rounded-xl border border-gray-200 px-4 pr-14 text-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-500/10"
                  />

                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400">
                    Kz
                  </span>

                </div>

              </div>

            </div>

          </section>

          {/* ERRO */}
          {error && (
            <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* AVISO */}
          <div className="rounded-2xl border border-orange-100 bg-orange-50 px-4 py-4">

            <p className="text-xs font-bold text-orange-700">
              O teu negócio será enviado para análise.
            </p>

            <p className="mt-1 text-xs leading-5 text-orange-700/75">
              Depois do cadastro, a equipa da Wizenda
              irá analisar as informações antes da publicação.
            </p>

          </div>

          {/* BOTÃO */}
          <button
            type="submit"
            disabled={saving}
            className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-gray-950 px-6 py-4 text-sm font-black text-white shadow-lg transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? 'A criar negócio...'
              : 'Continuar'}

            {!saving && (
              <ChevronRight size={18} />
            )}
          </button>

        </form>

      </div>

    </main>
  )
}