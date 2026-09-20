import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado.' },
        { status: 401 },
      )
    }

    /*
     * IMPORTANTE:
     * Apenas clientes podem iniciar uma conversa.
     * Uma agência nunca deve ser o user_id de conversations.
     */
    const { data: ownedAgency, error: ownerError } = await supabase
      .from('agencies')
      .select('id')
      .eq('owner_id', user.id)
      .maybeSingle()

    if (ownerError) {
      console.error(ownerError)

      return NextResponse.json(
        { error: 'Erro ao verificar o perfil.' },
        { status: 500 },
      )
    }

    if (ownedAgency) {
      return NextResponse.json(
        {
          error:
            'As agências não podem iniciar conversas como clientes.',
        },
        { status: 403 },
      )
    }

    const body = await request.json()

    const {
      agency_id,
      experience_id,
    } = body

    if (!agency_id) {
      return NextResponse.json(
        { error: 'Agência não informada.' },
        { status: 400 },
      )
    }

    // Verificar se a agência existe e está aprovada
    const { data: agency, error: agencyError } =
      await supabase
        .from('agencies')
        .select('id, name, status')
        .eq('id', agency_id)
        .eq('status', 'approved')
        .maybeSingle()

    if (agencyError) {
      console.error(agencyError)

      return NextResponse.json(
        { error: 'Erro ao verificar a agência.' },
        { status: 500 },
      )
    }

    if (!agency) {
      return NextResponse.json(
        { error: 'Agência não encontrada.' },
        { status: 404 },
      )
    }

    // Procurar conversa existente
    let query = supabase
      .from('conversations')
      .select('id')
      .eq('user_id', user.id)
      .eq('agency_id', agency_id)

    if (experience_id) {
      query = query.eq('experience_id', experience_id)
    } else {
      query = query.is('experience_id', null)
    }

    const {
      data: existingConversation,
      error: searchError,
    } = await query.maybeSingle()

    if (searchError) {
      console.error(searchError)

      return NextResponse.json(
        { error: 'Erro ao procurar conversa.' },
        { status: 500 },
      )
    }

    // Se já existe, reutilizar
    if (existingConversation) {
      return NextResponse.json({
        conversation_id: existingConversation.id,
        existing: true,
      })
    }

    // Criar nova conversa
    const {
      data: conversation,
      error: createError,
    } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        agency_id,
        experience_id: experience_id || null,
      })
      .select('id')
      .single()

    if (createError) {
      console.error(createError)

      return NextResponse.json(
        { error: 'Não foi possível criar a conversa.' },
        { status: 500 },
      )
    }

    return NextResponse.json({
      conversation_id: conversation.id,
      existing: false,
    })
  } catch (error) {
    console.error(error)

    return NextResponse.json(
      { error: 'Erro interno do servidor.' },
      { status: 500 },
    )
  }
}