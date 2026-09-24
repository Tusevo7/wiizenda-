'use client'

import { useEffect, useState } from 'react'
import {
  Edit3,
  ImagePlus,
  Megaphone,
  Pause,
  Play,
  Plus,
  Save,
  Trash2,
  X,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

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
}

type Props = {
  adminId?: string
}

const emptyForm = {
  title: '',
  description: '',
  advertiser_name: '',
  button_text: '',
  button_url: '',
  starts_at: '',
  ends_at: '',
  priority: 0,
  status: 'draft' as Advertisement['status'],
  image_url: '',
}

export default function AdminAdvertisementsSection({
  adminId,
}: Props) {
  const supabase = createClient()

  const [advertisements, setAdvertisements] = useState<
    Advertisement[]
  >([])

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(
    null,
  )

  const [form, setForm] = useState(emptyForm)

  async function loadAdvertisements() {
    setLoading(true)

    const { data, error } = await supabase
      .from('advertisements')
      .select(`
        id,
        title,
        description,
        image_url,
        button_text,
        button_url,
        advertiser_name,
        status,
        starts_at,
        ends_at,
        priority,
        created_at
      `)
      .order('priority', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Erro ao carregar publicidades:',
        error,
      )
    }

    setAdvertisements(
      (data ?? []) as Advertisement[],
    )

    setLoading(false)
  }

  useEffect(() => {
    loadAdvertisements()
  }, [])

  function openNewForm() {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
  }

  function openEditForm(ad: Advertisement) {
    setEditingId(ad.id)

    setForm({
      title: ad.title,
      description: ad.description ?? '',
      advertiser_name: ad.advertiser_name ?? '',
      button_text: ad.button_text ?? '',
      button_url: ad.button_url ?? '',
      starts_at: ad.starts_at
        ? ad.starts_at.slice(0, 16)
        : '',
      ends_at: ad.ends_at
        ? ad.ends_at.slice(0, 16)
        : '',
      priority: ad.priority,
      status: ad.status,
      image_url: ad.image_url ?? '',
    })

    setShowForm(true)
  }

  function closeForm() {
    if (saving || uploading) {
      return
    }

    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function handleImageUpload(
    event: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!file.type.startsWith('image/')) {
      alert('Seleciona uma imagem válida.')
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      alert('A imagem não pode ultrapassar 10 MB.')
      return
    }

    setUploading(true)

    try {
      const extension =
        file.name.split('.').pop()?.toLowerCase() ||
        'jpg'

      const fileName = `${crypto.randomUUID()}.${extension}`

      const filePath = `advertisements/${fileName}`

      const { error } = await supabase.storage
        .from('advertisements')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (error) {
        console.error(
          'Erro no upload:',
          error,
        )

        alert(
          `Não foi possível enviar a imagem: ${error.message}`,
        )

        return
      }

      const {
        data: publicUrlData,
      } = supabase.storage
        .from('advertisements')
        .getPublicUrl(filePath)

      setForm((current) => ({
        ...current,
        image_url: publicUrlData.publicUrl,
      }))
    } finally {
      setUploading(false)

      event.target.value = ''
    }
  }

  async function handleSave() {
    if (!form.title.trim()) {
      alert('O título é obrigatório.')
      return
    }

    setSaving(true)

    try {
      const payload = {
        title: form.title.trim(),
        description:
          form.description.trim() || null,
        image_url:
          form.image_url.trim() || null,
        button_text:
          form.button_text.trim() || null,
        button_url:
          form.button_url.trim() || null,
        advertiser_name:
          form.advertiser_name.trim() || null,
        status: form.status,
        starts_at:
          form.starts_at
            ? new Date(
                form.starts_at,
              ).toISOString()
            : null,
        ends_at:
          form.ends_at
            ? new Date(
                form.ends_at,
              ).toISOString()
            : null,
        priority: Number(form.priority) || 0,
      }

      if (editingId) {
        const { error } = await supabase
          .from('advertisements')
          .update({
            ...payload,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingId)

        if (error) {
          throw error
        }
      } else {
        const { data: authData } =
          await supabase.auth.getUser()

        const createdBy =
          adminId ??
          authData.user?.id ??
          null

        const { error } = await supabase
          .from('advertisements')
          .insert({
            ...payload,
            created_by: createdBy,
          })

        if (error) {
          throw error
        }
      }

      await loadAdvertisements()

      closeForm()
    } catch (error) {
      console.error(
        'Erro ao guardar publicidade:',
        error,
      )

      alert(
        error instanceof Error
          ? error.message
          : 'Não foi possível guardar a publicidade.',
      )
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(
    advertisement: Advertisement,
  ) {
    const nextStatus =
      advertisement.status === 'active'
        ? 'paused'
        : 'active'

    const { error } = await supabase
      .from('advertisements')
      .update({
        status: nextStatus,
        updated_at: new Date().toISOString(),
      })
      .eq('id', advertisement.id)

    if (error) {
      console.error(
        'Erro ao alterar estado:',
        error,
      )

      alert(error.message)
      return
    }

    await loadAdvertisements()
  }

  async function handleDelete(
    advertisement: Advertisement,
  ) {
    const confirmed = window.confirm(
      `Eliminar a publicidade "${advertisement.title}"?`,
    )

    if (!confirmed) {
      return
    }

    const { error } = await supabase
      .from('advertisements')
      .delete()
      .eq('id', advertisement.id)

    if (error) {
      console.error(
        'Erro ao eliminar publicidade:',
        error,
      )

      alert(error.message)
      return
    }

    await loadAdvertisements()
  }

  function formatDate(
    value: string | null,
  ) {
    if (!value) {
      return 'Sem data'
    }

    return new Date(value).toLocaleDateString(
      'pt-PT',
      {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      },
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone
              size={21}
              className="text-orange-500"
            />

            <h2 className="text-xl font-black text-gray-950">
              Publicidade
            </h2>
          </div>

          <p className="mt-1 text-sm text-gray-500">
            Gerencie as publicidades exibidas na
            plataforma.
          </p>
        </div>

        <button
          type="button"
          onClick={openNewForm}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-orange-600"
        >
          <Plus size={17} />
          Nova publicidade
        </button>
      </div>

      {showForm && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="font-black text-gray-950">
                {editingId
                  ? 'Editar publicidade'
                  : 'Nova publicidade'}
              </h3>

              <p className="mt-1 text-xs text-gray-500">
                Preencha os dados da publicidade.
              </p>
            </div>

            <button
              type="button"
              onClick={closeForm}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100"
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Título *
              </label>

              <input
                value={form.title}
                onChange={(event) =>
                  setForm({
                    ...form,
                    title: event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                placeholder="Título da publicidade"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Descrição
              </label>

              <textarea
                value={form.description}
                onChange={(event) =>
                  setForm({
                    ...form,
                    description:
                      event.target.value,
                  })
                }
                rows={3}
                className="w-full resize-none rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                placeholder="Descrição da publicidade"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Anunciante
              </label>

              <input
                value={form.advertiser_name}
                onChange={(event) =>
                  setForm({
                    ...form,
                    advertiser_name:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                placeholder="Nome da empresa"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Prioridade
              </label>

              <input
                type="number"
                value={form.priority}
                onChange={(event) =>
                  setForm({
                    ...form,
                    priority:
                      Number(event.target.value) || 0,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Texto do botão
              </label>

              <input
                value={form.button_text}
                onChange={(event) =>
                  setForm({
                    ...form,
                    button_text:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                placeholder="Saiba mais"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Link do botão
              </label>

              <input
                value={form.button_url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    button_url:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
                placeholder="https://..."
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Início
              </label>

              <input
                type="datetime-local"
                value={form.starts_at}
                onChange={(event) =>
                  setForm({
                    ...form,
                    starts_at:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Fim
              </label>

              <input
                type="datetime-local"
                value={form.ends_at}
                onChange={(event) =>
                  setForm({
                    ...form,
                    ends_at:
                      event.target.value,
                  })
                }
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-orange-400"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Estado
              </label>

              <select
                value={form.status}
                onChange={(event) =>
                  setForm({
                    ...form,
                    status:
                      event.target.value as Advertisement['status'],
                  })
                }
                className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-orange-400"
              >
                <option value="draft">
                  Rascunho
                </option>

                <option value="active">
                  Ativa
                </option>

                <option value="paused">
                  Pausada
                </option>

                <option value="expired">
                  Expirada
                </option>
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                Imagem
              </label>

              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-gray-300 px-4 py-3 text-sm font-bold text-gray-600 transition hover:border-orange-400 hover:text-orange-500">
                <ImagePlus size={17} />

                {uploading
                  ? 'Enviando...'
                  : 'Escolher imagem'}

                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={uploading}
                  className="hidden"
                />
              </label>
            </div>

            {form.image_url && (
              <div className="md:col-span-2">
                <div className="overflow-hidden rounded-xl border border-gray-200">
                  <img
                    src={form.image_url}
                    alt="Pré-visualização"
                    className="h-48 w-full object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={closeForm}
              disabled={saving}
              className="rounded-xl border border-gray-200 px-4 py-3 text-sm font-bold text-gray-700"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || uploading}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-3 text-sm font-bold text-white transition hover:bg-orange-600 disabled:opacity-50"
            >
              <Save size={17} />

              {saving
                ? 'A guardar...'
                : 'Guardar publicidade'}
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
          A carregar publicidades...
        </div>
      ) : advertisements.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center">
          <Megaphone
            size={32}
            className="mx-auto text-gray-300"
          />

          <p className="mt-3 font-bold text-gray-700">
            Ainda não existem publicidades
          </p>

          <p className="mt-1 text-sm text-gray-400">
            Crie a primeira publicidade para
            aparecer na plataforma.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {advertisements.map((advertisement) => (
            <div
              key={advertisement.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex flex-col md:flex-row">
                <div className="h-40 w-full shrink-0 bg-gray-100 md:h-auto md:w-64">
                  {advertisement.image_url ? (
                    <img
                      src={advertisement.image_url}
                      alt={advertisement.title}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-gray-300">
                      <ImagePlus size={30} />
                    </div>
                  )}
                </div>

                <div className="flex flex-1 flex-col justify-between p-5">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-black text-gray-950">
                        {advertisement.title}
                      </h3>

                      <span
                        className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase ${
                          advertisement.status ===
                          'active'
                            ? 'bg-green-100 text-green-700'
                            : advertisement.status ===
                                'paused'
                              ? 'bg-yellow-100 text-yellow-700'
                              : advertisement.status ===
                                  'expired'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {advertisement.status}
                      </span>
                    </div>

                    {advertisement.advertiser_name && (
                      <p className="mt-1 text-xs font-semibold text-gray-500">
                        {advertisement.advertiser_name}
                      </p>
                    )}

                    {advertisement.description && (
                      <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                        {advertisement.description}
                      </p>
                    )}
                  </div>

                  <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs text-gray-400">
                      Prioridade:{' '}
                      <strong className="text-gray-600">
                        {advertisement.priority}
                      </strong>

                      <span className="mx-2">
                        •
                      </span>

                      {formatDate(
                        advertisement.created_at,
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          toggleStatus(
                            advertisement,
                          )
                        }
                        title={
                          advertisement.status ===
                          'active'
                            ? 'Pausar'
                            : 'Ativar'
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-orange-500"
                      >
                        {advertisement.status ===
                        'active' ? (
                          <Pause size={15} />
                        ) : (
                          <Play size={15} />
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          openEditForm(
                            advertisement,
                          )
                        }
                        title="Editar"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                      >
                        <Edit3 size={15} />
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            advertisement,
                          )
                        }
                        title="Eliminar"
                        className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}