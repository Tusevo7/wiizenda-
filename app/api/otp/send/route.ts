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

// Normaliza o número para o padrão de Angola: 244XXXXXXXXX
function normalizePhone(phone: string) {
  let cleaned = phone.replace(/\D/g, '')

  if (cleaned.length === 9 && cleaned.startsWith('9')) {
    cleaned = `244${cleaned}`
  }

  return cleaned
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

    if (phone.length < 9) {
      return NextResponse.json(
        { error: 'Número de telefone inválido.' },
        { status: 400 },
      )
    }

    // =========================
    // VERIFICAR ÚLTIMO OTP
    // =========================

    const { data: recentOtp } = await supabaseAdmin
      .from('otp_verifications')
      .select('created_at')
      .eq('phone', phone)
      .eq('purpose', 'signup')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (recentOtp?.created_at) {
      const elapsed = Date.now() - new Date(recentOtp.created_at).getTime()

      if (elapsed < 60_000) {
        return NextResponse.json(
          {
            error: 'Aguarda 60 segundos antes de solicitar outro código.',
          },
          { status: 429 },
        )
      }
    }

    // =========================
    // GERAR OTP
    // =========================

    const code = crypto.randomInt(100000, 1000000).toString()
    const codeHash = hashOtp(code)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()

    // =========================
    // GUARDAR OTP
    // =========================

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
      console.error('Erro ao guardar OTP no Supabase:', insertError)
      return NextResponse.json(
        { error: 'Não foi possível criar o código.' },
        { status: 500 },
      )
    }

    // =========================
    // TELCOSMS CONFIGS
    // =========================

    const apiKey = process.env.TELCOSMS_API_KEY_APP

    if (!apiKey) {
      console.error('TELCOSMS_API_KEY_APP não configurada.')
      return NextResponse.json(
        { error: 'Chave da Telcosms não configurada no servidor.' },
        { status: 500 },
      )
    }

    const message =
      `Wizenda: o teu código de confirmação é ${code}. ` +
      `Expira em 5 minutos. Não partilhes este código.`

    console.log('Enviando SMS via TelcoSMS para:', phone)

    // =========================
    // CHAMAR TELCOSMS (COM TIMEOUT)
    // =========================

    let telcosmsResponse: Response | null = null
    const TIMEOUT_MS = process.env.NODE_ENV === 'development' ? 3000 : 5000

    try {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS)

      telcosmsResponse = await fetch(
        'https://telcosms.co.ao/api/v2/send_message',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'User-Agent': 'WizendaApp/1.0',
          },
          body: JSON.stringify({
            message: {
              api_key_app: apiKey,
              phone_number: phone,
              message_body: message,
            },
          }),
          signal: controller.signal,
        },
      )
      clearTimeout(timeoutId)
    } catch (error) {
      console.error('Falha de conexão/timeout com Telcosms:', error)

      // Em ambiente local (dev), permite continuar o teste exibindo o código
      if (process.env.NODE_ENV === 'development') {
        console.log('\n================================================--')
        console.log(`[MODO DEV] FALHA DE REDE OU TIMEOUT COM A TELCOSMS`)
        console.log(`[MODO DEV] CÓDIGO OTP PARA TESTAR NO BROWSER: ${code}`)
        console.log('================================================--\n')

        return NextResponse.json({
          success: true,
          message: 'Modo Dev: Código gerado no terminal (timeout de rede com SMS).',
        })
      }

      return NextResponse.json(
        { error: 'Serviço de SMS temporariamente indisponível.' },
        { status: 502 },
      )
    }

    // =========================
    // LER E TRATAR RESPOSTA
    // =========================

    const responseText = await telcosmsResponse.text()

    console.log('================ TELCOSMS LOG ================')
    console.log('HTTP Status:', telcosmsResponse.status)
    console.log('Resposta Body:', responseText)
    console.log('==============================================')

    let telcosmsData: { status?: number | string; message?: string } | null = null

    try {
      telcosmsData = JSON.parse(responseText)
    } catch {
      telcosmsData = null
    }

    if (
      !telcosmsResponse.ok ||
      (telcosmsData?.status &&
        telcosmsData.status !== 200 &&
        telcosmsData.status !== '200')
    ) {
      console.error('Telcosms rejeitou o SMS:', telcosmsData)

      // Em ambiente local (dev), permite passar mesmo se a TelcoSMS rejeitar (ex: erro 401 unapproved)
      if (process.env.NODE_ENV === 'development') {
        console.log('\n================================================--')
        console.log(`[MODO DEV] REJEIÇÃO DA TELCOSMS: ${telcosmsData?.message}`)
        console.log(`[MODO DEV] CÓDIGO OTP PARA TESTAR NO BROWSER: ${code}`)
        console.log('================================================--\n')

        return NextResponse.json({
          success: true,
          message: 'Modo Dev: Código gerado no terminal (SMS rejeitado).',
        })
      }

      return NextResponse.json(
        {
          error:
            telcosmsData?.message ||
            'A Telcosms rejeitou o envio do SMS.',
        },
        { status: 502 },
      )
    }

    // =========================
    // SUCESSO EM PRODUÇÃO
    // =========================

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