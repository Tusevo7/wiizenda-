
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import {
  ArrowLeft,
  Megaphone,
  Plus,
  Pause,
  Play,
  Trash2,
  ShieldCheck,
  ImagePlus,
  X,
} from 'lucide-react'

type Advertisement = {
  id: string
  title: string
  description: string | null
  image_url: string | null
  button_text: string | null
  button_url: string | null
  advertiser_name: string | null
  status: 'draft' | 'active' | 'paused' | 'expired'
  starts_at: string | null
  ends_at: string | null
  priority: number
  created_at: string
  created_by: string | null
}

export default function AdvertisementsPage() {
  const supabase = createClient()

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [ads, setAds] = useState<Advertisement[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [authLoading, setAuthLoading] = useState(true)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [advertiserName, setAdvertiserName] = useState('')
  const [buttonText, setButtonText] = useState('')
  const [buttonUrl, setButtonUrl] = useState('')

  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  async function checkAdmin() {
    setAuthLoading(true)
    setErrorMessage(null)

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      console.error('Erro ao obter utilizador:', userError)

      setErrorMessage(
        `Erro de autenticação: ${userError.message}`,
      )

      setAuthLoading(false)
      return
    }

    if (!user) {
      setUserEmail(null)
      setIsAdmin(false)
      setErrorMessage('Nenhum utilizador autenticado.')
      setAuthLoading(false)
      return
    }

    setUserEmail(user.email ?? null)

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('full_name, role')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('Erro ao obter perfil:', profileError)

      setErrorMessage(
        `Erro ao verificar perfil: ${profileError.message}`,
      )

      setIsAdmin(false)
      setAuthLoading(false)
      return
    }

    if (!profile) {
      setIsAdmin(false)

      setErrorMessage(
        'O utilizador autenticado não possui um perfil na tabela profiles.',
      )

      setAuthLoading(false)
      return
    }

    console.log('UTILIZADOR:', user)
    console.log('PERFIL:', profile)

    if (profile.role !== 'admin') {
      setIsAdmin(false)

      setErrorMessage(
        `A conta ${user.email} não é administradora. Role atual: ${profile.role}`,
      )

      setAuthLoading(false)
      return
    }

    setIsAdmin(true)
    setAuthLoading(false)
  }

  async function loadAdvertisements() {
    setLoading(true)

    const { data, error } = await supabase
      .from('advertisements')
      .select('*')
      .order('priority', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Erro ao carregar publicidades:', error)

      setErrorMessage(
        `Erro ao carregar publicidades: ${error.message}`,
      )

      setLoading(false)
      return
    }

    setAds((data ?? []) as Advertisement[])
    setLoading(false)
  }

  useEffect(() => {
    async function initialize() {
      await checkAdmin()
    }

    initialize()
  }, [])

  useEffect(() => {
    if (!authLoading && isAdmin) {
      loadAdvertisements()
    }
  }, [authLoading, isAdmin])

  function handleImageChange(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    setErrorMessage(null)

    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      setErrorMessage(
        'Selecione apenas uma imagem.',
      )

      event.target.value = ''
      return
    }

    const maxSize = 10 * 1024 * 1024

    if (file.size > maxSize) {
      setErrorMessage(
        'A imagem não pode ultrapassar 10 MB.',
      )

      event.target.value = ''
      return
    }

    setSelectedImage(file)

    const previewUrl = URL.createObjectURL(file)

    setImagePreview((current) => {
      if (current) {
        URL.revokeObjectURL(current)
      }

      return previewUrl
    })
  }

  function removeSelectedImage() {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview)
    }

    setSelectedImage(null)
    setImagePreview(null)

    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  async function uploadAdvertisementImage(
    file: File,
    userId: string,
  ) {
    const fileExtension =
      file.name.split('.').pop()?.toLowerCase() || 'jpg'

    const fileName = `${crypto.randomUUID()}.${fileExtension}`

    const filePath = `${userId}/${fileName}`

    const { error: uploadError } = await supabase.storage
      .from('advertisements')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      throw uploadError
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('advertisements')
      .getPublicUrl(filePath)

    return {
      publicUrl,
      filePath,
    }
  }

  async function createAdvertisement() {
    setErrorMessage(null)

    if (!isAdmin) {
      setErrorMessage(
        'Apenas o administrador da Wizenda pode criar publicidades.',
      )
      return
    }

    if (!title.trim()) {
      alert('Digite o título da publicidade.')
      return
    }

    setSaving(true)

    let uploadedFilePath: string | null = null

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError) {
      setSaving(false)

      console.error(
        'Erro ao obter utilizador antes de criar:',
        userError,
      )

      setErrorMessage(
        `Erro de autenticação: ${userError.message}`,
      )

      return
    }

    if (!user) {
      setSaving(false)

      setErrorMessage(
        'A sessão expirou. Faça login novamente.',
      )

      return
    }

    console.log(
      'A criar publicidade com utilizador:',
      user.id,
      user.email,
    )

    try {
      let imageUrl: string | null = null

      if (selectedImage) {
        const uploaded = await uploadAdvertisementImage(
          selectedImage,
          user.id,
        )

        imageUrl = uploaded.publicUrl
        uploadedFilePath = uploaded.filePath
      }

      const { data, error } = await supabase
        .from('advertisements')
        .insert({
          title: title.trim(),
          description: description.trim() || null,
          advertiser_name: advertiserName.trim() || null,
          button_text: buttonText.trim() || null,
          button_url: buttonUrl.trim() || null,
          image_url: imageUrl,
          status: 'draft',
          priority: 0,
          created_by: user.id,
        })
        .select()
        .single()

      if (error) {
        console.error(
          'ERRO AO CRIAR PUBLICIDADE:',
          {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code,
          },
        )

        if (uploadedFilePath) {
          await supabase.storage
            .from('advertisements')
            .remove([uploadedFilePath])
        }

        setErrorMessage(
          `Erro ao criar publicidade: ${error.message}`,
        )

        return
      }

      console.log(
        'Publicidade criada:',
        data,
      )

      setTitle('')
      setDescription('')
      setAdvertiserName('')
      setButtonText('')
      setButtonUrl('')

      removeSelectedImage()

      setShowForm(false)

      await loadAdvertisements()
    } catch (error) {
      console.error(
        'ERRO AO FAZER UPLOAD/CRIAR PUBLICIDADE:',
        error,
      )

      if (uploadedFilePath) {
        await supabase.storage
          .from('advertisements')
          .remove([uploadedFilePath])
      }

      const message =
        error instanceof Error
          ? error.message
          : 'Ocorreu um erro desconhecido.'

      setErrorMessage(
        `Erro ao criar publicidade: ${message}`,
      )
    } finally {
      setSaving(false)
    }
  }

  async function changeStatus(
    id: string,
    status: Advertisement['status'],
  ) {
    setErrorMessage(null)

    const { error } = await supabase
      .from('advertisements')
      .update({ status })
      .eq('id', id)

    if (error) {
      console.error(
        'Erro ao alterar estado:',
        error,
      )

      setErrorMessage(
        `Erro ao alterar estado: ${error.message}`,
      )

      return
    }

    await loadAdvertisements()
  }

  async function deleteAdvertisement(id: string) {
    setErrorMessage(null)

    const confirmed = window.confirm(
      'Tem certeza que deseja eliminar esta publicidade?',
    )

    if (!confirmed) {
      return
    }

    const ad = ads.find(
      (item) => item.id === id,
    )

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error(
        'Erro ao eliminar:',
        error,
      )

      setErrorMessage(
        `Erro ao eliminar publicidade: ${error.message}`,
      )

      return
    }

    if (ad?.image_url) {
      try {
        const url = new URL(ad.image_url)
        const marker = '/storage/v1/object/public/advertisements/'

        const index = url.pathname.indexOf(marker)

        if (index !== -1) {
          const filePath = decodeURIComponent(
            url.pathname.substring(
              index + marker.length,
            ),
          )

          await supabase.storage
            .from('advertisements')
            .remove([filePath])
        }
      } catch (error) {
        console.error(
          'Erro ao eliminar imagem da publicidade:',
          error,
        )
      }
    }

    await loadAdvertisements()
  }

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#FAFAFA] px-5 py-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[4px] border border-gray-100 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
            A verificar acesso administrativo...
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-[#FAFAFA] px-5 py-8 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-6xl">

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <Link
              href="/admin"
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-orange-500"
            >
              <ArrowLeft size={16} />
              Voltar ao painel
            </Link>

            <div className="flex items-center gap-3">

              <div className="flex h-11 w-11 items-center justify-center rounded-[4px] bg-orange-50 text-orange-500">
                <Megaphone size={22} />
              </div>

              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl">
                  Publicidade
                </h1>

                <p className="mt-1 text-sm text-gray-500">
                  Gere as publicidades exibidas na Wizenda.
                </p>
              </div>

            </div>
          </div>

          {isAdmin && (
            <div className="flex items-center gap-3">

              <div className="hidden items-center gap-2 rounded-[4px] border border-green-100 bg-green-50 px-3 py-2 sm:flex">
                <ShieldCheck
                  size={16}
                  className="text-green-600"
                />

                <span className="text-xs font-bold text-green-700">
                  Administrador
                </span>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowForm((value) => !value)
                }
                className="inline-flex h-11 items-center justify-center gap-2 rounded-[4px] bg-orange-500 px-5 text-sm font-bold text-white transition hover:bg-orange-600"
              >
                <Plus size={18} />
                Nova publicidade
              </button>

            </div>
          )}

        </div>

        {userEmail && (
          <div className="mb-5 rounded-[4px] border border-gray-100 bg-white px-4 py-3 text-xs text-gray-500">
            Sessão:{' '}
            <strong className="text-gray-800">
              {userEmail}
            </strong>
          </div>
        )}

        {errorMessage && (
          <div className="mb-5 rounded-[4px] border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {errorMessage}
          </div>
        )}

        {isAdmin && showForm && (
          <section className="mb-8 rounded-[4px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">

            <h2 className="text-lg font-bold text-gray-950">
              Criar publicidade
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Imagem
                </label>

                {!imagePreview ? (
                  <button
                    type="button"
                    onClick={() =>
                      fileInputRef.current?.click()
                    }
                    className="mt-2 flex min-h-40 w-full flex-col items-center justify-center rounded-[4px] border border-dashed border-gray-300 bg-gray-50 px-5 py-8 text-center transition hover:border-orange-400 hover:bg-orange-50"
                  >
                    <ImagePlus
                      size={32}
                      className="text-gray-400"
                    />

                    <span className="mt-3 text-sm font-bold text-gray-700">
                      Escolher imagem
                    </span>

                    <span className="mt-1 text-xs text-gray-400">
                      JPG, PNG ou WEBP · máximo 10 MB
                    </span>
                  </button>
                ) : (
                  <div className="relative mt-2 overflow-hidden rounded-[4px] border border-gray-200 bg-gray-50">
                    <img
                      src={imagePreview}
                      alt="Pré-visualização da publicidade"
                      className="h-56 w-full object-cover sm:h-64"
                    />

                    <button
                      type="button"
                      onClick={removeSelectedImage}
                      className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-gray-950/80 text-white transition hover:bg-gray-950"
                      aria-label="Remover imagem"
                    >
                      <X size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        fileInputRef.current?.click()
                      }
                      className="absolute bottom-3 left-3 rounded-[4px] bg-white px-3 py-2 text-xs font-bold text-gray-800 shadow-sm"
                    >
                      Trocar imagem
                    </button>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Título
                </label>

                <input
                  value={title}
                  onChange={(event) =>
                    setTitle(event.target.value)
                  }
                  placeholder="Ex.: Descobre o Mussulo"
                  className="mt-2 h-11 w-full rounded-[4px] border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Descrição
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Descrição da publicidade"
                  rows={4}
                  className="mt-2 w-full resize-none rounded-[4px] border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Anunciante
                </label>

                <input
                  value={advertiserName}
                  onChange={(event) =>
                    setAdvertiserName(event.target.value)
                  }
                  placeholder="Nome da marca"
                  className="mt-2 h-11 w-full rounded-[4px] border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Texto do botão
                </label>

                <input
                  value={buttonText}
                  onChange={(event) =>
                    setButtonText(event.target.value)
                  }
                  placeholder="Ex.: Saber mais"
                  className="mt-2 h-11 w-full rounded-[4px] border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm font-semibold text-gray-700">
                  Link do botão
                </label>

                <input
                  value={buttonUrl}
                  onChange={(event) =>
                    setButtonUrl(event.target.value)
                  }
                  placeholder="https://..."
                  className="mt-2 h-11 w-full rounded-[4px] border border-gray-200 px-4 text-sm outline-none transition focus:border-orange-500"
                />
              </div>

            </div>

            <div className="mt-5 flex gap-3">

              <button
                type="button"
                onClick={createAdvertisement}
                disabled={saving}
                className="h-11 rounded-[4px] bg-gray-950 px-5 text-sm font-bold text-white transition hover:bg-gray-800 disabled:opacity-50"
              >
                {saving
                  ? 'A guardar...'
                  : 'Criar publicidade'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setShowForm(false)
                }
                className="h-11 rounded-[4px] border border-gray-200 bg-white px-5 text-sm font-bold text-gray-700"
              >
                Cancelar
              </button>

            </div>

          </section>
        )}

        {isAdmin && (
          <section>

            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-950">
                Publicidades
              </h2>

              <span className="text-sm text-gray-500">
                {ads.length}{' '}
                {ads.length === 1
                  ? 'publicidade'
                  : 'publicidades'}
              </span>
            </div>

            {loading ? (
              <div className="rounded-[4px] border border-gray-100 bg-white p-8 text-center text-sm text-gray-500">
                A carregar publicidades...
              </div>
            ) : ads.length === 0 ? (
              <div className="rounded-[4px] border border-dashed border-gray-200 bg-white p-10 text-center">

                <Megaphone
                  size={32}
                  className="mx-auto text-gray-300"
                />

                <h3 className="mt-4 font-bold text-gray-900">
                  Ainda não existem publicidades
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  Cria a primeira publicidade da Wizenda.
                </p>

              </div>
            ) : (
              <div className="space-y-3">

                {ads.map((ad) => (
                  <article
                    key={ad.id}
                    className="rounded-[4px] border border-gray-100 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                      <div className="min-w-0">

                        <div className="flex flex-wrap items-center gap-2">

                          <h3 className="font-bold text-gray-950">
                            {ad.title}
                          </h3>

                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                              ad.status === 'active'
                                ? 'bg-green-50 text-green-700'
                                : ad.status === 'paused'
                                  ? 'bg-yellow-50 text-yellow-700'
                                  : 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {ad.status === 'active'
                              ? 'Ativa'
                              : ad.status === 'paused'
                                ? 'Pausada'
                                : ad.status === 'expired'
                                  ? 'Expirada'
                                  : 'Rascunho'}
                          </span>

                        </div>

                        {ad.image_url && (
                          <div className="mt-3 overflow-hidden rounded-[4px] border border-gray-100">
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="h-40 w-full object-cover sm:w-64"
                            />
                          </div>
                        )}

                        {ad.description && (
                          <p className="mt-3 line-clamp-2 text-sm text-gray-500">
                            {ad.description}
                          </p>
                        )}

                        {ad.advertiser_name && (
                          <p className="mt-2 text-xs font-medium text-gray-400">
                            {ad.advertiser_name}
                          </p>
                        )}

                      </div>

                      <div className="flex shrink-0 items-center gap-2">

                        {ad.status === 'active' ? (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                ad.id,
                                'paused',
                              )
                            }
                            className="flex h-9 items-center gap-2 rounded-[4px] border border-gray-200 px-3 text-xs font-bold text-gray-700 transition hover:bg-gray-50"
                          >
                            <Pause size={15} />
                            Pausar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() =>
                              changeStatus(
                                ad.id,
                                'active',
                              )
                            }
                            className="flex h-9 items-center gap-2 rounded-[4px] bg-orange-500 px-3 text-xs font-bold text-white transition hover:bg-orange-600"
                          >
                            <Play size={15} />
                            Publicar
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() =>
                            deleteAdvertisement(ad.id)
                          }
                          className="flex h-9 w-9 items-center justify-center rounded-[4px] border border-red-100 text-red-500 transition hover:bg-red-50"
                          aria-label="Eliminar publicidade"
                        >
                          <Trash2 size={16} />
                        </button>

                      </div>

                    </div>
                  </article>
                ))}

              </div>
            )}

          </section>
        )}

      </div>
    </main>
  )
}
