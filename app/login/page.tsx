
'use client'

import {
  ArrowRight,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  MapPin,
  ShieldCheck,
  Sparkles,
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

  const [email, setEmail] = useState('')
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

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

    if (error) {
      setMessageType('error')

      setMessage(
        'E-mail ou palavra-passe incorretos. Verifica os dados e tenta novamente.',
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
      .select(
        'role, full_name',
      )
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error(profileError)

      setMessageType('error')

      setMessage(
        'Não foi possível carregar o perfil da conta.',
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

    /*
     * ADMIN
     */
    if (profile.role === 'admin') {
      router.push('/admin')
      router.refresh()
      return
    }

    /*
     * AGÊNCIA
     */
    if (profile.role === 'agency') {
      router.push('/agency')
      router.refresh()
      return
    }

    /*
     * CLIENTE / VIAJANTE
     */
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
    <main className="min-h-screen bg-[#F7F7F7]">
      <div className="grid min-h-screen lg:grid-cols-2">

        {/* LADO ESQUERDO */}

        <section className="relative hidden overflow-hidden bg-gray-950 lg:flex">
          <div className="absolute inset-0">
            <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-orange-500/20 blur-3xl" />

            <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-orange-600/10 blur-3xl" />
          </div>

          <div className="relative z-10 flex w-full flex-col justify-between p-12 xl:p-16">

            {/* LOGO */}

            <Link
              href="/"
              className="inline-flex w-fit items-center"
            >
              <span className="text-3xl font-black tracking-tight text-white">
                wizenda
              </span>

              <span className="ml-1 h-3 w-3 rounded-full bg-orange-500" />
            </Link>

            <div className="max-w-xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-300">
                <Sparkles
                  size={15}
                  className="text-orange-500"
                />

                Descobre experiências
              </div>

              <h1 className="text-5xl font-black leading-[1.05] tracking-tight text-white xl:text-6xl">
                Viaja.
                <br />
                Descobre.
                <br />

                <span className="text-orange-500">
                  Vive.
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-7 text-gray-400">
                Encontra experiências únicas em Angola,
                reserva com confiança e descobre novos
                lugares através da Wizenda.
              </p>

              <div className="mt-8 space-y-4">
                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                    <MapPin
                      size={17}
                      className="text-orange-500"
                    />
                  </div>

                  Experiências em diferentes destinos
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                    <ShieldCheck
                      size={17}
                      className="text-orange-500"
                    />
                  </div>

                  Agências verificadas
                </div>

                <div className="flex items-center gap-3 text-sm text-gray-300">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/5">
                    <CheckCircle2
                      size={17}
                      className="text-orange-500"
                    />
                  </div>

                  Reservas simples e seguras
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-600">
              © {new Date().getFullYear()} Wizenda.
              Todos os direitos reservados.
            </p>
          </div>
        </section>

        {/* LADO DIREITO */}

        <section className="flex min-h-screen items-center justify-center px-5 py-10 sm:px-8">
          <div className="w-full max-w-md">

            {/* LOGO MOBILE */}

            <Link
              href="/"
              className="mb-10 flex w-fit items-center lg:hidden"
            >
              <span className="text-2xl font-black tracking-tight text-gray-950">
                wizenda
              </span>

              <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
            </Link>

            {/* HEADER */}

            <div>
              <p className="text-sm font-semibold text-orange-500">
                Bem-vindo de volta
              </p>

              <h2 className="mt-2 text-3xl font-black tracking-tight text-gray-950">
                Entra na tua conta
              </h2>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                Acede à tua conta Wizenda para continuar.
              </p>
            </div>

            {/* SELETOR */}

            <div className="mt-8 grid grid-cols-2 rounded-2xl bg-gray-100 p-1.5">
              <button
                type="button"
                onClick={() =>
                  selectMode('traveler')
                }
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === 'traveler'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <UserRound size={17} />

                Cliente
              </button>

              <button
                type="button"
                onClick={() =>
                  selectMode('agency')
                }
                className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition ${
                  mode === 'agency'
                    ? 'bg-white text-gray-950 shadow-sm'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                <Building2 size={17} />

                Agência
              </button>
            </div>

            {/* DESCRIÇÃO DO MODO */}

            <div className="mt-5 rounded-2xl border border-gray-100 bg-white p-4">
              <div className="flex gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-500">
                  {mode === 'traveler' ? (
                    <UserRound size={19} />
                  ) : (
                    <Building2 size={19} />
                  )}
                </div>

                <div>
                  <p className="text-sm font-bold text-gray-950">
                    {mode === 'traveler'
                      ? 'Conta de cliente'
                      : 'Conta de agência'}
                  </p>

                  <p className="mt-1 text-xs leading-5 text-gray-500">
                    {mode === 'traveler'
                      ? 'Pesquisa, reserva e vive experiências na Wizenda.'
                      : 'Gere experiências, reservas e a tua empresa na Wizenda.'}
                  </p>
                </div>
              </div>
            </div>

            {/* FORM */}

            <form
              onSubmit={handleLogin}
              className="mt-6 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-sm font-semibold text-gray-800"
                >
                  E-mail
                </label>

                <input
                  id="email"
                  type="email"
                  placeholder="nome@exemplo.com"
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value,
                    )
                  }
                  autoComplete="email"
                  required
                  className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
                />
              </div>

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
                    className="text-xs font-semibold text-orange-500 transition hover:text-orange-600"
                  >
                    Esqueceste a palavra-passe?
                  </Link>
                </div>

                <div className="relative">
                  <input
                    id="password"
                    type={
                      showPassword
                        ? 'text'
                        : 'password'
                    }
                    placeholder="A tua palavra-passe"
                    value={password}
                    onChange={(event) =>
                      setPassword(
                        event.target.value,
                      )
                    }
                    autoComplete="current-password"
                    required
                    className="h-12 w-full rounded-xl border border-gray-200 bg-white px-12 pr-12 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
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
                    className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                  >
                    {showPassword ? (
                      <EyeOff size={18} />
                    ) : (
                      <Eye size={18} />
                    )}
                  </button>
                </div>
              </div>

              {/* MENSAGEM */}

              {message && (
                <div
                  className={`rounded-xl border p-4 text-sm ${
                    messageType ===
                    'success'
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
                className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading
                  ? 'A entrar...'
                  : mode === 'traveler'
                    ? 'Entrar como cliente'
                    : 'Entrar como agência'}

                {!loading && (
                  <ArrowRight
                    size={17}
                    className="transition-transform group-hover:translate-x-0.5"
                  />
                )}
              </button>
            </form>

            {/* REGISTO */}

            <div className="mt-7 text-center">
              <p className="text-sm text-gray-500">
                Ainda não tens uma conta?
              </p>

              <div className="mt-3 flex flex-col gap-2">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-bold text-gray-800 transition hover:border-gray-300 hover:bg-gray-50"
                >
                  <UserRound size={16} />

                  Criar conta de cliente
                </Link>

                <Link
                  href="/register?type=agency"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-orange-500 transition hover:bg-orange-50"
                >
                  <Building2 size={16} />

                  Registar uma agência
                </Link>
              </div>
            </div>

            {/* SEGURANÇA */}

            <div className="mt-8 flex items-center justify-center gap-2 text-center text-xs text-gray-400">
              <ShieldCheck size={14} />

              Os teus dados são protegidos pela Wizenda.
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
