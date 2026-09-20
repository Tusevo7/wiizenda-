'use client'

import Link from 'next/link'
import {
  Bookmark,
  Heart,
  MapPin,
  MessageCircle,
  MoreVertical,
  Plus,
  Send,
  Star,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

import { createClient } from '@/lib/supabase/client'

type Post = {
  id: string
  user_id: string
  post_type: 'traveler' | 'agency' | 'hotel' | 'wizenda'
  media_type: 'image' | 'video'
  media_url: string
  caption: string | null
  location: string | null
  rating: number | null
  sound_name: string | null
  sound_url: string | null
  created_at: string
  user_name: string
  user_avatar: string | null
  user_role: string
  liked: boolean
  saved: boolean
  likes_count: number
  comments_count: number
}

type Comment = {
  id: string
  user_id: string
  post_id: string
  comment: string
  created_at: string
  user_name: string
  user_avatar: string | null
}

export default function ReviewPage() {
  const supabase = createClient()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [soundOn, setSoundOn] = useState(true)
  const [activeAudio, setActiveAudio] = useState<string | null>(null)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [commentsLoading, setCommentsLoading] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [commentSubmitting, setCommentSubmitting] = useState(false)

  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [shareOpen, setShareOpen] = useState(false)
  const [sharePostId, setSharePostId] = useState<string | null>(null)

  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  )

  useEffect(() => {
    loadPosts()
  }, [])

  useEffect(() => {
    const postId = new URLSearchParams(window.location.search).get('post')

    if (!postId) return

    setTimeout(() => {
      document
        .getElementById(`review-post-${postId}`)
        ?.scrollIntoView({
          behavior: 'smooth',
        })
    }, 500)
  }, [posts])

  /*
   * FEED ALEATÓRIO PONDERADO
   *
   * Posts recentes têm maior probabilidade
   * de aparecer primeiro.
   */
  function weightedShuffle<T extends { created_at: string }>(
    items: T[],
  ): T[] {
    const remaining = [...items]
    const result: T[] = []

    while (remaining.length > 0) {
      const now = Date.now()

      const weighted = remaining.map((item) => {
        const ageHours = Math.max(
          0,
          (now - new Date(item.created_at).getTime()) /
            (1000 * 60 * 60),
        )

        const recencyWeight =
          1 +
          8 *
            Math.exp(
              -ageHours / (24 * 7),
            )

        const randomFactor = 0.5 + Math.random()

        return {
          item,
          weight:
            recencyWeight *
            randomFactor,
        }
      })

      const totalWeight = weighted.reduce(
        (sum, entry) =>
          sum + entry.weight,
        0,
      )

      let random =
        Math.random() *
        totalWeight

      let selectedIndex = 0

      for (
        let i = 0;
        i < weighted.length;
        i++
      ) {
        random -=
          weighted[i].weight

        if (random <= 0) {
          selectedIndex = i
          break
        }
      }

      result.push(
        weighted[selectedIndex]
          .item,
      )

      remaining.splice(
        selectedIndex,
        1,
      )
    }

    return result
  }

  /*
   * CARREGAR POSTS
   */
  async function loadPosts() {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { user },
      } =
        await supabase.auth.getUser()

      setCurrentUserId(
        user?.id ?? null,
      )

      const {
        data: postRows,
        error: postsError,
      } = await supabase
        .from('community_posts')
        .select(
          `
          id,
          user_id,
          post_type,
          media_type,
          media_url,
          caption,
          location,
          rating,
          sound_name,
          sound_url,
          created_at
        `,
        )
        .order(
          'created_at',
          {
            ascending: false,
          },
        )

      if (postsError)
        throw postsError

      if (
        !postRows ||
        postRows.length === 0
      ) {
        setPosts([])
        return
      }

      const userIds = [
        ...new Set(
          postRows.map(
            (post) =>
              post.user_id,
          ),
        ),
      ]

      const postIds =
        postRows.map(
          (post) =>
            post.id,
        )

      /*
       * PERFIS
       */
      const {
        data: profiles,
        error: profilesError,
      } = await supabase
        .from('profiles')
        .select(
          'id, full_name, role, avatar_url',
        )
        .in(
          'id',
          userIds,
        )

      /*
       * AGÊNCIAS
       */
      const {
        data: agencies,
        error: agenciesError,
      } = await supabase
        .from('agencies')
        .select(
          'id, owner_id, name, logo_url',
        )
        .in(
          'owner_id',
          userIds,
        )

      /*
       * LIKES
       */
      const {
        data: likes,
        error: likesError,
      } = await supabase
        .from('community_likes')
        .select(
          'user_id, post_id',
        )
        .in(
          'post_id',
          postIds,
        )

      /*
       * SAVES
       */
      let saves:
        | {
            user_id: string
            post_id: string
          }[] = []

      let savesError:
        | unknown
        | null = null

      if (user) {
        const result =
          await supabase
            .from(
              'community_saves',
            )
            .select(
              'user_id, post_id',
            )
            .eq(
              'user_id',
              user.id,
            )
            .in(
              'post_id',
              postIds,
            )

        saves =
          result.data ?? []

        savesError =
          result.error
      }

      /*
       * COMENTÁRIOS
       */
      const {
        data: commentsRows,
        error: commentsError,
      } = await supabase
        .from(
          'community_comments',
        )
        .select(
          'post_id',
        )
        .in(
          'post_id',
          postIds,
        )

      /*
       * ERROS
       */
      if (profilesError) {
        console.error(
          'Erro ao carregar perfis:',
          profilesError,
        )

        throw profilesError
      }

      if (agenciesError) {
        console.error(
          'Erro ao carregar agências:',
          agenciesError,
        )

        throw agenciesError
      }

      if (likesError) {
        console.error(
          'Erro ao carregar likes:',
          likesError,
        )

        throw likesError
      }

      if (savesError) {
        console.error(
          'Erro ao carregar saves:',
          savesError,
        )

        throw savesError
      }

      if (commentsError) {
        console.error(
          'Erro ao carregar comentários:',
          commentsError,
        )

        throw commentsError
      }

      /*
       * MAPA DOS PERFIS
       */
      const profileMap =
        new Map(
          (profiles ?? []).map(
            (profile) => [
              profile.id,
              {
                full_name:
                  profile.full_name,
                role:
                  profile.role,
                avatar_url:
                  profile.avatar_url,
              },
            ],
          ),
        )

      /*
       * MAPA DAS AGÊNCIAS
       *
       * owner_id = utilizador
       * que criou a agência.
       */
      const agencyMap =
        new Map(
          (agencies ?? []).map(
            (agency) => [
              agency.owner_id,
              {
                name:
                  agency.name,
                logo_url:
                  agency.logo_url,
              },
            ],
          ),
        )

      /*
       * CONTAGEM DE LIKES
       */
      const likeCountMap =
        new Map<
          string,
          number
        >()

      for (
        const like of
          likes ?? []
      ) {
        likeCountMap.set(
          like.post_id,
          (
            likeCountMap.get(
              like.post_id,
            ) ?? 0
          ) + 1,
        )
      }

      /*
       * POSTS CURTIDOS PELO UTILIZADOR
       */
      const likedPostIds =
        new Set(
          (likes ?? [])
            .filter(
              (like) =>
                like.user_id ===
                user?.id,
            )
            .map(
              (like) =>
                like.post_id,
            ),
        )

      /*
       * POSTS GUARDADOS
       */
      const savedPostIds =
        new Set(
          (saves ?? []).map(
            (save) =>
              save.post_id,
          ),
        )

      /*
       * CONTAGEM DE COMENTÁRIOS
       */
      const commentCountMap =
        new Map<
          string,
          number
        >()

      for (
        const comment of
          commentsRows ?? []
      ) {
        commentCountMap.set(
          comment.post_id,
          (
            commentCountMap.get(
              comment.post_id,
            ) ?? 0
          ) + 1,
        )
      }

      /*
       * FORMATAR POSTS
       */
      const formattedPosts: Post[] =
        postRows.map(
          (post) => {
            const profile =
              profileMap.get(
                post.user_id,
              )

            const agency =
              agencyMap.get(
                post.user_id,
              )

            /*
             * A existência da agência
             * determina o tipo da publicação.
             */
            const isAgency =
              agencyMap.has(
                post.user_id,
              )

            const isWizenda =
              profile?.role ===
                'admin' ||
              profile?.role ===
                'wizenda'

            let displayName =
              'Sem nome'

            let displayAvatar:
              | string
              | null = null

            /*
             * AGÊNCIA
             *
             * NOME = nome da agência
             * FOTO = logo da agência
             *
             * Exemplo:
             * Alana Tours
             */
            if (isAgency) {
              displayName =
                agency?.name ??
                profile?.full_name ??
                'Sem nome'

              displayAvatar =
                agency?.logo_url ??
                profile?.avatar_url ??
                null
            }

            /*
             * WIZENDA
             */
            else if (
              isWizenda
            ) {
              displayName =
                'Wizenda'

              displayAvatar =
                profile?.avatar_url ??
                null
            }

            /*
             * VIAJANTE
             *
             * NOME = nome do perfil
             * FOTO = avatar do perfil
             *
             * Exemplo:
             * TUSEVO JUNIOR
             */
            else {
              displayName =
                profile?.full_name ??
                'Sem nome'

              displayAvatar =
                profile?.avatar_url ??
                null
            }

            return {
              ...post,

              user_name:
                displayName,

              user_avatar:
                displayAvatar,

              user_role:
                isAgency
                  ? 'agency'
                  : isWizenda
                    ? 'wizenda'
                    : profile?.role ??
                      post.post_type,

              liked:
                likedPostIds.has(
                  post.id,
                ),

              saved:
                savedPostIds.has(
                  post.id,
                ),

              likes_count:
                likeCountMap.get(
                  post.id,
                ) ?? 0,

              comments_count:
                commentCountMap.get(
                  post.id,
                ) ?? 0,
            }
          },
        )

      /*
       * FEED ALEATÓRIO
       */
      const randomizedPosts =
        weightedShuffle(
          formattedPosts,
        )

      setPosts(
        randomizedPosts,
      )
    } catch (err) {
      console.error(
        'Erro ao carregar Review:',
        err,
      )

      setError(
        'Não foi possível carregar as publicações.',
      )
    } finally {
      setLoading(false)
    }
  }

  /*
   * LIKE
   */
  async function toggleLike(
    post: Post,
  ) {
    if (!currentUserId) {
      window.location.href =
        '/login'

      return
    }

    if (post.liked) {
      const { error } =
        await supabase
          .from(
            'community_likes',
          )
          .delete()
          .eq(
            'user_id',
            currentUserId,
          )
          .eq(
            'post_id',
            post.id,
          )

      if (error) {
        console.error(error)
        return
      }

      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    liked:
                      false,
                    likes_count:
                      Math.max(
                        0,
                        item.likes_count -
                          1,
                      ),
                  }
                : item,
          ),
      )

      return
    }

    const { error } =
      await supabase
        .from(
          'community_likes',
        )
        .insert({
          user_id:
            currentUserId,
          post_id:
            post.id,
        })

    if (error) {
      console.error(error)
      return
    }

    setPosts(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            post.id
              ? {
                  ...item,
                  liked:
                    true,
                  likes_count:
                    item.likes_count +
                    1,
                }
              : item,
        ),
    )
  }

  /*
   * GUARDAR
   */
  async function toggleSave(
    post: Post,
  ) {
    if (!currentUserId) {
      window.location.href =
        '/login'

      return
    }

    if (post.saved) {
      const { error } =
        await supabase
          .from(
            'community_saves',
          )
          .delete()
          .eq(
            'user_id',
            currentUserId,
          )
          .eq(
            'post_id',
            post.id,
          )

      if (error) {
        console.error(error)
        return
      }

      setPosts(
        (current) =>
          current.map(
            (item) =>
              item.id ===
              post.id
                ? {
                    ...item,
                    saved:
                      false,
                  }
                : item,
          ),
      )

      return
    }

    const { error } =
      await supabase
        .from(
          'community_saves',
        )
        .insert({
          user_id:
            currentUserId,
          post_id:
            post.id,
        })

    if (error) {
      console.error(error)
      return
    }

    setPosts(
      (current) =>
        current.map(
          (item) =>
            item.id ===
            post.id
              ? {
                  ...item,
                  saved:
                    true,
                }
              : item,
        ),
    )
  }

  /*
   * ABRIR COMENTÁRIOS
   */
  async function openComments(
    postId: string,
  ) {
    setSelectedPostId(
      postId,
    )

    setCommentsOpen(true)
    setCommentsLoading(true)

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          'community_comments',
        )
        .select(
          `
          id,
          user_id,
          post_id,
          comment,
          created_at
        `,
        )
        .eq(
          'post_id',
          postId,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

      if (error)
        throw error

      const userIds = [
        ...new Set(
          (data ?? []).map(
            (item) =>
              item.user_id,
          ),
        ),
      ]

      let profiles: {
        id: string
        full_name:
          | string
          | null
        avatar_url:
          | string
          | null
      }[] = []

      let agencies: {
        owner_id: string
        name: string
        logo_url:
          | string
          | null
      }[] = []

      if (
        userIds.length >
        0
      ) {
        /*
         * PERFIS DOS COMENTADORES
         */
        const {
          data: profileRows,
          error: profileError,
        } = await supabase
          .from(
            'profiles',
          )
          .select(
            'id, full_name, avatar_url',
          )
          .in(
            'id',
            userIds,
          )

        if (profileError)
          throw profileError

        profiles =
          profileRows ?? []

        /*
         * AGÊNCIAS DOS COMENTADORES
         */
        const {
          data: agencyRows,
          error: agencyError,
        } = await supabase
          .from(
            'agencies',
          )
          .select(
            'owner_id, name, logo_url',
          )
          .in(
            'owner_id',
            userIds,
          )

        if (agencyError)
          throw agencyError

        agencies =
          agencyRows ?? []
      }

      const profileMap =
        new Map(
          profiles.map(
            (profile) => [
              profile.id,
              {
                full_name:
                  profile.full_name,
                avatar_url:
                  profile.avatar_url,
              },
            ],
          ),
        )

      const agencyMap =
        new Map(
          agencies.map(
            (agency) => [
              agency.owner_id,
              {
                name:
                  agency.name,
                logo_url:
                  agency.logo_url,
              },
            ],
          ),
        )

      setComments(
        (data ?? []).map(
          (comment) => {
            const profile =
              profileMap.get(
                comment.user_id,
              )

            const agency =
              agencyMap.get(
                comment.user_id,
              )

            /*
             * AGÊNCIA:
             * nome = agência
             * foto = logo
             *
             * VIAJANTE:
             * nome = perfil
             * foto = avatar
             */
            return {
              ...comment,

              user_name:
                agency?.name ??
                profile?.full_name ??
                'Sem nome',

              user_avatar:
                agency?.logo_url ??
                profile?.avatar_url ??
                null,
            }
          },
        ),
      )
    } catch (err) {
      console.error(
        'Erro ao carregar comentários:',
        err,
      )

      setComments([])
    } finally {
      setCommentsLoading(
        false,
      )
    }
  }

  /*
   * FECHAR COMENTÁRIOS
   */
  function closeComments() {
    setCommentsOpen(false)
    setSelectedPostId(null)
    setComments([])
    setNewComment('')
  }

  /*
   * ENVIAR COMENTÁRIO
   */
  async function submitComment() {
    if (
      !currentUserId ||
      !selectedPostId
    ) {
      window.location.href =
        '/login'

      return
    }

    const text =
      newComment.trim()

    if (!text) return

    setCommentSubmitting(
      true,
    )

    try {
      const {
        data,
        error,
      } = await supabase
        .from(
          'community_comments',
        )
        .insert({
          user_id:
            currentUserId,
          post_id:
            selectedPostId,
          comment: text,
        })
        .select(
          'id, user_id, post_id, comment, created_at',
        )
        .single()

      if (error)
        throw error

      /*
       * PERFIL DO UTILIZADOR
       */
      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from(
          'profiles',
        )
        .select(
          'full_name, avatar_url',
        )
        .eq(
          'id',
          currentUserId,
        )
        .maybeSingle()

      if (profileError)
        throw profileError

      /*
       * AGÊNCIA DO UTILIZADOR,
       * caso seja agência.
       */
      const {
        data: agency,
        error: agencyError,
      } = await supabase
        .from(
          'agencies',
        )
        .select(
          'name, logo_url',
        )
        .eq(
          'owner_id',
          currentUserId,
        )
        .maybeSingle()

      if (agencyError)
        throw agencyError

      setComments(
        (current) => [
          ...current,
          {
            ...data,

            user_name:
              agency?.name ??
              profile?.full_name ??
              'Você',

            user_avatar:
              agency?.logo_url ??
              profile?.avatar_url ??
              null,
          },
        ],
      )

      setPosts(
        (current) =>
          current.map(
            (post) =>
              post.id ===
              selectedPostId
                ? {
                    ...post,
                    comments_count:
                      post.comments_count +
                      1,
                  }
                : post,
          ),
      )

      setNewComment('')
    } catch (err) {
      console.error(
        'Erro ao enviar comentário:',
        err,
      )
    } finally {
      setCommentSubmitting(
        false,
      )
    }
  }

  /*
   * PARTILHA
   */
  function openShare(
    postId: string,
  ) {
    setSharePostId(
      postId,
    )

    setShareOpen(true)
  }

  function closeShare() {
    setShareOpen(false)
    setSharePostId(null)
  }

  function getShareUrl(
    postId: string,
  ) {
    return `${window.location.origin}/review?post=${postId}`
  }

  async function shareNative() {
    if (!sharePostId)
      return

    const post =
      posts.find(
        (item) =>
          item.id ===
          sharePostId,
      )

    if (!post) return

    const url =
      getShareUrl(post.id)

    try {
      if (
        navigator.share
      ) {
        await navigator.share(
          {
            title:
              post.caption ||
              'Experiência no Wizenda',

            text:
              post.caption ||
              'Veja esta experiência no Wizenda.',

            url,
          },
        )

        closeShare()

        return
      }

      await navigator.clipboard.writeText(
        url,
      )

      alert(
        'Link copiado.',
      )

      closeShare()
    } catch (err) {
      console.error(err)
    }
  }

  function shareWhatsApp() {
    if (!sharePostId)
      return

    const post =
      posts.find(
        (item) =>
          item.id ===
          sharePostId,
      )

    if (!post) return

    const url =
      getShareUrl(post.id)

    const text = `${
      post.caption ||
      'Veja esta experiência no Wizenda.'
    }\n\n${url}`

    window.open(
      `https://wa.me/?text=${encodeURIComponent(
        text,
      )}`,
      '_blank',
      'noopener,noreferrer',
    )

    closeShare()
  }

  async function copyShareLink() {
    if (!sharePostId)
      return

    try {
      await navigator.clipboard.writeText(
        getShareUrl(
          sharePostId,
        ),
      )

      alert(
        'Link copiado com sucesso.',
      )

      closeShare()
    } catch (err) {
      console.error(err)

      const textarea =
        document.createElement(
          'textarea',
        )

      textarea.value =
        getShareUrl(
          sharePostId,
        )

      document.body.appendChild(
        textarea,
      )

      textarea.select()

      document.execCommand(
        'copy',
      )

      textarea.remove()

      alert(
        'Link copiado.',
      )

      closeShare()
    }
  }

  function openMedia() {
    if (!sharePostId)
      return

    const post =
      posts.find(
        (item) =>
          item.id ===
          sharePostId,
      )

    if (!post) return

    window.open(
      post.media_url,
      '_blank',
      'noopener,noreferrer',
    )

    closeShare()
  }

  /*
   * APAGAR PUBLICAÇÃO
   */
  async function deletePost(
    postId: string,
  ) {
    if (!currentUserId)
      return

    const post =
      posts.find(
        (item) =>
          item.id ===
          postId,
      )

    if (
      !post ||
      post.user_id !==
        currentUserId
    ) {
      return
    }

    const confirmed =
      window.confirm(
        'Tem certeza que deseja apagar esta publicação?',
      )

    if (!confirmed)
      return

    const { error } =
      await supabase
        .from(
          'community_posts',
        )
        .delete()
        .eq(
          'id',
          postId,
        )
        .eq(
          'user_id',
          currentUserId,
        )

    if (error) {
      console.error(error)

      alert(
        'Não foi possível apagar a publicação.',
      )

      return
    }

    setPosts(
      (current) =>
        current.filter(
          (item) =>
            item.id !==
            postId,
        ),
    )
  }

  /*
   * TIPO DA PUBLICAÇÃO
   */
  function getPostTypeLabel(
    post: Post,
  ) {
    if (
      post.user_role ===
      'agency'
    ) {
      return 'Agência'
    }

    if (
      post.user_role ===
      'hotel'
    ) {
      return 'Hotel'
    }

    if (
      post.user_role ===
        'admin' ||
      post.user_role ===
        'wizenda'
    ) {
      return 'Wizenda'
    }

    return 'Viajante'
  }

  /*
   * ÁUDIO
   */
  function toggleAudio(
    post: Post,
  ) {
    if (!post.sound_url) {
      setSoundOn(
        (value) => !value,
      )

      return
    }

    if (
      activeAudio ===
      post.id
    ) {
      setActiveAudio(null)
      setSoundOn(false)

      return
    }

    setActiveAudio(
      post.id,
    )

    setSoundOn(true)
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="min-h-screen bg-black text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-sm text-white/70">
            A carregar experiências...
          </div>
        </div>
      </main>
    )
  }

  /*
   * ERRO
   */
  if (error) {
    return (
      <main className="min-h-screen bg-[#f7f7f7]">
        <div className="mx-auto flex min-h-screen max-w-md items-center justify-center px-6">
          <div className="w-full rounded-[4px] bg-white p-6 text-center shadow-sm">

            <p className="text-sm text-gray-600">
              {error}
            </p>

            <button
              type="button"
              onClick={
                loadPosts
              }
              className="mt-5 rounded-[4px] bg-[#FF5A1F] px-5 py-3 text-sm font-semibold text-white"
            >
              Tentar novamente
            </button>

          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black text-white">

      {/* HEADER */}

      <header className="pointer-events-none fixed left-0 right-0 top-0 z-50">

        <div className="flex h-16 items-center justify-between px-5">

          <button
            type="button"
            onClick={() =>
              window.history.back()
            }
            aria-label="Fechar"
            className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
          >
            <X size={22} />
          </button>

          <div className="pointer-events-auto flex items-center gap-2">

            <button
              type="button"
              aria-label="Mais opções"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-black/30 backdrop-blur-md"
            >
              <MoreVertical size={22} />
            </button>

            <Link
              href="/review/create"
              aria-label="Criar publicação"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5A1F]"
            >
              <Plus size={21} />
            </Link>

          </div>

        </div>

      </header>

      {posts.length === 0 ? (

        <div className="flex h-full flex-col items-center justify-center px-6 text-center">

          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <Plus size={28} />
          </div>

          <h1 className="text-xl font-bold">
            Ainda não existem experiências
          </h1>

          <p className="mt-2 max-w-sm text-sm text-white/60">
            Seja o primeiro a partilhar uma experiência no Wizenda.
          </p>

          <Link
            href="/review/create"
            className="mt-6 rounded-[4px] bg-[#FF5A1F] px-6 py-3 text-sm font-semibold"
          >
            Criar publicação
          </Link>

        </div>

      ) : (

        <div className="h-screen snap-y snap-mandatory overflow-y-auto">

          {posts.map(
            (post) => (

              <article
                key={post.id}
                id={`review-post-${post.id}`}
                className="relative h-screen snap-start overflow-hidden bg-black"
              >

                {/* MEDIA */}

                {post.media_type ===
                'video' ? (

                  <video
                    src={
                      post.media_url
                    }
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    loop
                    muted={
                      !soundOn
                    }
                    playsInline
                  />

                ) : (

                  <img
                    src={
                      post.media_url
                    }
                    alt={
                      post.caption ||
                      'Experiência Wizenda'
                    }
                    className="absolute inset-0 h-full w-full object-cover"
                  />

                )}

                {/* ÁUDIO REAL */}

                {post.sound_url &&
                  activeAudio ===
                    post.id && (

                    <audio
                      src={
                        post.sound_url
                      }
                      autoPlay
                      loop
                      muted={
                        !soundOn
                      }
                    />

                  )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-black/30" />

                {/* INFORMAÇÕES */}

                <div className="absolute bottom-0 left-0 right-0 z-20 pb-7 pl-5 pr-24">

                  <div className="mb-3 flex items-center gap-3">

                    {/* FOTO */}

                    <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/20 text-sm font-bold backdrop-blur-md">

                      {post.user_avatar ? (

                        <img
                          src={
                            post.user_avatar
                          }
                          alt={
                            post.user_name
                          }
                          className="h-full w-full object-cover"
                        />

                      ) : (

                        post.user_name
                          .slice(
                            0,
                            1,
                          )
                          .toUpperCase()

                      )}

                    </div>

                    <div>

                      <div className="flex items-center gap-2">

                        {/* NOME */}

                        <span className="text-sm font-bold">
                          {
                            post.user_name
                          }
                        </span>

                        {/* TIPO */}

                        <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-medium backdrop-blur-md">

                          {
                            getPostTypeLabel(
                              post,
                            )
                          }

                        </span>

                      </div>

                      {post.location && (

                        <div className="mt-1 flex items-center gap-1 text-xs text-white/70">

                          <MapPin size={12} />

                          {
                            post.location
                          }

                        </div>

                      )}

                    </div>

                  </div>

                  {post.caption && (

                    <p className="max-w-xl whitespace-pre-wrap text-sm leading-6 text-white">
                      {
                        post.caption
                      }
                    </p>

                  )}

                  {post.rating && (

                    <div className="mt-3 flex items-center gap-1">

                      {Array.from({
                        length: 5,
                      }).map(
                        (_, index) => (

                          <Star
                            key={
                              index
                            }
                            size={
                              14
                            }
                            className={
                              index <
                              post.rating!
                                ? 'fill-yellow-400 text-yellow-400'
                                : 'text-white/40'
                            }
                          />

                        ),
                      )}

                    </div>

                  )}

                  {post.sound_name && (

                    <div className="mt-3 flex items-center gap-2 text-xs text-white/70">

                      <Volume2 size={13} />

                      <span>
                        {
                          post.sound_name
                        }
                      </span>

                    </div>

                  )}

                </div>

                {/* AÇÕES */}

                <div className="absolute bottom-8 right-4 z-30 flex flex-col items-center gap-4">

                  {/* LIKE */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleLike(
                        post,
                      )
                    }
                    aria-label="Gostar"
                    className="flex flex-col items-center gap-1"
                  >

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">

                      <Heart
                        size={22}
                        className={
                          post.liked
                            ? 'fill-red-500 text-red-500'
                            : 'text-white'
                        }
                      />

                    </span>

                    <span className="text-[11px] font-medium">
                      {
                        post.likes_count
                      }
                    </span>

                  </button>

                  {/* COMENTÁRIOS */}

                  <button
                    type="button"
                    onClick={() =>
                      openComments(
                        post.id,
                      )
                    }
                    aria-label="Comentários"
                    className="flex flex-col items-center gap-1"
                  >

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">

                      <MessageCircle
                        size={
                          21
                        }
                      />

                    </span>

                    <span className="text-[11px] font-medium">
                      {
                        post.comments_count
                      }
                    </span>

                  </button>

                  {/* GUARDAR */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleSave(
                        post,
                      )
                    }
                    aria-label="Guardar"
                    className="flex flex-col items-center gap-1"
                  >

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">

                      <Bookmark
                        size={
                          21
                        }
                        className={
                          post.saved
                            ? 'fill-white text-white'
                            : 'text-white'
                        }
                      />

                    </span>

                    <span className="text-[11px] font-medium">
                      Guardar
                    </span>

                  </button>

                  {/* PARTILHAR */}

                  <button
                    type="button"
                    onClick={() =>
                      openShare(
                        post.id,
                      )
                    }
                    aria-label="Partilhar"
                    className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
                  >

                    <Send
                      size={
                        21
                      }
                    />

                  </button>

                  {/* ÁUDIO */}

                  <button
                    type="button"
                    onClick={() =>
                      toggleAudio(
                        post,
                      )
                    }
                    aria-label={
                      soundOn
                        ? 'Desligar som'
                        : 'Ligar som'
                    }
                    className="flex flex-col items-center gap-1"
                  >

                    <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 backdrop-blur-md">

                      {soundOn &&
                      activeAudio ===
                        post.id ? (

                        <Volume2
                          size={
                            21
                          }
                        />

                      ) : (

                        <VolumeX
                          size={
                            21
                          }
                        />

                      )}

                    </span>

                    <span className="text-[11px] font-medium">

                      {soundOn
                        ? 'Som'
                        : 'Mudo'}

                    </span>

                  </button>

                  {/* APAGAR */}

                  {currentUserId ===
                    post.user_id && (

                    <button
                      type="button"
                      onClick={() =>
                        deletePost(
                          post.id,
                        )
                      }
                      aria-label="Apagar publicação"
                      className="flex h-11 w-11 items-center justify-center rounded-full bg-black/25 text-white backdrop-blur-md"
                    >

                      <Trash2
                        size={
                          20
                        }
                      />

                    </button>

                  )}

                </div>

              </article>

            ),
          )}

        </div>

      )}

      {/* COMENTÁRIOS */}

      {commentsOpen && (

        <div className="fixed inset-0 z-[100]">

          <button
            type="button"
            onClick={
              closeComments
            }
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar comentários"
          />

          <div className="absolute bottom-0 left-0 right-0 flex max-h-[80vh] flex-col rounded-t-[18px] bg-white text-gray-950">

            {/* HEADER */}

            <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">

              <div>

                <h2 className="text-base font-bold">
                  Comentários
                </h2>

                {selectedPost && (

                  <p className="mt-1 text-xs text-gray-500">

                    {
                      selectedPost.comments_count
                    }{' '}

                    comentário

                    {selectedPost.comments_count ===
                    1
                      ? ''
                      : 's'}

                  </p>

                )}

              </div>

              <button
                type="button"
                onClick={
                  closeComments
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                aria-label="Fechar"
              >

                <X size={18} />

              </button>

            </div>

            {/* LISTA */}

            <div className="flex-1 overflow-y-auto px-5 py-4">

              {commentsLoading ? (

                <div className="py-10 text-center text-sm text-gray-500">
                  A carregar comentários...
                </div>

              ) : comments.length ===
                0 ? (

                <div className="py-10 text-center text-sm text-gray-500">
                  Ainda não existem comentários.
                </div>

              ) : (

                <div className="space-y-5">

                  {comments.map(
                    (comment) => (

                      <div
                        key={
                          comment.id
                        }
                        className="flex gap-3"
                      >

                        {/* FOTO DO COMENTADOR */}

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-xs font-bold">

                          {comment.user_avatar ? (

                            <img
                              src={
                                comment.user_avatar
                              }
                              alt={
                                comment.user_name
                              }
                              className="h-full w-full object-cover"
                            />

                          ) : (

                            comment.user_name
                              .slice(
                                0,
                                1,
                              )
                              .toUpperCase()

                          )}

                        </div>

                        <div className="min-w-0">

                          <div className="text-sm font-semibold">

                            {
                              comment.user_name
                            }

                          </div>

                          <p className="mt-1 text-sm leading-5 text-gray-700">

                            {
                              comment.comment
                            }

                          </p>

                        </div>

                      </div>

                    ),
                  )}

                </div>

              )}

            </div>

            {/* ESCREVER COMENTÁRIO */}

            <div className="border-t border-gray-100 p-4">

              <div className="flex gap-2">

                <input
                  value={
                    newComment
                  }
                  onChange={(
                    event,
                  ) =>
                    setNewComment(
                      event.target
                        .value,
                    )
                  }
                  onKeyDown={(
                    event,
                  ) => {

                    if (
                      event.key ===
                      'Enter'
                    ) {
                      submitComment()
                    }

                  }}
                  placeholder="Escreve um comentário..."
                  className="min-w-0 flex-1 rounded-[4px] border border-gray-200 bg-gray-50 px-4 py-3 text-sm outline-none focus:border-[#FF5A1F]"
                />

                <button
                  type="button"
                  onClick={
                    submitComment
                  }
                  disabled={
                    commentSubmitting ||
                    !newComment.trim()
                  }
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[4px] bg-[#FF5A1F] text-white disabled:opacity-50"
                  aria-label="Enviar comentário"
                >

                  <Send size={18} />

                </button>

              </div>

            </div>

          </div>

        </div>

      )}

      {/* PARTILHA */}

      {shareOpen && (

        <div className="fixed inset-0 z-[110]">

          <button
            type="button"
            onClick={
              closeShare
            }
            className="absolute inset-0 bg-black/60"
            aria-label="Fechar partilha"
          />

          <div className="absolute bottom-0 left-0 right-0 rounded-t-[18px] bg-white p-5 text-gray-950">

            <div className="mx-auto mb-5 h-1 w-10 rounded-full bg-gray-200" />

            <div className="mb-5 flex items-center justify-between">

              <div>

                <h2 className="text-lg font-bold">
                  Partilhar
                </h2>

                <p className="mt-1 text-xs text-gray-500">
                  Partilha esta experiência com outras pessoas.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  closeShare
                }
                className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                aria-label="Fechar"
              >

                <X size={18} />

              </button>

            </div>

            <div className="space-y-2">

              {/* PARTILHAR */}

              <button
                type="button"
                onClick={
                  shareNative
                }
                className="flex w-full items-center gap-4 rounded-[4px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#FF5A1F]/10 text-[#FF5A1F]">

                  <Send
                    size={
                      19
                    }
                  />

                </span>

                <div>

                  <div className="text-sm font-semibold">
                    Partilhar
                  </div>

                  <div className="text-xs text-gray-500">
                    Usar as opções de partilha do telemóvel
                  </div>

                </div>

              </button>

              {/* WHATSAPP */}

              <button
                type="button"
                onClick={
                  shareWhatsApp
                }
                className="flex w-full items-center gap-4 rounded-[4px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-green-50 text-green-600">

                  <MessageCircle
                    size={
                      19
                    }
                  />

                </span>

                <div>

                  <div className="text-sm font-semibold">
                    WhatsApp
                  </div>

                  <div className="text-xs text-gray-500">
                    Enviar esta experiência pelo WhatsApp
                  </div>

                </div>

              </button>

              {/* COPIAR */}

              <button
                type="button"
                onClick={
                  copyShareLink
                }
                className="flex w-full items-center gap-4 rounded-[4px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">

                  <Bookmark
                    size={
                      19
                    }
                  />

                </span>

                <div>

                  <div className="text-sm font-semibold">
                    Copiar link
                  </div>

                  <div className="text-xs text-gray-500">
                    Copiar o link desta publicação
                  </div>

                </div>

              </button>

              {/* ABRIR MÍDIA */}

              <button
                type="button"
                onClick={
                  openMedia
                }
                className="flex w-full items-center gap-4 rounded-[4px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
              >

                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">

                  <MapPin
                    size={
                      19
                    }
                  />

                </span>

                <div>

                  <div className="text-sm font-semibold">
                    Abrir mídia
                  </div>

                  <div className="text-xs text-gray-500">
                    Abrir a imagem ou vídeo original
                  </div>

                </div>

              </button>

              {/* CANCELAR */}

              <button
                type="button"
                onClick={
                  closeShare
                }
                className="mt-2 flex w-full items-center justify-center rounded-[4px] bg-gray-100 px-4 py-4 text-sm font-semibold"
              >
                Cancelar
              </button>

            </div>

          </div>

        </div>

      )}

    </main>
  )
}