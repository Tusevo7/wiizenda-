
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  User,
  MapPin,
  Phone,
  Mail,
  Heart,
  Bookmark,
  CalendarCheck,
  Pencil,
  LogOut,
  ArrowLeft,
  Camera,
  Play,
  Image as ImageIcon,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/server'

export default async function ProfilePage() {
  const supabase = await createClient()

  // ============================================================
  // UTILIZADOR AUTENTICADO
  // ============================================================

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    console.error(
      'Erro ao obter utilizador:',
      userError,
    )
  }

  if (!user) {
    redirect('/login')
  }

  console.log(
    'PERFIL - AUTH USER ID:',
    user.id,
  )

  // ============================================================
  // PERFIL
  // ============================================================

  const {
    data: profile,
    error: profileError,
  } = await supabase
    .from('profiles')
    .select(
      'full_name, role, avatar_url, phone, city, traveler_type',
    )
    .eq('id', user.id)
    .single()

  if (profileError) {
    console.error(
      'Erro ao carregar perfil:',
      profileError,
    )
  }

  // ============================================================
  // REDIRECIONAMENTOS
  // ============================================================

  if (profile?.role === 'agency') {
    redirect('/agency/profile')
  }

  if (profile?.role === 'admin') {
    redirect('/admin')
  }

  // ============================================================
  // PUBLICAÇÕES DA COMUNIDADE
  //
  // IMPORTANTE:
  // As publicações vêm diretamente de community_posts.
  //
  // Não criamos uma tabela nova.
  // Não copiamos os posts.
  // Não republicamos nada.
  //
  // Entram automaticamente:
  // - image
  // - video
  // ============================================================

  const {
    data: posts,
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
      created_at,
      updated_at,
      sound_url,
      tagged_type,
      tagged_id
    `)
    .eq('user_id', user.id)
    .in('media_type', ['image', 'video'])
    .order('created_at', {
      ascending: false,
    })

  // ============================================================
  // DEBUG
  // ============================================================

  console.log(
    'PERFIL - POSTS:',
    posts,
  )

  console.log(
    'PERFIL - POSTS ERROR:',
    postsError,
  )

  console.log(
    'PERFIL - QUANTIDADE:',
    posts?.length || 0,
  )

  // ============================================================
  // DADOS DO PERFIL
  // ============================================================

  const displayName =
    profile?.full_name?.trim() ||
    'Viajante Wizenda'

  const initial =
    displayName
      .charAt(0)
      .toUpperCase()

  const publicationsCount =
    posts?.length || 0

  // ============================================================
  // RETURN
  // ============================================================

  return (
    <main className="min-h-screen bg-white">

      {/* ========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/90 backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-5 sm:px-6">

          {/* VOLTAR */}

          <Link
            href="/"
            className="flex items-center gap-3"
          >

            <div
              className="
                flex
                h-9
                w-9
                items-center
                justify-center
                rounded-full
                bg-gray-950
                text-white
              "
            >
              <ArrowLeft size={17} />
            </div>

            <span className="hidden text-sm font-bold text-gray-700 sm:block">
              Voltar
            </span>

          </Link>

          {/* TÍTULO */}

          <h1 className="text-base font-black tracking-tight text-gray-950">
            Perfil
          </h1>

          {/* EDITAR */}

          <Link
            href="/profile/edit"
            aria-label="Editar perfil"
            className="
              flex
              h-9
              w-9
              items-center
              justify-center
              rounded-full
              text-gray-700
              transition
              hover:bg-gray-100
            "
          >
            <Pencil size={18} />
          </Link>

        </div>

      </header>

      {/* ========================================================
          CONTEÚDO
      ========================================================= */}

      <div className="mx-auto max-w-5xl px-5 pb-16 pt-7 sm:px-6 sm:pt-10">

        {/* ======================================================
            PERFIL
        ======================================================= */}

        <section>

          <div className="flex items-start gap-5 sm:gap-10">

            {/* ==================================================
                AVATAR
            =================================================== */}

            <div className="relative shrink-0">

              <div
                className="
                  h-24
                  w-24
                  overflow-hidden
                  rounded-full
                  bg-gradient-to-br
                  from-orange-400
                  via-orange-500
                  to-pink-500
                  p-[3px]
                  sm:h-32
                  sm:w-32
                "
              >

                <div
                  className="
                    flex
                    h-full
                    w-full
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    border-2
                    border-white
                    bg-orange-100
                    text-3xl
                    font-black
                    text-orange-600
                    sm:text-4xl
                  "
                >

                  {profile?.avatar_url ? (

                    <img
                      src={profile.avatar_url}
                      alt={displayName}
                      className="
                        h-full
                        w-full
                        object-cover
                      "
                    />

                  ) : (

                    initial

                  )}

                </div>

              </div>

              {/* CÂMERA */}

              <Link
                href="/profile/edit"
                aria-label="Alterar foto"
                className="
                  absolute
                  bottom-0
                  right-0
                  flex
                  h-8
                  w-8
                  items-center
                  justify-center
                  rounded-full
                  border-2
                  border-white
                  bg-orange-500
                  text-white
                  shadow-sm
                "
              >

                <Camera size={14} />

              </Link>

            </div>

            {/* ==================================================
                DADOS
            =================================================== */}

            <div className="min-w-0 flex-1">

              <div
                className="
                  flex
                  flex-col
                  gap-3
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                "
              >

                <div className="min-w-0">

                  <h2
                    className="
                      truncate
                      text-xl
                      font-black
                      tracking-tight
                      text-gray-950
                      sm:text-2xl
                    "
                  >
                    {displayName}
                  </h2>

                  <p className="mt-1 truncate text-sm text-gray-500">
                    @{createUsername(displayName)}
                  </p>

                </div>

                {/* BOTÃO DESKTOP */}

                <Link
                  href="/profile/edit"
                  className="
                    hidden
                    items-center
                    justify-center
                    rounded-xl
                    border
                    border-gray-200
                    px-5
                    py-2.5
                    text-sm
                    font-bold
                    text-gray-800
                    transition
                    hover:bg-gray-50
                    sm:flex
                  "
                >
                  Editar perfil
                </Link>

              </div>

              {/* ==================================================
                  ESTATÍSTICAS
              =================================================== */}

              <div className="mt-5 flex items-center gap-6 sm:gap-10">

                <ProfileStat
                  value={publicationsCount}
                  label="publicações"
                />

              </div>

              {/* ==================================================
                  TIPO DE VIAJANTE
              =================================================== */}

              {profile?.traveler_type && (

                <div className="mt-4">

                  <span
                    className="
                      inline-flex
                      rounded-full
                      bg-orange-50
                      px-3
                      py-1.5
                      text-xs
                      font-bold
                      text-orange-600
                    "
                  >
                    {profile.traveler_type}
                  </span>

                </div>

              )}

              {/* ==================================================
                  CIDADE
              =================================================== */}

              {profile?.city && (

                <div className="mt-3 flex items-center gap-1.5 text-sm text-gray-500">

                  <MapPin size={14} />

                  <span>
                    {profile.city}
                  </span>

                </div>

              )}

            </div>

          </div>

          {/* ====================================================
              BOTÃO MOBILE
          ===================================================== */}

          <Link
            href="/profile/edit"
            className="
              mt-5
              flex
              w-full
              items-center
              justify-center
              rounded-xl
              border
              border-gray-200
              py-2.5
              text-sm
              font-bold
              text-gray-800
              transition
              hover:bg-gray-50
              sm:hidden
            "
          >
            Editar perfil
          </Link>

        </section>

        {/* ======================================================
            INFORMAÇÕES
        ======================================================= */}

        <section className="mt-8 border-t border-gray-100 pt-6">

          <div className="mb-4 flex items-center justify-between">

            <div>

              <h2 className="text-base font-black text-gray-950">
                Informações
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Os teus dados na Wizenda
              </p>

            </div>

            <Link
              href="/profile/edit"
              className="text-xs font-bold text-orange-500"
            >
              Editar
            </Link>

          </div>

          <div className="grid gap-3 sm:grid-cols-2">

            {/* EMAIL */}

            <InfoItem
              icon={<Mail size={17} />}
              label="Email"
              value={
                user.email ||
                'Não informado'
              }
            />

            {/* TELEFONE */}

            <InfoItem
              icon={<Phone size={17} />}
              label="Telefone"
              value={
                profile?.phone ||
                'Não informado'
              }
            />

            {/* CIDADE */}

            <InfoItem
              icon={<MapPin size={17} />}
              label="Cidade"
              value={
                profile?.city ||
                'Não informada'
              }
            />

            {/* VIAJANTE */}

            <InfoItem
              icon={<User size={17} />}
              label="Viajante"
              value={
                profile?.traveler_type ||
                'Não definido'
              }
            />

          </div>

        </section>

        {/* ======================================================
            ATALHOS
        ======================================================= */}

        <section className="mt-8">

          <div className="grid grid-cols-3 gap-2 sm:gap-3">

            <ProfileAction
              href="/bookings"
              icon={
                <CalendarCheck size={19} />
              }
              label="Reservas"
            />

            <ProfileAction
              href="/favorites"
              icon={
                <Heart size={19} />
              }
              label="Favoritos"
            />

            <ProfileAction
              href="/review/saved"
              icon={
                <Bookmark
                  size={19}
                  fill="currentColor"
                />
              }
              label="Guardados"
            />

          </div>

        </section>

        {/* ======================================================
            PUBLICAÇÕES
        ======================================================= */}

        <section className="mt-10">

          {/* CABEÇALHO */}

          <div
            className="
              flex
              items-center
              justify-between
              border-b
              border-gray-100
              pb-4
            "
          >

            <div>

              <h2 className="text-lg font-black text-gray-950">
                Publicações
              </h2>

              <p className="mt-1 text-xs text-gray-500">
                Fotos e vídeos partilhados na comunidade.
              </p>

            </div>

            <div
              className="
                flex
                items-center
                gap-1.5
                text-sm
                font-bold
                text-gray-400
              "
            >

              <ImageIcon size={16} />

              {publicationsCount}

            </div>

          </div>

          {/* ====================================================
              ERRO NA CONSULTA
          ===================================================== */}

          {postsError ? (

            <div
              className="
                mt-5
                rounded-3xl
                border
                border-red-100
                bg-red-50
                px-6
                py-10
                text-center
              "
            >

              <h3 className="text-base font-black text-red-700">
                Não foi possível carregar as publicações
              </h3>

              <p className="mt-2 text-sm text-red-600">
                Verifica a ligação com a tabela community_posts.
              </p>

              <p className="mt-4 break-all text-xs text-red-400">
                {postsError.message}
              </p>

            </div>

          ) : publicationsCount === 0 ? (

            /* ==================================================
               SEM PUBLICAÇÕES
            =================================================== */

            <div
              className="
                mt-5
                flex
                flex-col
                items-center
                justify-center
                rounded-3xl
                border
                border-dashed
                border-gray-200
                px-6
                py-16
                text-center
              "
            >

              <div
                className="
                  flex
                  h-16
                  w-16
                  items-center
                  justify-center
                  rounded-full
                  bg-orange-50
                  text-orange-500
                "
              >
                <Camera size={27} />
              </div>

              <h3 className="mt-5 text-base font-black text-gray-950">
                Ainda não tens publicações
              </h3>

              <p className="mt-2 max-w-sm text-sm leading-6 text-gray-500">
                As fotos e vídeos que partilhares na comunidade aparecerão aqui automaticamente.
              </p>

              <Link
                href="/review"
                className="
                  mt-5
                  rounded-xl
                  bg-gray-950
                  px-5
                  py-2.5
                  text-sm
                  font-bold
                  text-white
                  transition
                  hover:bg-gray-800
                "
              >
                Ir para a comunidade
              </Link>

            </div>

          ) : (

            /* ==================================================
               GRELHA ESTILO INSTAGRAM
            =================================================== */

            <div
              className="
                mt-5
                grid
                grid-cols-3
                gap-1
                sm:gap-2
              "
            >

              {posts.map((post) => {

                const isVideo =
                  post.media_type === 'video'

                /*
                 * A publicação já existe em community_posts.
                 *
                 * Não criamos cópia e não republicamos o conteúdo.
                 * O ID abre diretamente a página existente
                 * app/review/[id]/page.tsx.
                 */

                const postUrl =
                  `/review/${encodeURIComponent(post.id)}`

                return (

                  <Link
                    key={post.id}
                    href={postUrl}
                    className="
                      group
                      relative
                      aspect-[4/5]
                      overflow-hidden
                      bg-gray-100
                    "
                  >

                    {/* ==================================================
                        MEDIA
                    =================================================== */}

                    {isVideo ? (

                      <video
                        src={post.media_url}
                        muted
                        playsInline
                        preload="metadata"
                        className="
                          pointer-events-none
                          h-full
                          w-full
                          object-cover
                          transition
                          duration-500
                          group-hover:scale-105
                        "
                      />

                    ) : (

                      <img
                        src={post.media_url}
                        alt={
                          post.caption ||
                          'Publicação da comunidade'
                        }
                        loading="lazy"
                        className="
                          pointer-events-none
                          h-full
                          w-full
                          object-cover
                          transition
                          duration-500
                          group-hover:scale-105
                        "
                      />

                    )}

                    {/* ==================================================
                        GRADIENTE
                    =================================================== */}

                    <div
                      className="
                        pointer-events-none
                        absolute
                        inset-0
                        bg-gradient-to-t
                        from-black/70
                        via-transparent
                        to-transparent
                        opacity-70
                      "
                    />

                    {/* ==================================================
                        ÍCONE DE VÍDEO
                    =================================================== */}

                    {isVideo && (

                      <div
                        className="
                          pointer-events-none
                          absolute
                          right-2
                          top-2
                          flex
                          h-8
                          w-8
                          items-center
                          justify-center
                          rounded-full
                          bg-black/60
                          text-white
                          backdrop-blur-sm
                        "
                      >

                        <Play
                          size={14}
                          fill="currentColor"
                        />

                      </div>

                    )}

                    {/* ==================================================
                        LOCALIZAÇÃO
                    =================================================== */}

                    {post.location && (

                      <div
                        className="
                          pointer-events-none
                          absolute
                          bottom-0
                          left-0
                          right-0
                          p-2.5
                          text-white
                        "
                      >

                        <div className="flex items-center gap-1">

                          <MapPin size={11} />

                          <span className="line-clamp-1 text-[10px] font-semibold">
                            {post.location}
                          </span>

                        </div>

                      </div>

                    )}

                  </Link>

                )
              })}

            </div>

          )}

        </section>

        {/* ======================================================
            CONTA
        ======================================================= */}

        <section className="mt-10 border-t border-gray-100 pt-6">

          <form
            action="/auth/signout"
            method="post"
          >

            <button
              type="submit"
              className="
                flex
                w-full
                items-center
                gap-3
                rounded-2xl
                px-4
                py-3
                text-left
                text-sm
                font-bold
                text-red-500
                transition
                hover:bg-red-50
              "
            >

              <LogOut size={18} />

              Terminar sessão

            </button>

          </form>

        </section>

      </div>

    </main>
  )
}

/* ============================================================
   ESTATÍSTICA
============================================================ */

function ProfileStat({
  value,
  label,
}: {
  value: string | number
  label: string
}) {
  return (
    <div className="min-w-0">

      <p className="text-lg font-black text-gray-950">
        {value}
      </p>

      <p className="mt-0.5 text-xs text-gray-500">
        {label}
      </p>

    </div>
  )
}

/* ============================================================
   INFO ITEM
============================================================ */

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div
      className="
        flex
        min-w-0
        items-center
        gap-3
        rounded-2xl
        bg-gray-50
        p-4
      "
    >

      <div
        className="
          flex
          h-9
          w-9
          shrink-0
          items-center
          justify-center
          rounded-xl
          bg-orange-50
          text-orange-500
        "
      >
        {icon}
      </div>

      <div className="min-w-0">

        <p
          className="
            text-[10px]
            font-black
            uppercase
            tracking-wider
            text-gray-400
          "
        >
          {label}
        </p>

        <p
          className="
            mt-1
            truncate
            text-sm
            font-semibold
            text-gray-800
          "
        >
          {value}
        </p>

      </div>

    </div>
  )
}

/* ============================================================
   PROFILE ACTION
============================================================ */

function ProfileAction({
  href,
  icon,
  label,
}: {
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link
      href={href}
      className="
        flex
        flex-col
        items-center
        justify-center
        gap-2
        rounded-2xl
        border
        border-gray-100
        bg-white
        px-3
        py-4
        shadow-sm
        transition
        hover:-translate-y-0.5
        hover:border-orange-100
        hover:shadow-md
      "
    >

      <div
        className="
          flex
          h-10
          w-10
          items-center
          justify-center
          rounded-xl
          bg-orange-50
          text-orange-500
        "
      >
        {icon}
      </div>

      <span className="text-xs font-bold text-gray-700">
        {label}
      </span>

    </Link>
  )
}

/* ============================================================
   USERNAME
============================================================ */

function createUsername(
  name: string,
) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(
      /[\u0300-\u036f]/g,
      '',
    )
    .replace(
      /[^a-z0-9]+/g,
      '',
    )
    .slice(0, 20)
}