
'use client'

import Link from 'next/link'
import { ArrowLeft, ImagePlus, Loader2, Save } from 'lucide-react'
import { ChangeEvent, FormEvent, useEffect, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Agency = {
  id: string
  name: string
  description: string | null
  logo_url: string | null
  cover_image: string | null
  phone: string | null
  email: string | null
  province: string | null
  city: string | null
  address: string | null
}

export default function AgencyProfileEditPage() {
  const [agency, setAgency] = useState<Agency | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity] = useState('')
  const [address, setAddress] = useState('')

  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [coverFile, setCoverFile] = useState<File | null>(null)

  const [logoPreview, setLogoPreview] = useState('')
  const [coverPreview, setCoverPreview] = useState('')

  const supabase = createClient()

  useEffect(() => {
    async function loadAgency() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (profile?.role !== 'agency') {
        window.location.href = '/profile'
        return
      }

      const { data, error } = await supabase
        .from('agencies')
        .select(
          `
          id,
          name,
          description,
          logo_url,
          cover_image,
          phone,
          email,
          province,
          city,
          address
        `,
        )
        .eq('owner_id', user.id)
        .maybeSingle()

      if (error || !data) {
        console.error(error)
        window.location.href = '/agency/profile'
        return
      }

      const loadedAgency = data as Agency

      setAgency(loadedAgency)

      setName(loadedAgency.name ?? '')
      setDescription(loadedAgency.description ?? '')
      setPhone(loadedAgency.phone ?? '')
      setEmail(loadedAgency.email ?? '')
      setProvince(loadedAgency.province ?? '')
      setCity(loadedAgency.city ?? '')
      setAddress(loadedAgency.address ?? '')

      setLogoPreview(loadedAgency.logo_url ?? '')
      setCoverPreview(loadedAgency.cover_image ?? '')

      setLoading(false)
    }

    loadAgency()
  }, [])

  function handleLogoChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Escolhe uma imagem válida.')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('A logo deve ter no máximo 5 MB.')
      return
    }

    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  function handleCoverChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Escolhe uma imagem válida.')
      return
    }

    if (file.size > 8 * 1024 * 1024) {
      alert('A capa deve ter no máximo 8 MB.')
      return
    }

    setCoverFile(file)
    setCoverPreview(URL.createObjectURL(file))
  }

  async function uploadImage(
    file: File,
    folder: 'logo' | 'cover',
    userId: string,
  ) {
    const extension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const path = `${userId}/${folder}-${crypto.randomUUID()}.${extension}`

    const { error } = await supabase.storage
      .from('agency-media')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (error) {
      throw error
    }

    const { data } = supabase.storage
      .from('agency-media')
      .getPublicUrl(path)

    return data.publicUrl
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!agency) return

    setSaving(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        window.location.href = '/login'
        return
      }

      let logoUrl = agency.logo_url
      let coverUrl = agency.cover_image

      if (logoFile) {
        logoUrl = await uploadImage(
          logoFile,
          'logo',
          user.id,
        )
      }

      if (coverFile) {
        coverUrl = await uploadImage(
          coverFile,
          'cover',
          user.id,
        )
      }

      const { error } = await supabase
        .from('agencies')
        .update({
          name: name.trim(),
          description: description.trim() || null,
          phone: phone.trim() || null,
          email: email.trim() || null,
          province: province.trim() || null,
          city: city.trim() || null,
          address: address.trim() || null,
          logo_url: logoUrl,
          cover_image: coverUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', agency.id)

      if (error) {
        throw error
      }

      window.location.href = '/agency/profile'
    } catch (error) {
      console.error(error)

      alert(
        'Não foi possível guardar as alterações. Verifica as políticas do Storage e tenta novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-3xl px-5 py-10">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-100" />
          <div className="mt-8 h-72 animate-pulse rounded-3xl bg-gray-100" />
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#F7F7F7] pb-16">
      <div className="mx-auto max-w-3xl px-5 py-8 sm:px-6">

        <div className="mb-8 flex items-center gap-3">
          <Link
            href="/agency/profile"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-gray-700 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft size={19} />
          </Link>

          <div>
            <h1 className="text-2xl font-black text-gray-950">
              Editar perfil
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Atualiza as informações da tua agência.
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-6"
        >

          {/* CAPA */}
          <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">

            <div className="relative h-56 bg-gray-100 sm:h-64">

              {coverPreview ? (
                <img
                  src={coverPreview}
                  alt="Capa da agência"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-gray-400">
                  <div className="text-center">
                    <ImagePlus
                      size={34}
                      className="mx-auto mb-2"
                    />

                    <p className="text-sm font-medium">
                      Adiciona uma foto de capa
                    </p>
                  </div>
                </div>
              )}

              <label className="absolute bottom-4 right-4 flex cursor-pointer items-center gap-2 rounded-full bg-white px-4 py-2.5 text-sm font-bold text-gray-800 shadow-lg transition hover:bg-gray-50">
                <ImagePlus size={17} />

                Alterar capa

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleCoverChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* LOGO */}
            <div className="relative px-5 pb-6 sm:px-7">

              <div className="-mt-12 mb-5">

                <div className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white bg-gray-100 shadow-md">

                  {logoPreview ? (
                    <img
                      src={logoPreview}
                      alt="Logo da agência"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImagePlus
                        size={25}
                        className="text-gray-400"
                      />
                    </div>
                  )}

                </div>

                <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50">
                  <ImagePlus size={15} />

                  Alterar logo

                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoChange}
                    className="hidden"
                  />
                </label>
              </div>

              <p className="text-xs text-gray-400">
                Logo: máximo 5 MB. Capa: máximo 8 MB.
              </p>

            </div>
          </section>

          {/* INFORMAÇÕES */}
          <section className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm sm:p-7">

            <h2 className="mb-6 text-lg font-black text-gray-950">
              Informações da agência
            </h2>

            <div className="space-y-5">

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Nome da agência
                </label>

                <input
                  value={name}
                  onChange={(event) =>
                    setName(event.target.value)
                  }
                  required
                  className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Descrição
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  rows={5}
                  className="w-full resize-none rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  placeholder="Fala um pouco sobre a tua agência..."
                />
              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Telefone
                  </label>

                  <input
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Email
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

              </div>

              <div className="grid gap-5 sm:grid-cols-2">

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Província
                  </label>

                  <input
                    value={province}
                    onChange={(event) =>
                      setProvince(event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-bold text-gray-700">
                    Cidade
                  </label>

                  <input
                    value={city}
                    onChange={(event) =>
                      setCity(event.target.value)
                    }
                    className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                  />
                </div>

              </div>

              <div>
                <label className="mb-2 block text-sm font-bold text-gray-700">
                  Endereço
                </label>

                <input
                  value={address}
                  onChange={(event) =>
                    setAddress(event.target.value)
                  }
                  className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-100"
                />
              </div>

            </div>
          </section>

          {/* GUARDAR */}
          <button
            type="submit"
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 py-4 text-sm font-black text-white shadow-sm transition hover:bg-[#E94B14] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? (
              <>
                <Loader2
                  size={18}
                  className="animate-spin"
                />

                A guardar...
              </>
            ) : (
              <>
                <Save size={18} />

                Guardar alterações
              </>
            )}
          </button>

        </form>
      </div>
    </main>
  )
}
