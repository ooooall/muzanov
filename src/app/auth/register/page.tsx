'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'
import { appStorage } from '@/lib/storage'

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [done, setDone] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name } },
      })

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      appStorage.set('auth:last_email', email.trim().toLowerCase())

      // If email confirmation is disabled, user is auto-confirmed
      if (data.session) {
        router.push('/dashboard')
        router.refresh()
      } else {
        setDone(true)
      }
    } catch {
      setError('Ошибка сети. Попробуйте еще раз.')
    } finally {
      setLoading(false)
    }
  }

  if (done) {
    return (
      <div className="min-h-dvh bg-canvas flex flex-col items-center justify-center px-4 pt-safe pb-safe">
        <div className="w-full max-w-sm text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-success-soft border border-success/30 grid place-items-center mx-auto">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M4 10l4 4 8-8" stroke="#3aae5f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <h2 className="text-[20px] font-medium text-text-1">Проверьте почту</h2>
          <p className="text-[13px] text-text-3">
            Мы отправили письмо на <strong className="text-text-1">{email}</strong>.<br />
            Перейдите по ссылке для подтверждения.
          </p>
          <Link href="/auth/login" className="text-accent text-[12px] hover:underline">
            Войти
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-dvh bg-canvas flex flex-col items-center justify-center px-4 pt-safe pb-safe">
      <div className="w-full max-w-sm space-y-8">
        <div className="flex flex-col items-center gap-3">
          <span className="w-12 h-12 rounded-xl bg-[#1e1e26] border border-border-strong grid place-items-center">
            <svg width="22" height="22" viewBox="0 0 14 14" fill="none">
              <rect x="1" y="1" width="5" height="8" rx="1" fill="#f5c518"/>
              <rect x="8" y="1" width="5" height="5" rx="1" fill="#f5c518" opacity=".6"/>
              <rect x="8" y="8" width="5" height="5" rx="1" fill="#f5c518" opacity=".3"/>
            </svg>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <h1 className="text-[20px] font-medium text-text-1 text-center mb-6">Регистрация</h1>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Имя</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Алексей"
              className="w-full px-4 py-3 rounded-lg bg-elevated border border-border text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong transition-colors"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
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
                minLength={6}
                placeholder="Минимум 6 символов"
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

          <p className="text-[11px] text-text-5 leading-relaxed pt-1">
            После регистрации вам будет назначена роль администратором системы.
          </p>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-accent text-black font-mono text-[12px] tracking-wide uppercase disabled:opacity-50 hover:bg-accent/90 transition-colors mt-2"
          >
            {loading ? 'Регистрация...' : 'Зарегистрироваться'}
          </button>
        </form>

        <p className="text-center text-[12px] text-text-4">
          Уже есть аккаунт?{' '}
          <Link href="/auth/login" className="text-accent hover:underline">
            Войти
          </Link>
        </p>
      </div>
    </div>
  )
}
