
import type { Metadata } from 'next'

type Props = {
  children: React.ReactNode
  params: Promise<{
    id: string
  }>
}

type Post = {
  id: string
  media_url: string | null
  media_type: 'image' | 'video'
  caption: string | null
  location: string | null
  user_id: string
}

type Profile = {
  full_name: string | null
}

type Agency = {
  name: string | null
}

async function getPost(id: string) {
  const baseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  const publishableKey =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

  console.log('METADATA ID:', id)
  console.log('SUPABASE URL:', baseUrl)

  if (!baseUrl || !publishableKey) {
    console.error(
      'Supabase URL ou Publishable Key não encontrada.',
    )

    return null
  }

  const postResponse = await fetch(
    `${baseUrl}/rest/v1/community_posts?id=eq.${encodeURIComponent(
      id,
    )}&select=id,media_url,media_type,caption,location,user_id`,
    {
      headers: {
        apikey: publishableKey,
        Authorization: `Bearer ${publishableKey}`,
      },
      next: {
        revalidate: 60,
      },
    },
  )

  console.log(
    'POST RESPONSE STATUS:',
    postResponse.status,
  )

  console.log(
    'POST RESPONSE OK:',
    postResponse.ok,
  )

  if (!postResponse.ok) {
    const errorText =
      await postResponse.text()

    console.error(
      'POST RESPONSE ERROR:',
      errorText,
    )

    return null
  }

  const posts =
    (await postResponse.json()) as Post[]

  console.log(
    'POSTS ENCONTRADOS:',
    posts.length,
  )

  console.log(
    'POST DATA:',
    posts[0],
  )

  if (!posts.length) {
    console.error(
      'Nenhuma publicação encontrada para o ID:',
      id,
    )

    return null
  }

  const post = posts[0]

  const [
    profileResponse,
    agencyResponse,
  ] = await Promise.all([
    fetch(
      `${baseUrl}/rest/v1/profiles?id=eq.${encodeURIComponent(
        post.user_id,
      )}&select=full_name`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        next: {
          revalidate: 60,
        },
      },
    ),

    fetch(
      `${baseUrl}/rest/v1/agencies?owner_id=eq.${encodeURIComponent(
        post.user_id,
      )}&select=name`,
      {
        headers: {
          apikey: publishableKey,
          Authorization: `Bearer ${publishableKey}`,
        },
        next: {
          revalidate: 60,
        },
      },
    ),
  ])

  console.log(
    'PROFILE STATUS:',
    profileResponse.status,
  )

  console.log(
    'AGENCY STATUS:',
    agencyResponse.status,
  )

  const profiles =
    profileResponse.ok
      ? ((await profileResponse.json()) as Profile[])
      : []

  const agencies =
    agencyResponse.ok
      ? ((await agencyResponse.json()) as Agency[])
      : []

  console.log(
    'PROFILE:',
    profiles[0],
  )

  console.log(
    'AGENCY:',
    agencies[0],
  )

  return {
    post,
    profile: profiles[0] ?? null,
    agency: agencies[0] ?? null,
  }
}

export async function generateMetadata(
  { params }: Props,
): Promise<Metadata> {
  const { id } = await params

  const result = await getPost(id)

  if (!result) {
    console.log(
      'METADATA FALLBACK ATIVADO',
    )

    return {
      title: 'Publicação | Wizenda',
      description:
        'Descobre experiências incríveis em Angola na Wizenda.',
    }
  }

  const {
    post,
    profile,
    agency,
  } = result

  const author =
    agency?.name ||
    profile?.full_name ||
    'Wizenda'

  const title =
    post.caption?.trim()
      ? `${post.caption} | Wizenda`
      : `${author} | Wizenda`

  const description = [
    post.caption,
    post.location
      ? `📍 ${post.location}`
      : null,
    `Publicado por ${author}.`,
  ]
    .filter(Boolean)
    .join(' ')

  const image =
    post.media_url ||
    undefined

  console.log(
    'METADATA GERADA:',
    {
      title,
      description,
      image,
    },
  )

  return {
    title,
    description,

    openGraph: {
      title,
      description,
      type: 'article',
      siteName: 'Wizenda',
      locale: 'pt_PT',

      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt:
                post.caption ||
                `Publicação de ${author}`,
            },
          ]
        : [],
    },

    twitter: {
      card: 'summary_large_image',
      title,
      description,

      images: image
        ? [image]
        : [],
    },
  }
}

export default function ReviewPostLayout({
  children,
}: Props) {
  return children
}
