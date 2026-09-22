
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import crypto from 'crypto'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

function normalizePhone(phone: string) {
  return phone.trim().replace(/[()\s-]/g, '')
}

function hashOtp(code: string) {
  return crypto
    .createHash('sha256')
    .update(`${code}:${process.env.OTP_HASH_SECRET}`)
    .digest('hex')
}

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const rawPhone = String(body.phone ?? '')
    const phone = normalizePhone(rawPhone)

    if (!phone) {
      return NextResponse.json(
        { error: 'Número de telefone obrigatório.' },
        { status: 400 },
      )
    }

    if (phone.length < 7) {
      return NextResponse.json(
        { error: 'Número de telefone inválido.' },
        { status: 400 },
      )
    }

    // Evita pedidos repetidos demasiado rápidos.
    const { data: recentOtp } = await supabaseAdmin
      .from('otp_verifications')
      .select('created_at')
      .eq('phone', phone)
      .eq('purpose', 'signup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentOtp?.created_at) {
      const elapsed =
        Date.now() - new Date(recentOtp.created_at).getTime()

      if (elapsed < 60_000) {
        return NextResponse.json(
          {
            error:
              'Aguarda 60 segundos antes de solicitar outro código.',
          },
          { status: 429 },
        )
      }
    }

    // Gera código de 6 dígitos.
    const code = crypto.randomInt(100000, 1000000).toString()

    const codeHash = hashOtp(code)

    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000,
    ).toISOString()

    // Guarda apenas o hash do OTP.
    const { error: insertError } = await supabaseAdmin
      .from('otp_verifications')
      .insert({
        phone,
        purpose: 'signup',
        code_hash: codeHash,
        expires_at: expiresAt,
        attempts: 0,
      })

    if (insertError) {
      console.error('Erro ao guardar OTP:', insertError)

      return NextResponse.json(
        { error: 'Não foi possível criar o código.' },
        { status: 500 },
      )
    }

    const apiKey = process.env.TELCOSMS_API_KEY_APP

    if (!apiKey) {
      console.error('TELCOSMS_API_KEY_APP não configurada.')

      return NextResponse.json(
        { error: 'Serviço de SMS não configurado.' },
        { status: 500 },
      )
    }

    const message = `Wizenda: o teu código de confirmação é ${code}. Expira em 5 minutos. Não partilhes este código.`

    const telcosmsResponse = await fetch(
      'https://www.telcosms.co.ao/api/v2/send_message',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: {
            api_key_app: apiKey,
            phone_number: phone,
            message_body: message,
          },
        }),
      },
    )

    if (!telcosmsResponse.ok) {
      const responseText = await telcosmsResponse.text()

      console.error(
        'Telcosms recusou o envio:',
        telcosmsResponse.status,
        responseText,
      )

      return NextResponse.json(
        {
          error:
            'Não foi possível enviar o SMS. Verifica a configuração da Telcosms.',
        },
        { status: 502 },
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Código enviado por SMS.',
    })
  } catch (error) {
    console.error('Erro no envio do OTP:', error)

    return NextResponse.json(
      { error: 'Erro interno ao enviar o código.' },
      { status: 500 },
    )
  }
}
