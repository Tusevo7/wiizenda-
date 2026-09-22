
'use client'

import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  Loader2,
  MapPin,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { FormEvent, ReactNode, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

type RegisterMode = 'traveler' | 'agency'
type RegisterStep = 'form' | 'otp' | 'success'

type DocumentType =
  | 'responsible_id'
  | 'company_document'
  | 'nif'
  | 'license'
  | 'proof_of_address'

export default function RegisterPage() {
  const [mode, setMode] =
    useState<RegisterMode>('traveler')

  const [step, setStep] =
    useState<RegisterStep>('form')

  // Cliente
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [travelerType, setTravelerType] = useState('')

  // Agência
  const [commercialName, setCommercialName] = useState('')
  const [legalName, setLegalName] = useState('')
  const [nif, setNif] = useState('')
  const [responsibleName, setResponsibleName] = useState('')
  const [agencyPhone, setAgencyPhone] = useState('')
  const [agencyEmail, setAgencyEmail] = useState('')
  const [province, setProvince] = useState('')
  const [agencyCity, setAgencyCity] = useState('')
  const [address, setAddress] = useState('')

  // Documentos
  const [responsibleDocument, setResponsibleDocument] =
    useState<File | null>(null)

  const [companyDocument, setCompanyDocument] =
    useState<File | null>(null)

  const [nifDocument, setNifDocument] =
    useState<File | null>(null)

  const [licenseDocument, setLicenseDocument] =
    useState<File | null>(null)

  const [proofOfAddress, setProofOfAddress] =
    useState<File | null>(null)

  // Segurança
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  // OTP
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)

  const [registrationPhone, setRegistrationPhone] =
    useState('')

  const [loading, setLoading] = useState(false)
  const [resending, setResending] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] =
    useState<'error' | 'success'>('error')

  function selectMode(selectedMode: RegisterMode) {
    if (step !== 'form' || loading) return

    setMode(selectedMode)
    setMessage('')
  }

  function validatePassword() {
    if (password.length < 6) {
      return 'A palavra-passe deve ter pelo menos 6 caracteres.'
    }

    if (password !== confirmPassword) {
      return 'As palavras-passe não coincidem.'
    }

    return null
  }

  function validateDocuments() {
    if (!responsibleDocument) {
      return 'Anexa o BI ou documento do responsável.'
    }

    if (!companyDocument) {
      return 'Anexa o documento da empresa.'
    }

    if (!nifDocument) {
      return 'Anexa o documento do NIF.'
    }

    if (!licenseDocument) {
      return 'Anexa o alvará ou licença.'
    }

    if (!proofOfAddress) {
      return 'Anexa o comprovativo de morada.'
    }

    const files = [
      responsibleDocument,
      companyDocument,
      nifDocument,
      licenseDocument,
      proofOfAddress,
    ]

    for (const file of files) {
      if (file.size > 10 * 1024 * 1024) {
        return `O documento "${file.name}" ultrapassa o limite de 10 MB.`
      }
    }

    return null
  }

  async function sendOtp() {
    const phoneNumber =
      mode === 'agency'
        ? agencyPhone.trim()
        : phone.trim()

    if (!phoneNumber) {
      setMessageType('error')
      setMessage('Introduz o teu número de telefone.')
      return false
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/otp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: phoneNumber,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setMessageType('error')
        setMessage(
          result.message ||
            'Não foi possível enviar o código por SMS.',
        )

        setLoading(false)
        return false
      }

      setRegistrationPhone(phoneNumber)
      setOtp('')
      setOtpSent(true)
      setStep('otp')

      setMessageType('success')
      setMessage(
        'Enviámos um código de verificação por SMS.',
      )

      setLoading(false)

      return true
    } catch (error) {
      console.error('Erro ao enviar OTP:', error)

      setMessageType('error')
      setMessage(
        'Não foi possível enviar o código. Tenta novamente.',
      )

      setLoading(false)

      return false
    }
  }

  async function handleRegister(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setMessage('')

    const passwordError =
      validatePassword()

    if (passwordError) {
      setMessageType('error')
      setMessage(passwordError)
      return
    }

    if (mode === 'agency') {
      const documentError =
        validateDocuments()

      if (documentError) {
        setMessageType('error')
        setMessage(documentError)
        return
      }
    }

    const accountEmail =
      mode === 'agency'
        ? agencyEmail.trim()
        : email.trim()

    if (!accountEmail) {
      setMessageType('error')
      setMessage('Introduz um e-mail válido.')
      return
    }

    // Primeiro verificamos o telefone.
    await sendOtp()
  }

  async function handleVerifyOtp(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanOtp =
      otp.replace(/\D/g, '')

    if (cleanOtp.length !== 6) {
      setMessageType('error')
      setMessage(
        'Introduz o código de 6 dígitos recebido por SMS.',
      )
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const response = await fetch('/api/otp/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: registrationPhone,
          code: cleanOtp,
        }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        setMessageType('error')
        setMessage(
          result.message ||
            'O código está incorreto ou expirou.',
        )

        setLoading(false)
        return
      }

      setOtpVerified(true)

      await createAccount()
    } catch (error) {
      console.error(
        'Erro ao verificar OTP:',
        error,
      )

      setMessageType('error')
      setMessage(
        'Não foi possível verificar o código.',
      )

      setLoading(false)
    }
  }

  async function createAccount() {
    try {
      const supabase = createClient()

      const accountEmail =
        mode === 'agency'
          ? agencyEmail.trim()
          : email.trim()

      const registrationName =
        mode === 'agency'
          ? responsibleName.trim()
          : fullName.trim()

      const { data, error } =
        await supabase.auth.signUp({
          email: accountEmail,
          password,
          options: {
            data: {
              registration_type: mode,

              full_name:
                registrationName,

              phone:
                registrationPhone,

              city:
                mode === 'agency'
                  ? agencyCity.trim()
                  : city.trim(),

              traveler_type:
                mode === 'traveler'
                  ? travelerType
                  : null,

              commercial_name:
                mode === 'agency'
                  ? commercialName.trim()
                  : null,

              legal_name:
                mode === 'agency'
                  ? legalName.trim()
                  : null,

              nif:
                mode === 'agency'
                  ? nif.trim()
                  : null,

              responsible_name:
                mode === 'agency'
                  ? responsibleName.trim()
                  : null,

              province:
                mode === 'agency'
                  ? province.trim()
                  : null,

              address:
                mode === 'agency'
                  ? address.trim()
                  : null,
            },
          },
        })

      if (error) {
        console.error(
          'Erro ao criar conta:',
          error,
        )

        setMessageType('error')
        setMessage(
          translateAuthError(error.message),
        )

        setLoading(false)
        return
      }

      if (!data.user) {
        setMessageType('error')
        setMessage(
          'Não foi possível criar a conta.',
        )

        setLoading(false)
        return
      }

      /*
       * O OTP da TelcoSMS já confirmou
       * o telefone.
       *
       * Agora concluímos o registo.
       */
      await finishRegistration(
        data.user.id,
      )
    } catch (error) {
      console.error(
        'Erro inesperado ao criar conta:',
        error,
      )

      setMessageType('error')
      setMessage(
        'Ocorreu um erro inesperado. Tenta novamente.',
      )

      setLoading(false)
    }
  }

  async function finishRegistration(
    userId: string,
  ) {
    const supabase = createClient()

    /*
     * CLIENTE
     */
    if (mode === 'traveler') {
      const { error } =
        await supabase
          .from('profiles')
          .update({
            full_name:
              fullName.trim(),

            phone:
              registrationPhone.trim(),

            city:
              city.trim(),

            traveler_type:
              travelerType || null,

            role:
              'traveler',
          })
          .eq('id', userId)

      if (error) {
        console.error(
          'Erro no perfil:',
          error,
        )

        setMessageType('error')
        setMessage(
          'A conta foi criada, mas não foi possível concluir o perfil.',
        )

        setLoading(false)
        return
      }

      setMessageType('success')
      setMessage(
        'Conta criada e telefone confirmado com sucesso.',
      )

      setStep('success')
      setLoading(false)

      return
    }

    /*
     * AGÊNCIA
     */

    const { error: profileError } =
      await supabase
        .from('profiles')
        .update({
          full_name:
            responsibleName.trim(),

          phone:
            registrationPhone.trim(),

          city:
            agencyCity.trim(),

          role:
            'agency',
        })
        .eq('id', userId)

    if (profileError) {
      console.error(
        'Erro no perfil da agência:',
        profileError,
      )

      setMessageType('error')
      setMessage(
        'A conta foi criada, mas não foi possível concluir o perfil da agência.',
      )

      setLoading(false)
      return
    }

    /*
     * SLUG
     */
    const slugBase =
      commercialName
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(
          /[\u0300-\u036f]/g,
          '',
        )
        .replace(
          /[^a-z0-9]+/g,
          '-',
        )
        .replace(
          /^-+|-+$/g,
          '',
        )

    const slug =
      `${slugBase}-${Date.now()}`

    /*
     * CRIAR AGÊNCIA
     */
    const {
      data: agency,
      error: agencyError,
    } = await supabase
      .from('agencies')
      .insert({
        owner_id:
          userId,

        name:
          commercialName.trim(),

        slug,

        legal_name:
          legalName.trim(),

        nif:
          nif.trim(),

        responsible_name:
          responsibleName.trim(),

        phone:
          registrationPhone.trim(),

        email:
          agencyEmail.trim(),

        province:
          province.trim(),

        city:
          agencyCity.trim(),

        address:
          address.trim(),

        status:
          'pending',

        verification_status:
          'pending',

        is_verified:
          false,
      })
      .select('id')
      .single()

    if (agencyError || !agency) {
      console.error(
        'Erro ao criar agência:',
        agencyError,
      )

      setMessageType('error')
      setMessage(
        'A conta foi criada, mas não foi possível criar o registo da agência.',
      )

      setLoading(false)
      return
    }

    /*
     * DOCUMENTOS
     */
    const documents: Array<{
      file: File
      type: DocumentType
    }> = [
      {
        file:
          responsibleDocument as File,
        type:
          'responsible_id',
      },
      {
        file:
          companyDocument as File,
        type:
          'company_document',
      },
      {
        file:
          nifDocument as File,
        type:
          'nif',
      },
      {
        file:
          licenseDocument as File,
        type:
          'license',
      },
      {
        file:
          proofOfAddress as File,
        type:
          'proof_of_address',
      },
    ]

    for (const document of documents) {
      const safeFileName =
        document.file.name
          .toLowerCase()
          .replace(
            /[^a-z0-9._-]/g,
            '-',
          )

      const filePath =
        `${agency.id}/${document.type}/${Date.now()}-${safeFileName}`

      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'agency-documents',
          )
          .upload(
            filePath,
            document.file,
            {
              upsert:
                false,
            },
          )

      if (uploadError) {
        console.error(
          'Erro no upload:',
          uploadError,
        )

        setMessageType('error')
        setMessage(
          `A conta foi criada, mas não foi possível enviar "${document.file.name}".`,
        )

        setLoading(false)
        return
      }

      const {
        error: documentError,
      } =
        await supabase
          .from(
            'agency_documents',
          )
          .insert({
            agency_id:
              agency.id,

            document_type:
              document.type,

            file_name:
              document.file.name,

            file_path:
              filePath,

            status:
              'pending',

            uploaded_by:
              userId,
          })

      if (documentError) {
        console.error(
          'Erro ao registar documento:',
          documentError,
        )

        setMessageType('error')
        setMessage(
          'Um documento foi enviado, mas não foi possível registá-lo para análise.',
        )

        setLoading(false)
        return
      }
    }

    /*
     * NOTIFICAÇÃO
     */
    await supabase
      .from('notifications')
      .insert({
        user_id:
          userId,

        type:
          'agency_verification',

        title:
          'Registo recebido',

        message:
          'Recebemos o registo da tua agência. A equipa Wizenda irá analisar os documentos.',

        read:
          false,
      })

    setMessageType('success')
    setMessage(
      'Conta criada! A tua agência está agora em análise pela equipa Wizenda.',
    )

    setStep('success')
    setLoading(false)
  }

  async function resendOtp() {
    if (!registrationPhone) return

    setResending(true)
    setMessage('')

    try {
      const response =
        await fetch('/api/otp/send', {
          method: 'POST',
          headers: {
            'Content-Type':
              'application/json',
          },
          body: JSON.stringify({
            phone:
              registrationPhone,
          }),
        })

      const result =
        await response.json()

      if (!response.ok || !result.success) {
        setMessageType('error')
        setMessage(
          result.message ||
            'Não foi possível reenviar o código.',
        )

        setResending(false)
        return
      }

      setOtp('')

      setMessageType('success')
      setMessage(
        'Novo código enviado por SMS.',
      )
    } catch (error) {
      console.error(
        'Erro ao reenviar OTP:',
        error,
      )

      setMessageType('error')
      setMessage(
        'Não foi possível reenviar o código.',
      )
    }

    setResending(false)
  }

  function backToForm() {
    setStep('form')
    setOtp('')
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-white">
      <div className="grid min-h-screen lg:grid-cols-[minmax(420px,0.9fr)_minmax(600px,1.1fr)]">

        {/* =====================================================
            IMAGEM / HERO
        ====================================================== */}

        <section className="relative min-h-[330px] overflow-hidden lg:sticky lg:top-0 lg:h-screen">

          {/* Imagem Kalandula */}
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1800&q=85')",
            }}
          />

          {/* Overlay branco suave — sem preto */}
          <div className="absolute inset-0 bg-white/10" />

          {/* Gradiente inferior claro */}
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-white/70 via-white/20 to-transparent" />

          <div className="relative z-10 flex h-full min-h-[330px] flex-col justify-between p-6 sm:p-8 lg:p-12 xl:p-14">

            <Link
              href="/"
              className="flex w-fit items-center"
            >
              <span className="text-3xl font-black tracking-tight text-gray-950 drop-shadow-sm">
                wizenda
              </span>

              <span className="ml-1 h-3 w-3 rounded-full bg-orange-500" />
            </Link>

            <div className="max-w-xl">

              <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/85 px-4 py-2 text-xs font-bold text-gray-800 shadow-sm backdrop-blur">
                <Sparkles
                  size={15}
                  className="text-orange-500"
                />

                Descobre Angola
              </div>

              <h1 className="max-w-xl text-4xl font-black leading-[1.02] tracking-tight text-gray-950 sm:text-5xl xl:text-6xl">
                O teu próximo
                <br />
                destino começa
                <br />
                <span className="text-orange-500">
                  aqui.
                </span>
              </h1>

              <p className="mt-5 max-w-lg text-sm font-medium leading-6 text-gray-700 sm:text-base">
                Descobre experiências únicas,
                lugares incríveis e momentos
                que ficam para sempre.
              </p>

              <div className="mt-7 hidden space-y-3 sm:block">

                <HeroFeature
                  icon={
                    <MapPin size={16} />
                  }
                  text="Descobre novos destinos"
                />

                <HeroFeature
                  icon={
                    <ShieldCheck size={16} />
                  }
                  text="Agências verificadas"
                />

                <HeroFeature
                  icon={
                    <CheckCircle2 size={16} />
                  }
                  text="Reservas simples e seguras"
                />

              </div>

            </div>

            <p className="hidden text-xs font-medium text-gray-600 lg:block">
              © {new Date().getFullYear()} Wizenda
            </p>

          </div>
        </section>

        {/* =====================================================
            FORMULÁRIO
        ====================================================== */}

        <section className="flex min-h-screen items-start justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-12 xl:px-20">

          <div className="w-full max-w-2xl">

            {/* Logo mobile */}
            <Link
              href="/"
              className="mb-7 flex w-fit items-center lg:hidden"
            >
              <span className="text-2xl font-black tracking-tight text-gray-950">
                wizenda
              </span>

              <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
            </Link>

            {/* Cabeçalho */}
            <div>

              <p className="text-sm font-bold text-orange-500">
                {step === 'otp'
                  ? 'Verificação por SMS'
                  : step === 'success'
                    ? 'Tudo pronto'
                    : 'Criar conta'}
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950 sm:text-4xl">

                {step === 'otp'
                  ? 'Confirma o teu telefone'
                  : step === 'success'
                    ? 'Conta criada'
                    : 'Junta-te à Wizenda'}

              </h2>

              <p className="mt-2 max-w-xl text-sm leading-6 text-gray-500">

                {step === 'otp'
                  ? `Introduz o código de 6 dígitos enviado para ${registrationPhone}.`
                  : step === 'success'
                    ? mode === 'agency'
                      ? 'O teu registo foi enviado para análise.'
                      : 'A tua conta está pronta para começar.'
                    : 'Cria a tua conta para começar a explorar experiências.'}

              </p>

            </div>

            {/* =================================================
                OTP
            ================================================== */}

            {step === 'otp' && (
              <div className="mt-8">

                <form
                  onSubmit={
                    handleVerifyOtp
                  }
                  className="space-y-5"
                >

                  <div className="rounded-3xl border border-gray-100 bg-white p-6 shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:p-8">

                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-orange-500">
                      <ShieldCheck size={28} />
                    </div>

                    <div className="mt-5 text-center">

                      <h3 className="text-lg font-black text-gray-950">
                        Código de segurança
                      </h3>

                      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500">
                        Enviámos um código de
                        verificação para o teu
                        número de telefone.
                      </p>

                    </div>

                    <input
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      autoFocus
                      onChange={(e) =>
                        setOtp(
                          e.target.value
                            .replace(
                              /\D/g,
                              '',
                            )
                            .slice(
                              0,
                              6,
                            ),
                        )
                      }
                      className="mt-7 h-16 w-full rounded-2xl border border-gray-200 bg-gray-50 text-center text-3xl font-black tracking-[0.45em] text-gray-950 outline-none transition focus:border-orange-500 focus:bg-white focus:ring-4 focus:ring-orange-50"
                    />

                  </div>

                  {message && (
                    <MessageBox
                      type={messageType}
                      message={message}
                    />
                  )}

                  <button
                    type="submit"
                    disabled={
                      loading ||
                      otp.length !== 6
                    }
                    className="flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    {loading ? (
                      <>
                        <Loader2
                          size={18}
                          className="animate-spin"
                        />

                        A verificar...
                      </>
                    ) : (
                      <>
                        Confirmar telefone

                        <ArrowRight size={18} />
                      </>
                    )}

                  </button>

                </form>

                <div className="mt-6 flex flex-col items-center gap-4 text-center">

                  <button
                    type="button"
                    onClick={
                      resendOtp
                    }
                    disabled={
                      resending
                    }
                    className="text-sm font-black text-orange-500 transition hover:text-orange-600 disabled:opacity-50"
                  >
                    {resending
                      ? 'A reenviar...'
                      : 'Reenviar código'}
                  </button>

                  <button
                    type="button"
                    onClick={
                      backToForm
                    }
                    className="inline-flex items-center gap-2 text-sm font-semibold text-gray-500 transition hover:text-gray-900"
                  >

                    <ArrowLeft size={15} />

                    Voltar ao registo

                  </button>

                </div>

              </div>
            )}

            {/* =================================================
                SUCESSO
            ================================================== */}

            {step === 'success' && (
              <div className="mt-8">

                <div className="rounded-3xl border border-green-100 bg-white p-7 text-center shadow-[0_10px_40px_rgba(0,0,0,0.05)] sm:p-9">

                  <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-50 text-green-600">
                    <CheckCircle2 size={38} />
                  </div>

                  <h3 className="mt-6 text-2xl font-black text-gray-950">
                    {mode === 'agency'
                      ? 'Registo enviado'
                      : 'Conta criada com sucesso'}
                  </h3>

                  <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-gray-500">
                    {mode === 'agency'
                      ? 'Os teus documentos foram recebidos. A agência ficará em análise até a equipa Wizenda concluir a verificação.'
                      : 'O teu telefone foi confirmado e a tua conta está pronta para começar.'}
                  </p>

                  {mode === 'agency' && (
                    <div className="mt-6 rounded-2xl bg-orange-50 p-4 text-left">

                      <div className="flex gap-3">

                        <ShieldCheck
                          size={19}
                          className="mt-0.5 shrink-0 text-orange-500"
                        />

                        <p className="text-xs leading-5 text-gray-600">
                          A confirmação do telefone
                          não significa aprovação da
                          agência. A equipa Wizenda
                          irá analisar os documentos
                          enviados.
                        </p>

                      </div>

                    </div>
                  )}

                  <Link
                    href="/login"
                    className="mt-7 flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600"
                  >
                    Entrar na Wizenda

                    <ArrowRight size={18} />
                  </Link>

                </div>

              </div>
            )}

            {/* =================================================
                FORMULÁRIO
            ================================================== */}

            {step === 'form' && (
              <>

                {/* Seletor */}
                <div className="mt-8 grid grid-cols-2 rounded-2xl bg-gray-100 p-1.5">

                  <button
                    type="button"
                    onClick={() =>
                      selectMode(
                        'traveler',
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      mode === 'traveler'
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >

                    <UserRound size={17} />

                    Viajante

                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      selectMode(
                        'agency',
                      )
                    }
                    className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition ${
                      mode === 'agency'
                        ? 'bg-white text-gray-950 shadow-sm'
                        : 'text-gray-500 hover:text-gray-800'
                    }`}
                  >

                    <Building2 size={17} />

                    Agência

                  </button>

                </div>

                {/* =================================================
                    VIAJANTE
                ================================================== */}

                {mode === 'traveler' && (
                  <form
                    onSubmit={
                      handleRegister
                    }
                    className="mt-7 space-y-5"
                  >

                    <FormCard
                      icon={
                        <UserRound size={19} />
                      }
                      title="Conta de viajante"
                      description="Para descobrir e reservar experiências."
                    >

                      <div className="grid gap-5 sm:grid-cols-2">

                        <Input
                          label="Nome completo"
                          placeholder="O teu nome"
                          value={
                            fullName
                          }
                          onChange={
                            setFullName
                          }
                          required
                        />

                        <Input
                          label="E-mail"
                          type="email"
                          placeholder="nome@exemplo.com"
                          value={
                            email
                          }
                          onChange={
                            setEmail
                          }
                          required
                        />

                        <Input
                          label="Telefone"
                          type="tel"
                          inputMode="tel"
                          placeholder="+244 923 123 456"
                          value={
                            phone
                          }
                          onChange={
                            setPhone
                          }
                          required
                        />

                        <Input
                          label="Cidade"
                          placeholder="Ex.: Luanda"
                          value={
                            city
                          }
                          onChange={
                            setCity
                          }
                          required
                        />

                      </div>

                      <div className="mt-5">

                        <label className="mb-2 block text-sm font-bold text-gray-800">
                          Que tipo de viajante és?
                        </label>

                        <select
                          value={
                            travelerType
                          }
                          onChange={(e) =>
                            setTravelerType(
                              e.target.value,
                            )
                          }
                          required
                          className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-700 outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                        >

                          <option value="">
                            Seleciona uma opção
                          </option>

                          <option value="turista">
                            Turista
                          </option>

                          <option value="aventureiro">
                            Aventureiro
                          </option>

                          <option value="familia">
                            Viagem em família
                          </option>

                          <option value="negocios">
                            Viagem de negócios
                          </option>

                          <option value="casal">
                            Viagem a dois
                          </option>

                        </select>

                      </div>

                    </FormCard>

                    <PasswordFields
                      password={
                        password
                      }
                      confirmPassword={
                        confirmPassword
                      }
                      showPassword={
                        showPassword
                      }
                      showConfirmPassword={
                        showConfirmPassword
                      }
                      setPassword={
                        setPassword
                      }
                      setConfirmPassword={
                        setConfirmPassword
                      }
                      setShowPassword={
                        setShowPassword
                      }
                      setShowConfirmPassword={
                        setShowConfirmPassword
                      }
                    />

                    {message && (
                      <MessageBox
                        type={
                          messageType
                        }
                        message={
                          message
                        }
                      />
                    )}

                    <SubmitButton
                      loading={
                        loading
                      }
                      text="Continuar e verificar telefone"
                    />

                  </form>
                )}

                {/* =================================================
                    AGÊNCIA
                ================================================== */}

                {mode === 'agency' && (
                  <form
                    onSubmit={
                      handleRegister
                    }
                    className="mt-7 space-y-5"
                  >

                    <div className="rounded-2xl border border-orange-100 bg-orange-50/70 p-5">

                      <div className="flex gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white">
                          <Building2 size={19} />
                        </div>

                        <div>

                          <p className="text-sm font-black text-gray-950">
                            Registo de agência
                          </p>

                          <p className="mt-1 text-xs leading-5 text-gray-600">
                            Verifica o telefone e
                            envia os documentos
                            necessários para análise.
                          </p>

                        </div>

                      </div>

                    </div>

                    <FormCard
                      title="Dados da empresa"
                    >

                      <div className="grid gap-5 sm:grid-cols-2">

                        <Input
                          label="Nome comercial"
                          placeholder="Nome da agência"
                          value={
                            commercialName
                          }
                          onChange={
                            setCommercialName
                          }
                          required
                        />

                        <Input
                          label="Razão social"
                          placeholder="Nome legal da empresa"
                          value={
                            legalName
                          }
                          onChange={
                            setLegalName
                          }
                          required
                        />

                        <Input
                          label="NIF"
                          placeholder="Número de identificação fiscal"
                          value={
                            nif
                          }
                          onChange={
                            setNif
                          }
                          required
                        />

                        <Input
                          label="Pessoa responsável"
                          placeholder="Nome do responsável"
                          value={
                            responsibleName
                          }
                          onChange={
                            setResponsibleName
                          }
                          required
                        />

                        <Input
                          label="Telefone"
                          type="tel"
                          inputMode="tel"
                          placeholder="+244 923 123 456"
                          value={
                            agencyPhone
                          }
                          onChange={
                            setAgencyPhone
                          }
                          required
                        />

                        <Input
                          label="E-mail empresarial"
                          type="email"
                          placeholder="empresa@exemplo.com"
                          value={
                            agencyEmail
                          }
                          onChange={
                            setAgencyEmail
                          }
                          required
                        />

                      </div>

                    </FormCard>

                    <FormCard title="Localização">

                      <div className="grid gap-5 sm:grid-cols-2">

                        <Input
                          label="Província"
                          placeholder="Ex.: Luanda"
                          value={
                            province
                          }
                          onChange={
                            setProvince
                          }
                          required
                        />

                        <Input
                          label="Cidade"
                          placeholder="Cidade"
                          value={
                            agencyCity
                          }
                          onChange={
                            setAgencyCity
                          }
                          required
                        />

                      </div>

                      <div className="mt-5">

                        <Input
                          label="Morada"
                          placeholder="Morada da empresa"
                          value={
                            address
                          }
                          onChange={
                            setAddress
                          }
                          required
                        />

                      </div>

                    </FormCard>

                    <FormCard
                      icon={
                        <FileText size={19} />
                      }
                      title="Documentos de verificação"
                      description="Os documentos são armazenados de forma privada."
                    >

                      <div className="space-y-4">

                        <DocumentInput
                          label="BI / documento do responsável"
                          file={
                            responsibleDocument
                          }
                          onChange={
                            setResponsibleDocument
                          }
                        />

                        <DocumentInput
                          label="Documento da empresa"
                          file={
                            companyDocument
                          }
                          onChange={
                            setCompanyDocument
                          }
                        />

                        <DocumentInput
                          label="Documento do NIF"
                          file={
                            nifDocument
                          }
                          onChange={
                            setNifDocument
                          }
                        />

                        <DocumentInput
                          label="Alvará / licença"
                          file={
                            licenseDocument
                          }
                          onChange={
                            setLicenseDocument
                          }
                        />

                        <DocumentInput
                          label="Comprovativo de morada"
                          file={
                            proofOfAddress
                          }
                          onChange={
                            setProofOfAddress
                          }
                        />

                      </div>

                    </FormCard>

                    <PasswordFields
                      password={
                        password
                      }
                      confirmPassword={
                        confirmPassword
                      }
                      showPassword={
                        showPassword
                      }
                      showConfirmPassword={
                        showConfirmPassword
                      }
                      setPassword={
                        setPassword
                      }
                      setConfirmPassword={
                        setConfirmPassword
                      }
                      setShowPassword={
                        setShowPassword
                      }
                      setShowConfirmPassword={
                        setShowConfirmPassword
                      }
                    />

                    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4">

                      <div className="flex gap-3">

                        <ShieldCheck
                          size={18}
                          className="mt-0.5 shrink-0 text-orange-500"
                        />

                        <p className="text-xs leading-5 text-gray-500">
                          Primeiro confirmamos o
                          telefone por SMS. Depois,
                          a equipa Wizenda analisa
                          os documentos da agência.
                        </p>

                      </div>

                    </div>

                    {message && (
                      <MessageBox
                        type={
                          messageType
                        }
                        message={
                          message
                        }
                      />
                    )}

                    <SubmitButton
                      loading={
                        loading
                      }
                      text="Continuar e verificar telefone"
                    />

                  </form>
                )}

              </>
            )}

            <div className="mt-8 pb-6 text-center">

              <p className="text-sm text-gray-500">
                Já tens uma conta?
              </p>

              <Link
                href="/login"
                className="mt-2 inline-flex items-center gap-2 text-sm font-black text-orange-500 transition hover:text-orange-600"
              >
                Entrar na minha conta

                <ArrowRight size={15} />

              </Link>

            </div>

          </div>
        </section>
      </div>
    </main>
  )
}

/* ============================================================
   COMPONENTES
============================================================ */

function HeroFeature({
  icon,
  text,
}: {
  icon: ReactNode
  text: string
}) {
  return (
    <div className="flex items-center gap-3 text-sm font-semibold text-gray-800">

      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-orange-500 shadow-sm backdrop-blur">
        {icon}
      </div>

      {text}

    </div>
  )
}

function FormCard({
  icon,
  title,
  description,
  children,
}: {
  icon?: ReactNode
  title: string
  description?: string
  children: ReactNode
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-6">

      <div className="flex items-center gap-3">

        {icon && (
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
            {icon}
          </div>
        )}

        <div>

          <h3 className="text-base font-black text-gray-950">
            {title}
          </h3>

          {description && (
            <p className="mt-1 text-xs leading-5 text-gray-500">
              {description}
            </p>
          )}

        </div>

      </div>

      <div className="mt-5">
        {children}
      </div>

    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  inputMode,
  required = false,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
  type?: string
  inputMode?:
    | 'text'
    | 'tel'
    | 'email'
    | 'numeric'
  required?: boolean
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <input
        type={type}
        inputMode={inputMode}
        placeholder={placeholder}
        value={value}
        onChange={(e) =>
          onChange(
            e.target.value,
          )
        }
        required={required}
        className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 hover:border-gray-300 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
      />

    </div>
  )
}

function PasswordFields({
  password,
  confirmPassword,
  showPassword,
  showConfirmPassword,
  setPassword,
  setConfirmPassword,
  setShowPassword,
  setShowConfirmPassword,
}: {
  password: string
  confirmPassword: string
  showPassword: boolean
  showConfirmPassword: boolean
  setPassword: (value: string) => void
  setConfirmPassword: (value: string) => void
  setShowPassword: (
    value: boolean,
  ) => void
  setShowConfirmPassword: (
    value: boolean,
  ) => void
}) {
  return (
    <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.035)] sm:p-6">

      <h3 className="text-base font-black text-gray-950">
        Segurança da conta
      </h3>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">

        <div>

          <label className="mb-2 block text-sm font-bold text-gray-800">
            Palavra-passe
          </label>

          <div className="relative">

            <input
              type={
                showPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value,
                )
              }
              required
              minLength={6}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword,
                )
              }
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={
                showPassword
                  ? 'Ocultar palavra-passe'
                  : 'Mostrar palavra-passe'
              }
            >

              {showPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}

            </button>

          </div>

        </div>

        <div>

          <label className="mb-2 block text-sm font-bold text-gray-800">
            Confirmar palavra-passe
          </label>

          <div className="relative">

            <input
              type={
                showConfirmPassword
                  ? 'text'
                  : 'password'
              }
              placeholder="Repete a palavra-passe"
              value={
                confirmPassword
              }
              onChange={(e) =>
                setConfirmPassword(
                  e.target.value,
                )
              }
              required
              minLength={6}
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm outline-none transition focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmPassword(
                  !showConfirmPassword,
                )
              }
              className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
              aria-label={
                showConfirmPassword
                  ? 'Ocultar confirmação'
                  : 'Mostrar confirmação'
              }
            >

              {showConfirmPassword ? (
                <EyeOff size={18} />
              ) : (
                <Eye size={18} />
              )}

            </button>

          </div>

        </div>

      </div>

    </div>
  )
}

function DocumentInput({
  label,
  file,
  onChange,
}: {
  label: string
  file: File | null
  onChange: (
    file: File | null,
  ) => void
}) {
  return (
    <div>

      <label className="mb-2 block text-sm font-bold text-gray-800">
        {label}
      </label>

      <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 transition hover:border-orange-400 hover:bg-orange-50/50">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-gray-500 shadow-sm">
          <FileText size={17} />
        </div>

        <div className="min-w-0 flex-1">

          <p className="truncate text-sm font-semibold text-gray-700">
            {file
              ? file.name
              : 'Selecionar documento'}
          </p>

          <p className="text-xs text-gray-400">
            PDF, JPG ou PNG · máximo 10 MB
          </p>

        </div>

        <input
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={(e) =>
            onChange(
              e.target.files?.[0] ||
                null,
            )
          }
        />

      </label>

    </div>
  )
}

function SubmitButton({
  loading,
  text,
}: {
  loading: boolean
  text: string
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group flex h-13 w-full items-center justify-center gap-2 rounded-2xl bg-orange-500 px-5 text-sm font-black text-white shadow-lg shadow-orange-500/20 transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
    >

      {loading ? (
        <>
          <Loader2
            size={18}
            className="animate-spin"
          />

          A processar...
        </>
      ) : (
        <>
          {text}

          <ArrowRight
            size={18}
            className="transition-transform group-hover:translate-x-0.5"
          />
        </>
      )}

    </button>
  )
}

function MessageBox({
  type,
  message,
}: {
  type: 'error' | 'success'
  message: string
}) {
  return (
    <div
      className={`rounded-2xl border p-4 text-sm font-medium ${
        type === 'success'
          ? 'border-green-100 bg-green-50 text-green-700'
          : 'border-red-100 bg-red-50 text-red-700'
      }`}
    >
      {message}
    </div>
  )
}

function translateAuthError(
  error: string,
) {
  const value =
    error.toLowerCase()

  if (
    value.includes(
      'already registered',
    )
  ) {
    return 'Este e-mail já está registado. Tenta entrar na tua conta.'
  }

  if (
    value.includes('password') &&
    value.includes('weak')
  ) {
    return 'A palavra-passe é demasiado fraca.'
  }

  if (
    value.includes('rate limit')
  ) {
    return 'Foram feitas muitas tentativas. Aguarda alguns minutos e tenta novamente.'
  }

  if (
    value.includes(
      'invalid email',
    )
  ) {
    return 'Introduz um e-mail válido.'
  }

  return 'Não foi possível criar a conta. Verifica os dados e tenta novamente.'
}
