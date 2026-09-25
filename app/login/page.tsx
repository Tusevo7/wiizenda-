
'use client'

import {
  ArrowRight,
  Building2,
  Eye,
  EyeOff,
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
        'E-mail ou palavra-passe incorretos.',
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
    <main className="min-h-screen bg-[#F7F7F7]">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-5 py-7 sm:px-8">

        {/* LOGO */}

        <Link
          href="/"
          className="flex w-fit items-center"
        >
          <span className="text-2xl font-black tracking-tight text-gray-950">
            wizenda
          </span>

          <span className="ml-1 h-2.5 w-2.5 rounded-full bg-orange-500" />
        </Link>

        {/* HEADER */}

        <div className="mt-12">
          <p className="text-sm font-semibold text-orange-500">
            Bem-vindo de volta
          </p>

          <h1 className="mt-1 text-3xl font-black tracking-tight text-gray-950">
            Entra na tua conta
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            Acede à Wizenda para continuar.
          </p>
        </div>

        {/* SELETOR */}

        <div className="mt-7 grid grid-cols-2 rounded-2xl bg-gray-100 p-1">
          <button
            type="button"
            onClick={() =>
              selectMode('traveler')
            }
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              mode === 'traveler'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500'
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
            className={`flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition ${
              mode === 'agency'
                ? 'bg-white text-gray-950 shadow-sm'
                : 'text-gray-500'
            }`}
          >
            <Building2 size={17} />
            Agência
          </button>
        </div>

        {/* FORM */}

        <form
          onSubmit={handleLogin}
          className="mt-7 space-y-5"
        >
          {/* EMAIL */}

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
                setEmail(event.target.value)
              }
              autoComplete="email"
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
            />
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
                className="text-xs font-semibold text-orange-500"
              >
                Esqueceste?
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
                className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 pr-12 text-sm text-gray-950 outline-none transition placeholder:text-gray-400 focus:border-orange-500 focus:ring-4 focus:ring-orange-50"
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
                className="absolute right-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400"
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

          {/* BUTTON */}

          <button
            type="submit"
            disabled={loading}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* REGISTO */}

        <div className="mt-7 border-t border-gray-200 pt-6 text-center">
          <p className="text-sm text-gray-500">
            Ainda não tens uma conta?
          </p>

          <div className="mt-3 grid grid-cols-2 gap-2">
            <Link
              href="/register"
              className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-3 text-xs font-bold text-gray-800"
            >
              <UserRound size={15} />
              Criar conta
            </Link>

            <Link
              href="/register?type=agency"
              className="flex items-center justify-center gap-2 rounded-xl bg-orange-50 px-3 py-3 text-xs font-bold text-orange-600"
            >
              <Building2 size={15} />
              Sou agência
            </Link>
          </div>
        </div>

        {/* SEGURANÇA */}

        <div className="mt-auto flex justify-center gap-1.5 pt-8 text-center text-[11px] text-gray-400">
          <ShieldCheck size={14} />
          Dados protegidos pela Wizenda
        </div>
      </div>
    </main>
  )
}
