import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(
  request: Request,
  context: {
    params: Promise<{ id: string }>
  },
) {
  const { id } = await context.params

  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.redirect(
      new URL('/login', request.url),
    )
  }

  const { data: agency } = await supabase
    .from('agencies')
    .select('id')
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!agency) {
    return NextResponse.redirect(
      new URL('/agency', request.url),
    )
  }

  const { error } = await supabase
    .from('bookings')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('agency_id', agency.id)
    .eq('status', 'pending')

  if (error) {
    console.error(error)
  }

  return NextResponse.redirect(
    new URL('/agency/bookings', request.url),
  )
}