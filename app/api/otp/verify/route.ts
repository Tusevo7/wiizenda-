
import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

function normalizePhone(phone: string) {
  return phone
    .trim()
    .replace(/[^\d+]/g, '')
    .replace(/^00/, '+')
}

function hashCode(code: string) {
  return crypto
    .createHash('sha256')
    .update(code)
    .digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const phone = normalizePhone(String(body.phone ?? ''))
    const code = String(body.code ?? '').trim()

    if (!phone || !code) {
      return NextResponse.json(
        {
          success: false,
          message: 'Número e código são obrigatórios.',
        },
        { status: 400 }
      )
    }

    if (!/^\d{6}$/.test(code)) {
      return NextResponse.json(
        {
          success: false,
          message: 'O código deve ter 6 dígitos.',
        },
        { status: 400 }
      )
    }

    const { data: otp, error } = await supabase
      .from('phone_otps')
      .select('*')
      .eq('phone_number', phone)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error || !otp) {
      return NextResponse.json(
        {
          success: false,
          message: 'Código inválido ou expirado.',
        },
        { status: 400 }
      )
    }

    if (new Date(otp.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          success: false,
          message: 'O código expirou. Solicita um novo código.',
        },
        { status: 400 }
      )
    }

    if (otp.attempts >= 5) {
      return NextResponse.json(
        {
          success: false,
          message: 'Número máximo de tentativas atingido.',
        },
        { status: 429 }
      )
    }

    const codeHash = hashCode(code)

    if (codeHash !== otp.code_hash) {
      await supabase
        .from('phone_otps')
        .update({
          attempts: otp.attempts + 1,
        })
        .eq('id', otp.id)

      return NextResponse.json(
        {
          success: false,
          message: 'Código incorreto.',
        },
        { status: 400 }
      )
    }

    await supabase
      .from('phone_otps')
      .update({
        verified: true,
      })
      .eq('id', otp.id)

    return NextResponse.json({
      success: true,
      message: 'Número de telefone verificado.',
      phone,
    })
  } catch (error) {
    console.error('OTP VERIFY ERROR:', error)

    return NextResponse.json(
      {
        success: false,
        message: 'Erro interno ao verificar o código.',
      },
      { status: 500 }
    )
  }
}
