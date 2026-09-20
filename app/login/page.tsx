
'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      })

    if (error) {
      setMessage(error.message)
      setLoading(false)
      return
    }

    const user = data.user

    if (!user) {
      setMessage(
        'Não foi possível identificar a tua conta.',
      )
      setLoading(false)
      return
    }

    const { data: profile, error: profileError } =
      await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

    if (profileError) {
      console.error(profileError)

      setMessage(
        'Não foi possível carregar o perfil da conta.',
      )

      setLoading(false)
      return
    }

    if (!profile) {
      setMessage(
        'Perfil da conta não encontrado.',
      )

      setLoading(false)
      return
    }

    if (profile.role === 'agency') {
      router.push('/agency')
      router.refresh()
      return
    }

    if (profile.role === 'admin') {
      router.push('/admin')
      router.refresh()
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">
          Entrar
        </h1>

        <p className="mt-2 text-gray-500">
          Entra na tua conta Wizenda.
        </p>

        <form
          onSubmit={handleLogin}
          className="mt-8 space-y-4"
        >
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            required
            className="w-full rounded-xl border p-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            required
            className="w-full rounded-xl border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black p-3 font-medium text-white disabled:opacity-60"
          >
            {loading
              ? 'Entrando...'
              : 'Entrar'}
          </button>
        </form>

        {message && (
          <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm">
            {message}
          </p>
        )}
      </div>
    </main>
  )
}
