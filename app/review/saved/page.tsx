'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bookmark,
  MapPin,
  Star,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type SavedPost = {
  id: string
  media_url: string
  media_type: 'image' | 'video'
  caption: string | null
  location: string | null
  rating: number | null
  created_at: string
}

export default function SavedReviewsPage() {
  const supabase = createClient()

  const [posts, setPosts] = useState<SavedPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    loadSavedPosts()
  }, [])

  async function loadSavedPosts() {
    try {
      setLoading(true)
      setError('')

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) {
        throw userError
      }

      if (!user) {
        setPosts([])
        return
      }

      const {
        data: saves,
        error: savesError,
      } = await supabase
        .from('community_saves')
        .select('post_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', {
          ascending: false,
        })

      if (savesError) {
        throw savesError
      }

      if (!saves || saves.length === 0) {
        setPosts([])
        return
      }

      const postIds = saves.map(
        (save) => save.post_id,
      )

      const {
        data: postsData,
        error: postsError,
      } = await supabase
        .from('community_posts')
        .select(`
          id,
          media_url,
          media_type,
          caption,
          location,
          rating,
          created_at
        `)
        .in('id', postIds)

      if (postsError) {
        throw postsError
      }

      const postsMap = new Map(
        (postsData ?? []).map((post) => [
          post.id,
          post,
        ]),
      )

      const orderedPosts = postIds
        .map((id) => postsMap.get(id))
        .filter(
          (post): post is SavedPost =>
            Boolean(post),
        )

      setPosts(orderedPosts)
    } catch (err) {
      console.error(
        'Erro ao carregar guardados:',
        err,
      )

      setError(
        'Não foi possível carregar os guardados.',
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-white">

      {/* HEADER */}
      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-7xl items-center px-5 sm:px-6">

          <Link
            href="/profile"
            aria-label="Voltar ao perfil"
            className="mr-4 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-gray-100"
          >
            <ArrowLeft
              size={21}
              className="text-gray-900"
            />
          </Link>

          <div className="flex items-center gap-2">

            <Bookmark
              size={21}
              className="text-orange-500"
              fill="currentColor"
            />

            <h1 className="text-lg font-bold text-gray-950">
              Guardados
            </h1>

          </div>

        </div>

      </header>

      {/* CONTEÚDO */}
      <section className="mx-auto max-w-7xl px-5 py-6 sm:px-6">

        {/* LOADING */}
        {loading && (
          <div className="flex min-h-[50vh] items-center justify-center">

            <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-200 border-t-orange-500" />

          </div>
        )}

        {/* ERRO */}
        {!loading && error && (
          <div className="flex min-h-[50vh] flex-col items-center justify-center text-center">

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-50">

              <Bookmark
                size={28}
                className="text-red-400"
              />

            </div>

            <p className="mt-5 text-sm text-gray-500">
              {error}
            </p>

            <button
              type="button"
              onClick={loadSavedPosts}
              className="mt-4 rounded-full bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600"
            >
              Tentar novamente
            </button>

          </div>
        )}

        {/* SEM GUARDADOS */}
        {!loading &&
          !error &&
          posts.length === 0 && (
            <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">

              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">

                <Bookmark
                  size={28}
                  className="text-gray-400"
                />

              </div>

              <h2 className="mt-5 text-xl font-bold text-gray-950">
                Ainda não tens guardados
              </h2>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                Quando encontrares uma publicação
                que gostes, toca no marcador para
                guardá-la aqui.
              </p>

              <Link
                href="/review"
                className="mt-6 rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition hover:bg-orange-600"
              >
                Explorar publicações
              </Link>

            </div>
          )}

        {/* PUBLICAÇÕES GUARDADAS */}
        {!loading &&
          !error &&
          posts.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">

              {posts.map((post) => (
                <Link
                  key={post.id}
                  href={`/review?post=${post.id}`}
                  className="group overflow-hidden rounded-[4px] bg-gray-100"
                >

                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">

                    {/* IMAGEM */}
                    {post.media_type === 'video' ? (
                      <video
                        src={post.media_url}
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                        muted
                        playsInline
                        preload="metadata"
                      />
                    ) : (
                      <img
                        src={post.media_url}
                        alt={
                          post.caption ||
                          'Publicação guardada'
                        }
                        className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                      />
                    )}

                    {/* ÍCONE DE GUARDADO */}
                    <div className="absolute right-2 top-2 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-md">

                      <Bookmark
                        size={16}
                        fill="currentColor"
                      />

                    </div>

                    {/* AVALIAÇÃO */}
                    {post.rating && (
                      <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs font-semibold text-white backdrop-blur-md">

                        <Star
                          size={12}
                          fill="currentColor"
                        />

                        {post.rating}

                      </div>
                    )}

                  </div>

                  {/* INFORMAÇÕES */}
                  <div className="space-y-2 bg-white p-3">

                    {post.caption && (
                      <p className="line-clamp-2 text-sm font-medium text-gray-900">
                        {post.caption}
                      </p>
                    )}

                    {post.location && (
                      <div className="flex items-center gap-1.5 text-xs text-gray-500">

                        <MapPin size={13} />

                        <span className="truncate">
                          {post.location}
                        </span>

                      </div>
                    )}

                  </div>

                </Link>
              ))}

            </div>
          )}

      </section>

    </main>
  )
}