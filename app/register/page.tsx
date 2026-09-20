'use client'

import { FormEvent, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    setLoading(true)
    setMessage('')

    const supabase = createClient()

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage(
        'Conta criada! Verifica o teu email se a confirmação estiver ativada.'
      )
    }

    setLoading(false)
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold">Criar conta</h1>

        <p className="mt-2 text-gray-500">
          Cria a tua conta no Wizenda.
        </p>

        <form onSubmit={handleRegister} className="mt-8 space-y-4">
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border p-3"
          />

          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border p-3"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-black p-3 font-medium text-white"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
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