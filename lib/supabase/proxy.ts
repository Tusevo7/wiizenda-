import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(
  request: NextRequest,
) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },

        setAll(cookiesToSet) {
          cookiesToSet.forEach(
            ({ name, value, options }) => {
              request.cookies.set(name, value)

              supabaseResponse.cookies.set(
                name,
                value,
                options,
              )
            },
          )
        },
      },
    },
  )

  const pathname = request.nextUrl.pathname

  const publicRoutes = [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ]

  const isPublicRoute =
    publicRoutes.some(
      (route) =>
        pathname === route ||
        pathname.startsWith(`${route}/`),
    )

  if (!isPublicRoute) {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      const url = request.nextUrl.clone()

      url.pathname = '/login'

      url.searchParams.set(
        'redirectTo',
        pathname,
      )

      return NextResponse.redirect(url)
    }
  }

  return supabaseResponse
}