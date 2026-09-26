'use client'

import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
  Lock,
  Phone,
  ShieldCheck,
  UserRound,
} from 'lucide-react'
import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type LoginMode = 'traveler' | 'agency'

export default function LoginPage() {
  const router = useRouter()

  const [mode, setMode] =
    useState<LoginMode>('traveler')

  const [identifier, setIdentifier] =
    useState('')

  const [password, setPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)

  const [loading, setLoading] =
    useState(false)

  const [message, setMessage] =
    useState('')

  const [messageType, setMessageType] =
    useState<'error' | 'success'>('error')

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const value = identifier.trim()

    const isEmail = value.includes('@')

    const { data, error } =
      await supabase.auth.signInWithPassword(
        isEmail
          ? {
              email: value,
              password,
            }
          : {
              phone: value,
              password,
            },
      )

    if (error) {
      setMessageType('error')
      setMessage(
        'Número de telefone/e-mail ou palavra-passe incorretos.',
      )
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      setMessageType('error')
      setMessage(
        'Não foi possível identificar a tua conta.',
      )
      setLoading(false)
      return
    }

    const {
      data: profile,
      error: profileError,
    } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error(profileError)

      setMessageType('error')
      setMessage(
        'Não foi possível carregar o perfil.',
      )
      setLoading(false)
      return
    }

    if (!profile) {
      setMessageType('error')
      setMessage(
        'Perfil da conta não encontrado.',
      )
      setLoading(false)
      return
    }

    if (profile.role === 'admin') {
      router.push('/admin')
      router.refresh()
      return
    }

    if (profile.role === 'agency') {
      router.push('/agency')
      router.refresh()
      return
    }

    router.push('/')
    router.refresh()
  }

  function selectMode(
    selectedMode: LoginMode,
  ) {
    setMode(selectedMode)
    setMessage('')
  }

  return (
    <main className="min-h-screen bg-white">

      {/* =====================================================
          HERO / IMAGEM
      ====================================================== */}
      <section className="relative h-[42vh] min-h-[310px] overflow-hidden">

        {/* IMAGEM */}
        <img
          src="/image1.jpg"
          alt="Paisagem de Angola"
          className="absolute inset-0 h-full w-full object-cover"
        />

        {/* OVERLAY */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#063B46]/65 via-[#063B46]/75 to-[#062F38]/95" />

        {/* CONTEÚDO */}
        <div className="relative z-10 flex h-full flex-col justify-between px-6 pb-16 pt-8">

          {/* LOGO */}
          <Link
            href="/"
            className="flex w-fit items-center"
          >
            <span className="text-2xl font-black tracking-tight text-white">
              wizenda
            </span>

            <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
          </Link>

          {/* TEXTO */}
          <div className="max-w-md">

            <p className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-orange-400">
              Descobre Angola 🇦🇴
            </p>

            <h1 className="text-4xl font-black tracking-tight text-white">
              Bem Vindo
            </h1>

            <p className="mt-3 max-w-sm text-sm leading-6 text-white/80">
              Descubra lugares, culturas e experiências num só app
            </p>

          </div>

        </div>
      </section>


      {/* =====================================================
          FORMULÁRIO
      ====================================================== */}
      <section className="relative z-20 -mt-8 rounded-t-[32px] bg-white px-6 pb-10 pt-7">

        <div className="mx-auto max-w-md">

          {/* TÍTULO */}
          <div>
            <h2 className="text-2xl font-black tracking-tight text-orange-500">
              Acesse a sua conta
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Entre para continuar a sua experiência.
            </p>
          </div>


          

          {/* =================================================
              FORM
          ================================================== */}
          <form
            onSubmit={handleLogin}
            className="mt-5 space-y-4"
          >

            {/* TELEFONE / EMAIL */}
            <div>

              <label
                htmlFor="identifier"
                className="mb-2 block text-sm font-semibold text-gray-800"
              >
                Número de Telefone
              </label>

              <div
                className="
                  flex h-14 items-center gap-3
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-4
                  transition
                  focus-within:border-orange-500
                  focus-within:ring-4
                  focus-within:ring-orange-50
                "
              >

                <Phone
                  size={19}
                  className="shrink-0 text-gray-400"
                />

                <input
                  id="identifier"
                  type="text"
                  inputMode="tel"
                  placeholder="Número de Telefone"
                  value={identifier}
                  onChange={(event) =>
                    setIdentifier(
                      event.target.value,
                    )
                  }
                  autoComplete="tel"
                  required
                  className="
                    h-full min-w-0 flex-1
                    bg-transparent
                    text-sm text-gray-950
                    outline-none
                    placeholder:text-gray-400
                  "
                />

              </div>

            </div>


            {/* PASSWORD */}
            <div>

              <div className="mb-2 flex items-center justify-between">

                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-gray-800"
                >
                  Palavra-passe
                </label>

                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Esqueceu a Senha?
                </Link>

              </div>

              <div
                className="
                  relative flex h-14
                  items-center
                  rounded-xl
                  border border-gray-200
                  bg-white
                  px-4
                  transition
                  focus-within:border-orange-500
                  focus-within:ring-4
                  focus-within:ring-orange-50
                "
              >

                <Lock
                  size={19}
                  className="mr-3 shrink-0 text-gray-400"
                />

                <input
                  id="password"
                  type={
                    showPassword
                      ? 'text'
                      : 'password'
                  }
                  placeholder="Palavra-passe"
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value,
                    )
                  }
                  autoComplete="current-password"
                  required
                  className="
                    h-full min-w-0 flex-1
                    bg-transparent
                    pr-10
                    text-sm text-gray-950
                    outline-none
                    placeholder:text-gray-400
                  "
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPassword(
                      !showPassword,
                    )
                  }
                  aria-label={
                    showPassword
                      ? 'Ocultar palavra-passe'
                      : 'Mostrar palavra-passe'
                  }
                  className="
                    absolute right-3
                    flex h-8 w-8
                    items-center justify-center
                    rounded-lg
                    text-gray-400
                    transition
                    hover:bg-gray-50
                  "
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>

              </div>

            </div>


            {/* MESSAGE */}
            {message && (
              <div
                className={`rounded-xl border p-3 text-sm ${
                  messageType === 'success'
                    ? 'border-green-100 bg-green-50 text-green-700'
                    : 'border-red-100 bg-red-50 text-red-700'
                }`}
              >
                {message}
              </div>
            )}


            {/* BOTÃO */}
            <button
              type="submit"
              disabled={loading}
              className="
                group
                flex h-14 w-full
                items-center justify-center
                gap-2
                rounded-xl
                bg-orange-500
                px-5
                text-sm font-bold
                text-white
                shadow-sm
                transition
                hover:bg-orange-600
                active:scale-[0.99]
                disabled:cursor-not-allowed
                disabled:opacity-60
              "
            >
              {loading
                ? 'A entrar...'
                : mode === 'traveler'
                  ? 'Entrar'
                  : 'Entrar como agência'}

              {!loading && (
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-0.5"
                />
              )}
            </button>

          </form>


          {/* =================================================
              REGISTO
          ================================================== */}
          <div className="mt-6 text-center">

            <p className="text-sm text-gray-500">
              Ainda não tem uma conta?
            </p>

            <div className="mt-3 flex items-center justify-center gap-1 text-sm">

              <span className="text-gray-500">
                Crie agora
              </span>

              <Link
                href="/register"
                className="font-bold text-blue-600 hover:text-blue-700"
              >
                Criar conta
              </Link>

            </div>

          </div>




          {/* =================================================
              SEGURANÇA
          ================================================== */}
          <div
            className="
              mt-7
              flex
              items-center
              justify-center
              gap-1.5
              text-center
              text-[11px]
              text-gray-400
            "
          >
            <ShieldCheck size={14} />
            Dados protegidos pela Wizenda
          </div>

        </div>

      </section>

    </main>
  )
}
