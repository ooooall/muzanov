'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import { appStorage } from '@/lib/storage'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    setEmail(appStorage.get<string>('auth:last_email', ''))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      appStorage.set('auth:last_email', email.trim().toLowerCase())
      const next = params.get('next') ?? '/dashboard'
      router.push(next)
      router.refresh()
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h1 className="text-[20px] font-medium text-text-1 text-center mb-6">Вход в систему</h1>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="w-full px-4 py-3 rounded-lg bg-elevated border border-border text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong transition-colors"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Пароль</label>
        <div className="relative">
          <input
            type={showPw ? 'text' : 'password'}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
            className="w-full px-4 py-3 pr-12 rounded-lg bg-elevated border border-border text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong transition-colors"
          />
          <button
            type="button"
            onClick={() => setShowPw(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-4 hover:text-text-2 transition-colors"
          >
            {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-danger-soft border border-danger/20 text-danger text-[12px] font-mono">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 rounded-lg bg-accent text-black font-mono text-[12px] tracking-wide uppercase disabled:opacity-50 hover:bg-accent/90 transition-colors mt-2"
      >
        {loading ? 'Вход...' : 'Войти'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh bg-canvas flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Brand */}
        <div className="flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-[#1e1e26] border border-border-strong grid place-items-center">
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3"/>
            </svg>
          </span>
          <div className="flex flex-col items-center leading-none gap-1">
            <span className="font-mono text-[13px] tracking-[0.18em] text-text-1 uppercase">Quarters</span>
            <span className="font-mono text-[9px] tracking-[0.12em] text-text-4 uppercase">Operations Control</span>
          </div>
        </div>

        <Suspense fallback={<div className="h-64 bg-elevated rounded-lg animate-pulse" />}>
          <LoginForm />
        </Suspense>

        <p className="text-center text-[12px] text-text-4">
          Нет аккаунта?{' '}
          <Link href="/auth/register" className="text-accent hover:underline">
            Зарегистрироваться
          </Link>
        </p>

        <p className="text-center text-[11px] text-text-5">
          <Link href="/" className="hover:text-text-4 transition-colors">
            ← Вернуться на карту
          </Link>
        </p>
      </div>
    </div>
  )
}
