
'use client'

import {
  ChangeEvent,
  FormEvent,
  useEffect,
  useState,
} from 'react'
import {
  ArrowLeft,
  Camera,
  CheckCircle2,
  Save,
  User,
} from 'lucide-react'
import { useRouter } from 'next/navigation'

import { createClient } from '@/lib/supabase/client'

export default function EditProfilePage() {
  const router = useRouter()
  const supabase = createClient()

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [travelerType, setTravelerType] = useState('')

  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarFile, setAvatarFile] =
    useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] =
    useState('')

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select(
          'full_name, phone, city, traveler_type, avatar_url',
        )
        .eq('id', user.id)
        .single()

      if (profile) {
        setFullName(profile.full_name || '')
        setPhone(profile.phone || '')
        setCity(profile.city || '')
        setTravelerType(
          profile.traveler_type || '',
        )
        setAvatarUrl(profile.avatar_url || '')
      }

      setLoading(false)
    }

    loadProfile()
  }, [router, supabase])

  function handleAvatarChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage(
        'Seleciona uma imagem válida.',
      )
      setSuccess(false)
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage(
        'A foto deve ter no máximo 5 MB.',
      )
      setSuccess(false)
      return
    }

    setAvatarFile(file)
    setAvatarPreview(
      URL.createObjectURL(file),
    )

    setMessage('')
    setSuccess(false)
  }

  async function uploadAvatar(userId: string) {
    if (!avatarFile) {
      return avatarUrl
    }

    const extension =
      avatarFile.name.split('.').pop()?.toLowerCase() ||
      'jpg'

    const filePath = `${userId}/avatar-${Date.now()}.${extension}`

    const { error: uploadError } =
      await supabase.storage
        .from('profile-media')
        .upload(filePath, avatarFile, {
          cacheControl: '3600',
          upsert: false,
        })

    if (uploadError) {
      throw new Error(
        'Não foi possível carregar a foto.',
      )
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('profile-media')
      .getPublicUrl(filePath)

    return publicUrl
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setSaving(true)
    setMessage('')
    setSuccess(false)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      let finalAvatarUrl = avatarUrl

      if (avatarFile) {
        finalAvatarUrl =
          await uploadAvatar(user.id)
      }

      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          phone: phone.trim(),
          city: city.trim(),
          traveler_type: travelerType,
          avatar_url: finalAvatarUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)

      if (error) {
        throw new Error(
          'Não foi possível atualizar o perfil.',
        )
      }

      setAvatarUrl(finalAvatarUrl)
      setAvatarFile(null)
      setAvatarPreview('')

      setSuccess(true)
      setMessage(
        'Perfil atualizado com sucesso!',
      )

      setTimeout(() => {
        router.push('/profile')
        router.refresh()
      }, 900)
    } catch (error) {
      setSuccess(false)

      setMessage(
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro. Tenta novamente.',
      )
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-6 sm:py-10">
        <div className="mx-auto max-w-2xl">
          <div className="animate-pulse rounded-[2rem] bg-white p-8 shadow-sm">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="mt-4 h-8 w-52 rounded bg-gray-200" />

            <div className="mt-10 space-y-6">
              <div className="mx-auto h-32 w-32 rounded-full bg-gray-100" />
              <div className="h-14 rounded-2xl bg-gray-100" />
              <div className="h-14 rounded-2xl bg-gray-100" />
              <div className="h-14 rounded-2xl bg-gray-100" />
            </div>
          </div>
        </div>
      </main>
    )
  }

  const displayedAvatar =
    avatarPreview || avatarUrl

  return (
    <main className="min-h-screen bg-gray-50 px-5 py-8 sm:px-6 sm:py-10">
      <div className="mx-auto max-w-2xl">

        {/* Voltar */}
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-white hover:text-gray-950"
        >
          <ArrowLeft size={17} />
          Voltar ao perfil
        </button>

        <div className="overflow-hidden rounded-[2rem] bg-white shadow-sm">

          {/* Cabeçalho */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-400 px-6 py-8 text-white sm:px-8">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-white/75">
              Wizenda
            </p>

            <h1 className="mt-2 text-3xl font-black tracking-tight">
              Editar perfil
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-white/85">
              Atualiza a tua foto e os teus dados
              pessoais.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="space-y-6 p-6 sm:p-8"
          >

            {/* Foto de perfil */}
            <div className="flex flex-col items-center border-b border-gray-100 pb-7">

              <div className="relative">

                <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full bg-orange-100 ring-4 ring-orange-50">
                  {displayedAvatar ? (
                    <img
                      src={displayedAvatar}
                      alt="Foto de perfil"
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <User
                      size={48}
                      strokeWidth={1.5}
                      className="text-orange-500"
                    />
                  )}
                </div>

                <label
                  htmlFor="avatar"
                  className="absolute bottom-1 right-1 flex h-11 w-11 cursor-pointer items-center justify-center rounded-full bg-black text-white shadow-lg transition hover:scale-105 hover:bg-gray-800"
                  title="Alterar foto"
                >
                  <Camera size={19} />

                  <input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>

              </div>

              <p className="mt-4 text-sm font-semibold text-gray-900">
                Foto de perfil
              </p>

              <p className="mt-1 text-xs text-gray-400">
                JPG, PNG ou WEBP · máximo 5 MB
              </p>

            </div>

            {/* Nome */}
            <div>
              <label
                htmlFor="fullName"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Nome completo
              </label>

              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(event) =>
                  setFullName(event.target.value)
                }
                placeholder="Ex.: Tusevo Manuel João"
                required
                autoComplete="name"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* Telefone */}
            <div>
              <label
                htmlFor="phone"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Telefone
              </label>

              <input
                id="phone"
                type="tel"
                value={phone}
                onChange={(event) =>
                  setPhone(event.target.value)
                }
                placeholder="Ex.: +244 9XX XXX XXX"
                autoComplete="tel"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* Cidade */}
            <div>
              <label
                htmlFor="city"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Cidade
              </label>

              <input
                id="city"
                type="text"
                value={city}
                onChange={(event) =>
                  setCity(event.target.value)
                }
                placeholder="Ex.: Luanda"
                autoComplete="address-level2"
                className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              />
            </div>

            {/* Tipo de viajante */}
            <div>
              <label
                htmlFor="travelerType"
                className="mb-2 block text-sm font-semibold text-gray-900"
              >
                Que tipo de viajante és?
              </label>

              <select
                id="travelerType"
                value={travelerType}
                onChange={(event) =>
                  setTravelerType(event.target.value)
                }
                className="w-full appearance-none rounded-2xl border border-gray-200 bg-white px-4 py-3.5 text-sm text-gray-900 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10"
              >
                <option value="">
                  Seleciona uma opção
                </option>

                <option value="aventura">
                  Aventura
                </option>

                <option value="praia">
                  Praia
                </option>

                <option value="cultura">
                  Cultura
                </option>

                <option value="natureza">
                  Natureza
                </option>

                <option value="gastronomia">
                  Gastronomia
                </option>

                <option value="familia">
                  Família
                </option>

                <option value="luxo">
                  Luxo
                </option>

                <option value="negocios">
                  Negócios
                </option>
              </select>
            </div>

            {/* Feedback */}
            {message && (
              <div
                className={`flex items-center gap-3 rounded-2xl p-4 text-sm ${
                  success
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700'
                }`}
              >
                {success && (
                  <CheckCircle2
                    size={19}
                    className="shrink-0"
                  />
                )}

                <span>{message}</span>
              </div>
            )}

            {/* Botões */}
            <div className="flex flex-col gap-3 pt-2 sm:flex-row-reverse">

              <button
                type="submit"
                disabled={saving}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-black px-5 py-3.5 text-sm font-bold text-white transition hover:bg-gray-800 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Save size={18} />

                {saving
                  ? 'A guardar...'
                  : 'Guardar alterações'}
              </button>

              <button
                type="button"
                onClick={() => router.push('/profile')}
                disabled={saving}
                className="flex flex-1 items-center justify-center rounded-2xl border border-gray-200 px-5 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>

            </div>
          </form>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          A tua foto e os teus dados ajudam a
          personalizar a tua experiência na Wizenda.
        </p>
      </div>
    </main>
  )
}
