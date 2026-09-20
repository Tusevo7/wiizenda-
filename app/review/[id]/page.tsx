
'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import {
  ArrowLeft,
  Heart,
  MessageCircle,
  Share2,
  X,
} from 'lucide-react'

import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  location: string | null
  rating: number | null
  created_at: string
  sound_name: string | null
  user_id: string
}

type Profile = {
  full_name: string | null
  avatar_url: string | null
  role: 'traveler' | 'agency' | 'admin'
}

type Agency = {
  name: string
  logo_url: string | null
}

export default function ReviewPostPage() {
  const params = useParams()
  const id = params.id as string

  const supabase = createClient()

  const [post, setPost] = useState<Post | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [agency, setAgency] = useState<Agency | null>(null)

  const [likes, setLikes] = useState(0)
  const [comments, setComments] = useState(0)

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [shareOpen, setShareOpen] = useState(false)

  useEffect(() => {
    async function loadPost() {
      setLoading(true)
      setError('')

      const { data: postData, error: postError } = await supabase
        .from('community_posts')
        .select(`
          id,
          user_id,
          media_url,
          media_type,
          caption,
          location,
          rating,
          sound_name,
          created_at
        `)
        .eq('id', id)
        .single()

      if (postError || !postData) {
        console.error(postError)
        setError('Publicação não encontrada.')
        setLoading(false)
        return
      }

      setPost(postData)

      const [
        profileResult,
        agencyResult,
        likesResult,
        commentsResult,
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('full_name, avatar_url, role')
          .eq('id', postData.user_id)
          .maybeSingle(),

        supabase
          .from('agencies')
          .select('name, logo_url')
          .eq('owner_id', postData.user_id)
          .maybeSingle(),

        supabase
          .from('community_likes')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('post_id', postData.id),

        supabase
          .from('community_comments')
          .select('id', {
            count: 'exact',
            head: true,
          })
          .eq('post_id', postData.id),
      ])

      if (profileResult.data) {
        setProfile(profileResult.data)
      }

      if (agencyResult.data) {
        setAgency(agencyResult.data)
      }

      setLikes(likesResult.count ?? 0)
      setComments(commentsResult.count ?? 0)

      setLoading(false)
    }

    loadPost()
  }, [id])

  function sharePost() {
    setShareOpen(true)
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(
        window.location.href,
      )

      setShareOpen(false)

      alert('Link copiado!')
    } catch {
      alert('Não foi possível copiar o link.')
    }
  }

  function shareWhatsApp() {
    const url = window.location.href

    const text = encodeURIComponent(
      `Veja esta publicação na Wizenda 🌍\n\n${url}`,
    )

    window.open(
      `https://wa.me/?text=${text}`,
      '_blank',
    )

    setShareOpen(false)
  }

  async function nativeShare() {
    if (!navigator.share) {
      await copyLink()
      return
    }

    try {
      await navigator.share({
        title:
          post?.caption ||
          'Experiência na Wizenda',

        text:
          'Veja esta publicação na Wizenda 🌍',

        url: window.location.href,
      })

      setShareOpen(false)
    } catch {
      // utilizador fechou o menu
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <div className="mx-auto max-w-2xl px-5 py-10">

          <div className="h-8 w-32 animate-pulse rounded bg-gray-100" />

          <div className="mt-6 aspect-[4/5] animate-pulse rounded bg-gray-100" />

        </div>
      </main>
    )
  }

  if (error || !post) {
    return (
      <main className="min-h-screen bg-white">

        <div className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center px-5 text-center">

          <p className="text-lg font-semibold text-gray-900">
            {error || 'Publicação não encontrada.'}
          </p>

          <Link
            href="/review"
            className="mt-5 rounded bg-orange-500 px-5 py-3 text-sm font-semibold text-white"
          >
            Voltar para Review
          </Link>

        </div>
      </main>
    )
  }

  const displayName =
    agency?.name ||
    profile?.full_name ||
    'Utilizador'

  const avatar =
    agency?.logo_url ||
    profile?.avatar_url

  return (
    <main className="min-h-screen bg-white">

      <div className="mx-auto max-w-2xl">

        {/* Header */}
        <div className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-gray-100 bg-white/95 px-5 backdrop-blur">

          <Link
            href="/review"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
          >
            <ArrowLeft
              size={21}
              className="text-gray-800"
            />
          </Link>

          <span className="text-lg font-bold text-gray-950">
            Publicação
          </span>

          <button
            type="button"
            onClick={sharePost}
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-gray-100"
            aria-label="Partilhar"
          >
            <Share2
              size={20}
              className="text-gray-800"
            />
          </button>

        </div>

        {/* Autor */}
        <div className="flex items-center gap-3 px-5 py-4">

          {avatar ? (
            <img
              src={avatar}
              alt={displayName}
              className="h-10 w-10 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
              {displayName
                .charAt(0)
                .toUpperCase()}
            </div>
          )}

          <div>

            <p className="font-semibold text-gray-950">
              {displayName}
            </p>

            <p className="text-xs text-gray-500">
              {profile?.role === 'agency'
                ? 'Agência'
                : 'Viajante'}
            </p>

          </div>
        </div>

        {/* Conteúdo */}
        <div className="overflow-hidden bg-black">

          {post.media_type === 'video' ? (
            <video
              src={post.media_url}
              controls
              playsInline
              className="max-h-[75vh] w-full object-contain"
            />
          ) : (
            <img
              src={post.media_url}
              alt={
                post.caption ||
                'Publicação Wizenda'
              }
              className="max-h-[75vh] w-full object-contain"
            />
          )}

        </div>

        {/* Ações */}
        <div className="flex items-center gap-5 px-5 py-4">

          <div className="flex items-center gap-2">

            <Heart
              size={22}
              className="text-gray-700"
            />

            <span className="text-sm font-medium text-gray-700">
              {likes}
            </span>

          </div>

          <div className="flex items-center gap-2">

            <MessageCircle
              size={22}
              className="text-gray-700"
            />

            <span className="text-sm font-medium text-gray-700">
              {comments}
            </span>

          </div>

          <button
            type="button"
            onClick={sharePost}
            className="ml-auto flex items-center gap-2"
          >

            <Share2
              size={22}
              className="text-gray-700"
            />

            <span className="text-sm font-medium text-gray-700">
              Partilhar
            </span>

          </button>

        </div>

        {/* Informação */}
        <div className="px-5 pb-10">

          {post.caption && (
            <p className="text-[15px] leading-6 text-gray-900">
              {post.caption}
            </p>
          )}

          {post.location && (
            <p className="mt-3 text-sm text-gray-500">
              📍 {post.location}
            </p>
          )}

          {post.rating && (
            <div className="mt-3 text-sm text-orange-500">

              {'★'.repeat(post.rating)}

              <span className="ml-2 text-gray-500">
                {post.rating}/5
              </span>

            </div>
          )}

          {post.sound_name && (
            <p className="mt-3 text-sm text-gray-500">
              🎵 {post.sound_name}
            </p>
          )}

        </div>

      </div>

      {/* Menu de partilha */}
      {shareOpen && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center"
          onClick={() => setShareOpen(false)}
        >

          <div
            className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl"
            onClick={(event) => event.stopPropagation()}
          >

            {/* Título */}
            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-lg font-bold text-gray-950">
                Partilhar publicação
              </h2>

              <button
                type="button"
                onClick={() => setShareOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-gray-100"
                aria-label="Fechar"
              >
                <X size={20} />
              </button>

            </div>

            <div className="space-y-2">

              {/* WhatsApp */}
              <button
                type="button"
                onClick={shareWhatsApp}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-lg">
                  🟢
                </span>

                <div>

                  <p className="font-semibold text-gray-900">
                    WhatsApp
                  </p>

                  <p className="text-sm text-gray-500">
                    Enviar para um contacto
                  </p>

                </div>

              </button>

              {/* Copiar link */}
              <button
                type="button"
                onClick={copyLink}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-lg">
                  🔗
                </span>

                <div>

                  <p className="font-semibold text-gray-900">
                    Copiar link
                  </p>

                  <p className="text-sm text-gray-500">
                    Copiar o endereço da publicação
                  </p>

                </div>

              </button>

              {/* Partilha nativa */}
              <button
                type="button"
                onClick={nativeShare}
                className="flex w-full items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-left hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-lg">
                  📤
                </span>

                <div>

                  <p className="font-semibold text-gray-900">
                    Mais opções
                  </p>

                  <p className="text-sm text-gray-500">
                    Partilhar através do dispositivo
                  </p>

                </div>

              </button>

            </div>

          </div>

        </div>
      )}

    </main>
  )
}
