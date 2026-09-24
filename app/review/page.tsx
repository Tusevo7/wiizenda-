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
import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

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
  sound_artist: string | null
  sound_url: string | null
  created_at: string
  tagged_type: 'agency' | 'hotel' | null
  tagged_id: string | null
  tagged_name: string | null
  tagged_image: string | null
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
  post_id: string
  user_id: string
  content: string
  created_at: string
  user_name: string
  user_avatar: string | null
}

type Profile = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string | null
}

type Agency = {
  id: string
  name: string
  logo_url: string | null
  owner_id?: string | null
}

type MusicTrack = {
  audio_url: string
  title: string
  artist: string | null
}

export default function ReviewPage() {
  const supabase = useMemo(() => createClient(), [])

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)

  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [soundOn, setSoundOn] = useState(true)

  const [commentsOpen, setCommentsOpen] = useState(false)
  const [selectedPost, setSelectedPost] = useState<Post | null>(null)

  const [comments, setComments] = useState<Comment[]>([])
  const [commentText, setCommentText] = useState('')
  const [commentsLoading, setCommentsLoading] = useState(false)

  const [shareOpen, setShareOpen] = useState(false)
  const [sharePost, setSharePost] = useState<Post | null>(null)

  const [menuOpen, setMenuOpen] = useState<string | null>(null)

  /**
   * UM ÚNICO AUDIO PARA TODA A PÁGINA.
   *
   * Isto é importante:
   * não criamos um <audio> para cada review.
   * Assim, quando mudamos de review, primeiro paramos
   * a música anterior e depois carregamos a nova.
   */
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const feedRef = useRef<HTMLDivElement | null>(null)

  const activePostIdRef = useRef<string | null>(null)

  const [audioUnlocked, setAudioUnlocked] = useState(false)

  const currentUserIdRef = useRef<string | null>(null)

  /*
   * ============================================================
   * CONTROLE CENTRAL DA MÚSICA
   * ============================================================
   */

  function stopCurrentAudio() {
    const audio = audioRef.current

    if (!audio) return

    audio.pause()
    audio.currentTime = 0
    audio.removeAttribute('src')
    audio.load()
  }

  async function playPostMusic(post: Post | null) {
    const audio = audioRef.current

    if (!audio) return

    /*
     * Se não existe música neste review,
     * paramos qualquer música anterior.
     */
    if (!post?.sound_url) {
      stopCurrentAudio()

      setActivePostId(null)
      activePostIdRef.current = null
      setSoundOn(false)

      return
    }

    /*
     * Primeiro paramos completamente a música anterior.
     */
    audio.pause()
    audio.currentTime = 0

    /*
     * Colocamos a música pertencente ao review atual.
     */
    audio.src = post.sound_url
    audio.loop = true
    audio.preload = 'auto'
    audio.muted = false

    setActivePostId(post.id)
    activePostIdRef.current = post.id
    setSoundOn(true)

    /*
     * Tentamos tocar imediatamente.
     *
     * Em browsers que permitem autoplay:
     * começa imediatamente.
     *
     * Em browsers que bloqueiam autoplay:
     * o primeiro toque/gesto do utilizador desbloqueia.
     */
    try {
      await audio.play()
      setAudioUnlocked(true)
    } catch {
      setAudioUnlocked(false)
    }
  }

  /*
   * Botão manual de som.
   */
  async function toggleAudio(post: Post) {
    const audio = audioRef.current

    if (!audio || !post.sound_url) {
      setSoundOn((value) => !value)
      return
    }

    /*
     * Se este não é o review ativo,
     * tornamo-lo ativo e começamos a música dele.
     */
    if (activePostIdRef.current !== post.id) {
      await playPostMusic(post)
      return
    }

    /*
     * Review atual.
     */
    if (soundOn) {
      audio.pause()
      setSoundOn(false)
      return
    }

    try {
      audio.muted = false
      await audio.play()
      setSoundOn(true)
      setAudioUnlocked(true)
    } catch {
      setSoundOn(false)
    }
  }

  /*
   * ============================================================
   * DESBLOQUEAR ÁUDIO APÓS PRIMEIRO GESTO DO UTILIZADOR
   * ============================================================
   *
   * Isto resolve a limitação de autoplay de alguns browsers.
   */
  useEffect(() => {
    function unlockAudio() {
      const audio = audioRef.current

      if (!audio) return

      const currentId = activePostIdRef.current

      if (!currentId) return

      const post = posts.find(
        (item) => item.id === currentId,
      )

      if (!post?.sound_url) return

      audio.muted = false

      audio
        .play()
        .then(() => {
          setAudioUnlocked(true)
          setSoundOn(true)
        })
        .catch(() => {
          // Browser ainda não permitiu autoplay.
        })
    }

    window.addEventListener(
      'pointerdown',
      unlockAudio,
    )

    window.addEventListener(
      'touchstart',
      unlockAudio,
    )

    window.addEventListener(
      'keydown',
      unlockAudio,
    )

    return () => {
      window.removeEventListener(
        'pointerdown',
        unlockAudio,
      )

      window.removeEventListener(
        'touchstart',
        unlockAudio,
      )

      window.removeEventListener(
        'keydown',
        unlockAudio,
      )
    }
  }, [posts])

  /*
   * ============================================================
   * CARREGAR POSTS
   * ============================================================
   */

  async function loadPosts() {
    try {
      setLoading(true)

      const {
        data: {
          user,
        },
      } = await supabase.auth.getUser()

      currentUserIdRef.current =
        user?.id ?? null

      const {
        data: rawPosts,
        error: postsError,
      } = await supabase
        .from('community_posts')
        .select(`
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
          created_at,
          tagged_type,
          tagged_id
        `)
        .order('created_at', {
          ascending: false,
        })

      if (postsError) {
        console.error(postsError)
        return
      }

      if (!rawPosts || rawPosts.length === 0) {
        setPosts([])
        return
      }

      /*
       * ========================================================
       * PROFILES
       * ========================================================
       */

      const userIds = Array.from(
        new Set(
          rawPosts.map(
            (post) => post.user_id,
          ),
        ),
      )

      let profiles: Profile[] = []

      if (userIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('profiles')
          .select(
            'id, full_name, avatar_url, role',
          )
          .in('id', userIds)

        if (!error) {
          profiles = data ?? []
        }
      }

      const profileMap = new Map(
        profiles.map((profile) => [
          profile.id,
          profile,
        ]),
      )

      /*
       * ========================================================
       * AGENCIES
       * ========================================================
       */

      let agencies: Agency[] = []

      if (userIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('agencies')
          .select(
            'id, name, logo_url, owner_id',
          )
          .in('owner_id', userIds)

        if (!error) {
          agencies = data ?? []
        }
      }

      const agencyByOwner = new Map(
        agencies
          .filter(
            (agency) =>
              agency.owner_id,
          )
          .map((agency) => [
            agency.owner_id as string,
            agency,
          ]),
      )

      /*
       * ========================================================
       * TAGGED AGENCIES
       * ========================================================
       */

      const taggedAgencyIds =
        Array.from(
          new Set(
            rawPosts
              .filter(
                (post) =>
                  post.tagged_type ===
                    'agency' &&
                  post.tagged_id,
              )
              .map(
                (post) =>
                  post.tagged_id as string,
              ),
          ),
        )

      let taggedAgencies: Agency[] = []

      if (taggedAgencyIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('agencies')
          .select(
            'id, name, logo_url',
          )
          .in(
            'id',
            taggedAgencyIds,
          )

        if (!error) {
          taggedAgencies = data ?? []
        }
      }

      const taggedAgencyMap =
        new Map(
          taggedAgencies.map(
            (agency) => [
              agency.id,
              agency,
            ],
          ),
        )

      /*
       * ========================================================
       * TAGGED HOTELS / PLACES
       * ========================================================
       */

      const taggedHotelIds =
        Array.from(
          new Set(
            rawPosts
              .filter(
                (post) =>
                  post.tagged_type ===
                    'hotel' &&
                  post.tagged_id,
              )
              .map(
                (post) =>
                  post.tagged_id as string,
              ),
          ),
        )

      type TaggedHotel = {
        id: string
        name: string
        image_url: string | null
        cover_image: string | null
      }

      let taggedHotels: TaggedHotel[] =
        []

      if (taggedHotelIds.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('weekend_places')
          .select(
            'id, name, image_url, cover_image',
          )
          .in(
            'id',
            taggedHotelIds,
          )

        if (!error) {
          taggedHotels = data ?? []
        }
      }

      const taggedHotelMap =
        new Map(
          taggedHotels.map(
            (hotel) => [
              hotel.id,
              hotel,
            ],
          ),
        )

      /*
       * ========================================================
       * MÚSICAS
       * ========================================================
       *
       * Pegamos título + artista diretamente
       * da tabela music_tracks.
       */

      const soundUrls =
        Array.from(
          new Set(
            rawPosts
              .map(
                (post) =>
                  post.sound_url,
              )
              .filter(
                (
                  url,
                ): url is string =>
                  Boolean(url),
              ),
          ),
        )

      let musicTracks: MusicTrack[] =
        []

      if (soundUrls.length > 0) {
        const {
          data,
          error,
        } = await supabase
          .from('music_tracks')
          .select(
            'audio_url, title, artist',
          )
          .in(
            'audio_url',
            soundUrls,
          )

        if (!error) {
          musicTracks = data ?? []
        }
      }

      const musicMap =
        new Map(
          musicTracks.map(
            (track) => [
              track.audio_url,
              track,
            ],
          ),
        )

      /*
       * ========================================================
       * LIKES
       * ========================================================
       */

      const postIds =
        rawPosts.map(
          (post) => post.id,
        )

      let likes: {
        post_id: string
        user_id: string
      }[] = []

      {
        const {
          data,
          error,
        } = await supabase
          .from('community_post_likes')
          .select(
            'post_id, user_id',
          )
          .in(
            'post_id',
            postIds,
          )

        if (!error) {
          likes = data ?? []
        }
      }

      /*
       * ========================================================
       * SAVES
       * ========================================================
       */

      let saves: {
        post_id: string
        user_id: string
      }[] = []

      {
        const {
          data,
          error,
        } = await supabase
          .from('community_post_saves')
          .select(
            'post_id, user_id',
          )
          .in(
            'post_id',
            postIds,
          )

        if (!error) {
          saves = data ?? []
        }
      }

      /*
       * ========================================================
       * COMMENTS
       * ========================================================
       */

      let allComments: {
        id: string
        post_id: string
        user_id: string
        content: string
        created_at: string
      }[] = []

      {
        const {
          data,
          error,
        } = await supabase
          .from('community_comments')
          .select(`
            id,
            post_id,
            user_id,
            content,
            created_at
          `)
          .in(
            'post_id',
            postIds,
          )
          .order(
            'created_at',
            {
              ascending: true,
            },
          )

        if (!error) {
          allComments = data ?? []
        }
      }

      /*
       * ========================================================
       * MAPEAR POSTS
       * ========================================================
       */

      const mappedPosts: Post[] =
        rawPosts.map((post) => {
          const profile =
            profileMap.get(
              post.user_id,
            )

          const agency =
            agencyByOwner.get(
              post.user_id,
            )

          const taggedAgency =
            post.tagged_id
              ? taggedAgencyMap.get(
                  post.tagged_id,
                )
              : undefined

          const taggedHotel =
            post.tagged_id
              ? taggedHotelMap.get(
                  post.tagged_id,
                )
              : undefined

          const music =
            post.sound_url
              ? musicMap.get(
                  post.sound_url,
                )
              : undefined

          let userName =
            profile?.full_name ||
            'Viajante'

          let userAvatar =
            profile?.avatar_url ??
            null

          let userRole =
            profile?.role ||
            'Viajante'

          /*
           * Se é agência, mostra agência.
           */
          if (agency) {
            userName =
              agency.name

            userAvatar =
              agency.logo_url ??
              userAvatar

            userRole = 'Agência'
          }

          /*
           * Se é publicação Wizenda/admin.
           */
          if (
            post.post_type ===
            'wizenda'
          ) {
            userName =
              'Wizenda'

            userRole =
              'Wizenda'
          }

          return {
            id: post.id,
            user_id:
              post.user_id,
            post_type:
              post.post_type,
            media_type:
              post.media_type,
            media_url:
              post.media_url,
            caption:
              post.caption,
            location:
              post.location,
            rating:
              post.rating,
            sound_name:
              music?.title ??
              post.sound_name ??
              null,
            sound_artist:
              music?.artist ??
              null,
            sound_url:
              post.sound_url,
            created_at:
              post.created_at,
            tagged_type:
              post.tagged_type,
            tagged_id:
              post.tagged_id,
            tagged_name:
              post.tagged_type ===
                'agency'
                ? taggedAgency
                    ?.name ??
                  null
                : post.tagged_type ===
                    'hotel'
                  ? taggedHotel
                      ?.name ??
                    null
                  : null,
            tagged_image:
              post.tagged_type ===
                'agency'
                ? taggedAgency
                    ?.logo_url ??
                  null
                : post.tagged_type ===
                    'hotel'
                  ? taggedHotel
                      ?.image_url ??
                    taggedHotel
                      ?.cover_image ??
                    null
                  : null,
            user_name:
              userName,
            user_avatar:
              userAvatar,
            user_role:
              userRole,
            liked:
              Boolean(
                currentUserIdRef.current &&
                  likes.some(
                    (like) =>
                      like.post_id ===
                        post.id &&
                      like.user_id ===
                        currentUserIdRef.current,
                  ),
              ),
            saved:
              Boolean(
                currentUserIdRef.current &&
                  saves.some(
                    (save) =>
                      save.post_id ===
                        post.id &&
                      save.user_id ===
                        currentUserIdRef.current,
                  ),
              ),
            likes_count:
              likes.filter(
                (like) =>
                  like.post_id ===
                  post.id,
              ).length,
            comments_count:
              allComments.filter(
                (comment) =>
                  comment.post_id ===
                  post.id,
              ).length,
          }
        })

      /*
       * Pequena mistura para o feed não ficar
       * sempre exatamente na mesma ordem.
       */
      const shuffled = [...mappedPosts]

      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [
          shuffled[j],
          shuffled[i],
        ]
      }

      setPosts(shuffled)
    } catch (error) {
      console.error(
        'Erro ao carregar reviews:',
        error,
      )
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadPosts()
  }, [])

  /*
   * ============================================================
   * OBSERVER DOS REVIEWS
   * ============================================================
   *
   * Aqui está a parte principal.
   *
   * Quando um review passa a ocupar aproximadamente 70% da tela:
   *
   * Review A:
   * música A toca.
   *
   * Usuário arrasta:
   *
   * Review B:
   * música A para.
   * música B começa.
   *
   * Review C:
   * música B para.
   * música C começa.
   */

  useEffect(() => {
    if (!posts.length) return

    const container =
      feedRef.current

    if (!container) return

    const articles =
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'article[data-review-id]',
        ),
      )

    if (!articles.length) return

    const observer =
      new IntersectionObserver(
        (entries) => {
          /*
           * Procuramos o review que está mais visível.
           */
          const visibleEntries =
            entries.filter(
              (entry) =>
                entry.isIntersecting,
            )

          if (
            !visibleEntries.length
          ) {
            return
          }

          const mostVisible =
            visibleEntries.sort(
              (a, b) =>
                b.intersectionRatio -
                a.intersectionRatio,
            )[0]

          if (!mostVisible) return

          const postId =
            mostVisible.target.getAttribute(
              'data-review-id',
            )

          if (!postId) return

          /*
           * Não fazemos nada se continuamos
           * exatamente no mesmo review.
           */
          if (
            activePostIdRef.current ===
            postId
          ) {
            return
          }

          const post =
            posts.find(
              (item) =>
                item.id === postId,
            )

          if (!post) return

          /*
           * MUDA A MÚSICA.
           */
          playPostMusic(post)
        },
        {
          root: container,
          threshold: [
            0.5,
            0.6,
            0.7,
            0.8,
            0.9,
          ],
        },
      )

    articles.forEach(
      (article) => {
        observer.observe(article)
      },
    )

    /*
     * Define o primeiro review
     * como ativo.
     */
    const firstPost = posts[0]

    if (
      firstPost &&
      activePostIdRef.current ===
        null
    ) {
      /*
       * Pequeno timeout para garantir
       * que o DOM já está pronto.
       */
      const timer =
        window.setTimeout(() => {
          playPostMusic(
            firstPost,
          )
        }, 250)

      return () => {
        window.clearTimeout(
          timer,
        )

        observer.disconnect()
      }
    }

    return () => {
      observer.disconnect()
    }
  }, [posts])

  /*
   * Quando a página desmontar,
   * paramos completamente o áudio.
   */
  useEffect(() => {
    return () => {
      stopCurrentAudio()
    }
  }, [])

  /*
   * ============================================================
   * LIKE
   * ============================================================
   */

  async function toggleLike(
    post: Post,
  ) {
    const userId =
      currentUserIdRef.current

    if (!userId) return

    const existing =
      post.liked

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              liked: !existing,
              likes_count:
                Math.max(
                  0,
                  item.likes_count +
                    (existing
                      ? -1
                      : 1),
                ),
            }
          : item,
      ),
    )

    if (existing) {
      const { error } =
        await supabase
          .from(
            'community_post_likes',
          )
          .delete()
          .eq(
            'post_id',
            post.id,
          )
          .eq(
            'user_id',
            userId,
          )

      if (error) {
        console.error(error)

        setPosts((current) =>
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
    } else {
      const { error } =
        await supabase
          .from(
            'community_post_likes',
          )
          .insert({
            post_id:
              post.id,
            user_id:
              userId,
          })

      if (error) {
        console.error(error)

        setPosts((current) =>
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
      }
    }
  }

  /*
   * ============================================================
   * SAVE
   * ============================================================
   */

  async function toggleSave(
    post: Post,
  ) {
    const userId =
      currentUserIdRef.current

    if (!userId) return

    const existing =
      post.saved

    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              saved: !existing,
            }
          : item,
      ),
    )

    if (existing) {
      const { error } =
        await supabase
          .from(
            'community_post_saves',
          )
          .delete()
          .eq(
            'post_id',
            post.id,
          )
          .eq(
            'user_id',
            userId,
          )

      if (error) {
        console.error(error)

        setPosts((current) =>
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
    } else {
      const { error } =
        await supabase
          .from(
            'community_post_saves',
          )
          .insert({
            post_id:
              post.id,
            user_id:
              userId,
          })

      if (error) {
        console.error(error)

        setPosts((current) =>
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
      }
    }
  }

  /*
   * ============================================================
   * COMENTÁRIOS
   * ============================================================
   */

  async function openComments(
    post: Post,
  ) {
    setSelectedPost(post)
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
        .select(`
          id,
          post_id,
          user_id,
          content,
          created_at
        `)
        .eq(
          'post_id',
          post.id,
        )
        .order(
          'created_at',
          {
            ascending: true,
          },
        )

      if (error) {
        console.error(error)
        return
      }

      const commentRows =
        data ?? []

      const userIds =
        Array.from(
          new Set(
            commentRows.map(
              (comment) =>
                comment.user_id,
            ),
          ),
        )

      let commentProfiles:
        Profile[] = []

      if (userIds.length) {
        const {
          data: profilesData,
        } = await supabase
          .from('profiles')
          .select(
            'id, full_name, avatar_url, role',
          )
          .in(
            'id',
            userIds,
          )

        commentProfiles =
          profilesData ?? []
      }

      const profileMap =
        new Map(
          commentProfiles.map(
            (profile) => [
              profile.id,
              profile,
            ],
          ),
        )

      setComments(
        commentRows.map(
          (comment) => {
            const profile =
              profileMap.get(
                comment.user_id,
              )

            return {
              id: comment.id,
              post_id:
                comment.post_id,
              user_id:
                comment.user_id,
              content:
                comment.content,
              created_at:
                comment.created_at,
              user_name:
                profile?.full_name ||
                'Utilizador',
              user_avatar:
                profile?.avatar_url ??
                null,
            }
          },
        ),
      )
    } finally {
      setCommentsLoading(false)
    }
  }

  async function addComment() {
    const userId =
      currentUserIdRef.current

    if (
      !userId ||
      !selectedPost ||
      !commentText.trim()
    ) {
      return
    }

    const text =
      commentText.trim()

    setCommentText('')

    const {
      data,
      error,
    } = await supabase
      .from(
        'community_comments',
      )
      .insert({
        post_id:
          selectedPost.id,
        user_id:
          userId,
        content: text,
      })
      .select(
        'id, post_id, user_id, content, created_at',
      )
      .single()

    if (error) {
      console.error(error)
      setCommentText(text)
      return
    }

    const {
      data: profile,
    } = await supabase
      .from('profiles')
      .select(
        'full_name, avatar_url',
      )
      .eq('id', userId)
      .maybeSingle()

    const newComment: Comment =
      {
        id: data.id,
        post_id:
          data.post_id,
        user_id:
          data.user_id,
        content:
          data.content,
        created_at:
          data.created_at,
        user_name:
          profile?.full_name ||
          'Utilizador',
        user_avatar:
          profile?.avatar_url ??
          null,
      }

    setComments(
      (current) => [
        ...current,
        newComment,
      ],
    )

    setPosts((current) =>
      current.map((post) =>
        post.id ===
        selectedPost.id
          ? {
              ...post,
              comments_count:
                post.comments_count +
                1,
            }
          : post,
      ),
    )
  }

  /*
   * ============================================================
   * SHARE
   * ============================================================
   */

  function openShare(
    post: Post,
  ) {
    setSharePost(post)
    setShareOpen(true)
    setMenuOpen(null)
  }

  function closeShare() {
    setShareOpen(false)
    setSharePost(null)
  }

  async function copyLink() {
    if (!sharePost) return

    const url =
      `${window.location.origin}/review#review-post-${sharePost.id}`

    try {
      await navigator.clipboard.writeText(
        url,
      )

      setShareOpen(false)
      setSharePost(null)
    } catch {
      console.error(
        'Não foi possível copiar o link.',
      )
    }
  }

  function openMedia() {
    if (!sharePost) return

    window.open(
      sharePost.media_url,
      '_blank',
      'noopener,noreferrer',
    )

    closeShare()
  }

  /*
   * ============================================================
   * DELETE
   * ============================================================
   */

  async function deletePost(
    post: Post,
  ) {
    const userId =
      currentUserIdRef.current

    if (
      !userId ||
      post.user_id !== userId
    ) {
      return
    }

    const confirmed =
      window.confirm(
        'Tem certeza que deseja eliminar esta publicação?',
      )

    if (!confirmed) return

    if (
      activePostIdRef.current ===
      post.id
    ) {
      stopCurrentAudio()

      setActivePostId(null)
      activePostIdRef.current =
        null
    }

    const {
      error,
    } = await supabase
      .from('community_posts')
      .delete()
      .eq('id', post.id)
      .eq(
        'user_id',
        userId,
      )

    if (error) {
      console.error(error)
      return
    }

    setPosts((current) =>
      current.filter(
        (item) =>
          item.id !== post.id,
      ),
    )

    setMenuOpen(null)
  }

  /*
   * ============================================================
   * LABELS
   * ============================================================
   */

  function getPostTypeLabel(
    post: Post,
  ) {
    if (
      post.post_type ===
      'agency'
    ) {
      return 'Agência'
    }

    if (
      post.post_type ===
      'hotel'
    ) {
      return 'Hotel'
    }

    if (
      post.post_type ===
      'wizenda'
    ) {
      return 'Wizenda'
    }

    return 'Viajante'
  }

  /*
   * ============================================================
   * LOADING
   * ============================================================
   */

  if (loading) {
    return (
      <main className="flex h-screen items-center justify-center bg-black text-white">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-white" />
          <span className="text-sm text-white/60">
            A carregar experiências...
          </span>
        </div>
      </main>
    )
  }

  /*
   * ============================================================
   * EMPTY
   * ============================================================
   */

  if (!posts.length) {
    return (
      <main className="flex h-screen items-center justify-center bg-black px-6 text-center text-white">
        <div>
          <div className="mb-4 text-5xl">
            🌍
          </div>

          <h1 className="text-xl font-bold">
            Ainda não existem experiências
          </h1>

          <p className="mt-2 text-sm text-white/60">
            Seja o primeiro a partilhar
            uma experiência na Wizenda.
          </p>

          <Link
            href="/review/create"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-black"
          >
            <Plus size={17} />
            Criar review
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="relative h-screen overflow-hidden bg-black">
      {/*
       * ========================================================
       * AUDIO GLOBAL
       * ========================================================
       *
       * Apenas um <audio>.
       *
       * Nunca existe:
       *
       * <audio> review 1
       * <audio> review 2
       * <audio> review 3
       *
       * Existe apenas:
       *
       * <audio> atual
       *
       * E nós trocamos o src conforme o review.
       */}

      <audio
        ref={audioRef}
        loop
        preload="auto"
        className="hidden"
      />

      {/*
       * ========================================================
       * HEADER
       * ========================================================
       */}

      <header className="pointer-events-none absolute left-0 right-0 top-0 z-40 flex items-center justify-between px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))] sm:px-6">
        <div className="pointer-events-auto">
          <Link
            href="/"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/50"
            aria-label="Fechar e voltar"
          >
            <X size={22} />
          </Link>
        </div>

        <div className="pointer-events-auto flex items-center gap-2">
          <Link
            href="/review/create"
            className="flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/30 text-white shadow-lg backdrop-blur-xl transition hover:bg-black/50"
            aria-label="Criar review"
          >
            <Plus size={22} />
          </Link>

          
        </div>
      </header>

      

      {/*
       * ========================================================
       * FEED
       * ========================================================
       */}

      <div
        ref={feedRef}
        className="review-feed-container h-screen snap-y snap-mandatory touch-pan-y overflow-y-auto overscroll-y-contain"
      >
        {posts.map((post) => (
          <article
            key={post.id}
            id={`review-post-${post.id}`}
            data-review-id={
              post.id
            }
            className="relative h-screen snap-start snap-always overflow-hidden bg-black"
          >
            {/*
             * ==================================================
             * MEDIA
             * ==================================================
             */}

            <div className="absolute inset-0">
              {post.media_type ===
              'video' ? (
                <video
                  src={
                    post.media_url
                  }
                  className="absolute inset-0 h-full w-full object-cover"
                  autoPlay
                  loop
                  muted
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

              {/*
               * Gradientes para melhorar
               * leitura do conteúdo.
               */}

              <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/85" />

              <div className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/*
             * ==================================================
             * CONTEÚDO INFERIOR
             * ==================================================
             */}

            <div className="absolute inset-x-0 bottom-0 z-20 max-h-[52vh] overflow-hidden px-4 pb-[calc(env(safe-area-inset-bottom)+1.25rem)] pr-[5.75rem] sm:px-6 sm:pb-8 sm:pr-28">
              {/*
               * AUTOR
               */}

              <div className="mb-3 flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/20 bg-white/10 shadow-lg backdrop-blur-md">
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
                    <span className="text-sm font-semibold text-white">
                      {post.user_name
                        .charAt(
                          0,
                        )
                        .toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="max-w-[190px] truncate text-sm font-bold text-white drop-shadow">
                      {
                        post.user_name
                      }
                    </span>

                    <span className="rounded-full bg-white/10 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-white/70 backdrop-blur-md">
                      {getPostTypeLabel(
                        post,
                      )}
                    </span>
                  </div>
                </div>
              </div>

              {/*
               * ==================================================
               * AGÊNCIA / HOTEL MARCADO
               * ==================================================
               *
               * Mais compacto para não ficar feio
               * nem ocupar demasiado espaço.
               */}

              {post.tagged_name && (
                <div className="mb-3 flex max-w-full items-center gap-2">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full border border-white/15 bg-black/30 backdrop-blur-xl">
                    {post.tagged_image ? (
                      <img
                        src={
                          post.tagged_image
                        }
                        alt={
                          post.tagged_name
                        }
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-xs">
                        {post.tagged_type ===
                        'hotel'
                          ? '🏨'
                          : '🏢'}
                      </span>
                    )}
                  </div>

                  <div className="min-w-0 rounded-full border border-white/10 bg-black/30 px-3 py-1.5 backdrop-blur-xl">
                    <div className="flex max-w-full items-center gap-1.5">
                      <span className="shrink-0 text-[9px] uppercase tracking-wider text-white/45">
                        Com
                      </span>

                      <span className="max-w-[190px] truncate text-xs font-semibold text-white">
                        {
                          post.tagged_name
                        }
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/*
               * ==================================================
               * DESCRIÇÃO
               * ==================================================
               */}

              {post.caption && (
                <p className="max-w-[520px] text-sm leading-5 text-white drop-shadow-md sm:text-[15px] sm:leading-6">
                  {
                    post.caption
                  }
                </p>
              )}

              {/*
               * ==================================================
               * LOCALIZAÇÃO
               * ==================================================
               */}

              {post.location && (
                <div className="mt-2 flex max-w-full items-center gap-1.5 text-xs text-white/75">
                  <MapPin
                    size={13}
                    className="shrink-0"
                  />

                  <span className="truncate">
                    {
                      post.location
                    }
                  </span>
                </div>
              )}

              {/*
               * ==================================================
               * RATING
               * ==================================================
               */}

              {post.rating !==
                null && (
                <div className="mt-2 flex items-center gap-1">
                  <Star
                    size={14}
                    className="fill-yellow-400 text-yellow-400"
                  />

                  <span className="text-xs font-semibold text-white">
                    {post.rating.toFixed(
                      1,
                    )}
                  </span>
                </div>
              )}

              {/*
               * ==================================================
               * MÚSICA
               * ==================================================
               *
               * Título + artista.
               */}

              {post.sound_name && (
                <button
                  type="button"
                  onClick={() =>
                    toggleAudio(
                      post,
                    )
                  }
                  className="mt-3 flex max-w-[min(100%,340px)] items-center gap-2 rounded-full border border-white/10 bg-black/35 px-2.5 py-1.5 text-left backdrop-blur-xl transition hover:bg-black/50"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-white/10">
                    {soundOn &&
                    activePostIdRef.current ===
                      post.id ? (
                      <Volume2
                        size={14}
                        className="text-white"
                      />
                    ) : (
                      <VolumeX
                        size={14}
                        className="text-white/60"
                      />
                    )}
                  </span>

                  <div className="min-w-0">
                    <div className="max-w-[250px] truncate text-xs font-semibold text-white">
                      {
                        post.sound_name
                      }
                    </div>

                    {post.sound_artist && (
                      <div className="max-w-[250px] truncate text-[10px] text-white/55">
                        {
                          post.sound_artist
                        }
                      </div>
                    )}
                  </div>
                </button>
              )}

              {/*
               * Se o browser bloquear autoplay,
               * indicamos apenas visualmente pelo botão
               * de som. O primeiro toque desbloqueia.
               */}

              {!audioUnlocked &&
                post.sound_url &&
                activePostId ===
                  post.id && (
                  <div className="mt-2 text-[10px] text-white/45">
                    Toca no ecrã para
                    ativar o som
                  </div>
                )}
            </div>

            {/*
             * ==================================================
             * AÇÕES LATERAIS
             * ==================================================
             */}

            <div className="absolute bottom-[calc(env(safe-area-inset-bottom)+1.25rem)] right-3 z-30 flex flex-col items-center gap-3 sm:bottom-8 sm:right-5 sm:gap-4">
              {/*
               * LIKE
               */}

              <button
                type="button"
                onClick={() =>
                  toggleLike(
                    post,
                  )
                }
                className="flex flex-col items-center gap-1 text-white"
                aria-label="Gostar"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-black/50">
                  <Heart
                    size={21}
                    className={
                      post.liked
                        ? 'fill-red-500 text-red-500'
                        : 'text-white'
                    }
                  />
                </span>

                <span className="text-[10px] font-medium drop-shadow">
                  {
                    post.likes_count
                  }
                </span>
              </button>

              {/*
               * COMENTÁRIOS
               */}

              <button
                type="button"
                onClick={() =>
                  openComments(
                    post,
                  )
                }
                className="flex flex-col items-center gap-1 text-white"
                aria-label="Comentários"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-black/50">
                  <MessageCircle
                    size={21}
                  />
                </span>

                <span className="text-[10px] font-medium drop-shadow">
                  {
                    post.comments_count
                  }
                </span>
              </button>

              {/*
               * GUARDAR
               */}

              <button
                type="button"
                onClick={() =>
                  toggleSave(
                    post,
                  )
                }
                className="flex flex-col items-center gap-1 text-white"
                aria-label="Guardar"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-black/50">
                  <Bookmark
                    size={21}
                    className={
                      post.saved
                        ? 'fill-white text-white'
                        : 'text-white'
                    }
                  />
                </span>
              </button>

              {/*
               * PARTILHAR
               */}

              <button
                type="button"
                onClick={() =>
                  openShare(
                    post,
                  )
                }
                className="flex flex-col items-center gap-1 text-white"
                aria-label="Partilhar"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-black/50">
                  <Send
                    size={20}
                  />
                </span>
              </button>

              {currentUserIdRef.current === post.user_id && (
                <button
                  type="button"
                  onClick={() => deletePost(post)}
                  className="flex flex-col items-center gap-1 text-white"
                  aria-label="Eliminar publicação"
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-red-500/30">
                    <Trash2 size={20} />
                  </span>
                </button>
              )}

              {/*
               * SOM
               */}

              {post.sound_url && (
                <button
                  type="button"
                  onClick={() =>
                    toggleAudio(
                      post,
                    )
                  }
                  className="flex flex-col items-center gap-1 text-white"
                  aria-label={
                    soundOn
                      ? 'Desligar som'
                      : 'Ligar som'
                  }
                >
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 backdrop-blur-xl transition hover:bg-black/50">
                    {soundOn &&
                    activePostId ===
                      post.id ? (
                      <Volume2
                        size={20}
                      />
                    ) : (
                      <VolumeX
                        size={20}
                      />
                    )}
                  </span>
                </button>
              )}

              {/*
               * MENU
               */}

              <div className="relative">
                <button
                  type="button"
                  onClick={() =>
                    setMenuOpen(
                      (current) =>
                        current ===
                        post.id
                          ? null
                          : post.id,
                    )
                  }
                  className="flex h-11 w-11 items-center justify-center rounded-full bg-black/30 text-white backdrop-blur-xl transition hover:bg-black/50"
                  aria-label="Mais opções"
                >
                  <MoreVertical
                    size={20}
                  />
                </button>

                {menuOpen ===
                  post.id && (
                  <div className="absolute bottom-0 right-14 z-50 w-52 overflow-hidden rounded-2xl border border-white/10 bg-black/85 p-1 shadow-2xl backdrop-blur-xl">
                    <button
                      type="button"
                      onClick={() =>
                        toggleSave(
                          post,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <Bookmark
                        size={17}
                      />

                      <span>
                        {post.saved
                          ? 'Remover dos guardados'
                          : 'Guardar publicação'}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        openShare(
                          post,
                        )
                      }
                      className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm text-white transition hover:bg-white/10"
                    >
                      <Send
                        size={17}
                      />

                      <span>
                        Partilhar
                      </span>
                    </button>


                  </div>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>

      {/*
       * ========================================================
       * MODAL DE COMENTÁRIOS
       * ========================================================
       */}

      {commentsOpen &&
        selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex max-h-[82vh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <h2 className="text-base font-bold text-gray-900">
                  Comentários
                </h2>

                <button
                  type="button"
                  onClick={() =>
                    setCommentsOpen(
                      false,
                    )
                  }
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-4">
                {commentsLoading ? (
                  <div className="py-10 text-center text-sm text-gray-500">
                    A carregar...
                  </div>
                ) : comments.length ===
                  0 ? (
                  <div className="py-10 text-center">
                    <MessageCircle
                      size={28}
                      className="mx-auto text-gray-300"
                    />

                    <p className="mt-3 text-sm text-gray-500">
                      Ainda não há
                      comentários.
                    </p>
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
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100">
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
                              <span className="text-xs font-semibold text-gray-600">
                                {comment.user_name
                                  .charAt(
                                    0,
                                  )
                                  .toUpperCase()}
                              </span>
                            )}
                          </div>

                          <div className="min-w-0">
                            <div className="text-sm font-semibold text-gray-900">
                              {
                                comment.user_name
                              }
                            </div>

                            <p className="mt-1 text-sm leading-5 text-gray-600">
                              {
                                comment.content
                              }
                            </p>
                          </div>
                        </div>
                      ),
                    )}
                  </div>
                )}
              </div>

              <div className="border-t border-gray-100 p-4">
                <form
                  onSubmit={(
                    event,
                  ) => {
                    event.preventDefault()
                    addComment()
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    value={
                      commentText
                    }
                    onChange={(
                      event,
                    ) =>
                      setCommentText(
                        event.target
                          .value,
                      )
                    }
                    placeholder="Escreva um comentário..."
                    className="min-w-0 flex-1 rounded-full bg-gray-100 px-4 py-3 text-sm outline-none placeholder:text-gray-400"
                  />

                  <button
                    type="submit"
                    disabled={
                      !commentText.trim()
                    }
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-black text-white disabled:opacity-30"
                  >
                    <Send
                      size={17}
                    />
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

      {/*
       * ========================================================
       * MODAL DE PARTILHA
       * ========================================================
       */}

      {shareOpen &&
        sharePost && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50 px-4 backdrop-blur-sm"
            onClick={closeShare}
          >
            <div
              className="w-full max-w-md rounded-2xl bg-white p-4 shadow-2xl"
              onClick={(
                event,
              ) =>
                event.stopPropagation()
              }
            >
              <div className="mb-3 flex items-center justify-between px-1">
                <h2 className="text-base font-bold text-gray-900">
                  Partilhar
                </h2>

                <button
                  type="button"
                  onClick={closeShare}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100"
                >
                  <X
                    size={18}
                  />
                </button>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={
                    copyLink
                  }
                  className="flex w-full items-center gap-4 rounded-[10px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <Bookmark
                      size={19}
                    />
                  </span>

                  <div>
                    <div className="text-sm font-semibold">
                      Copiar link
                    </div>

                    <div className="text-xs text-gray-500">
                      Copiar o link desta
                      publicação
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={
                    openMedia
                  }
                  className="flex w-full items-center gap-4 rounded-[10px] border border-gray-100 px-4 py-4 text-left transition hover:bg-gray-50"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100">
                    <MapPin
                      size={19}
                    />
                  </span>

                  <div>
                    <div className="text-sm font-semibold">
                      Abrir mídia
                    </div>

                    <div className="text-xs text-gray-500">
                      Abrir a imagem ou
                      vídeo original
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={
                    closeShare
                  }
                  className="mt-2 flex w-full items-center justify-center rounded-[10px] bg-gray-100 px-4 py-4 text-sm font-semibold"
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