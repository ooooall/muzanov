'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { appStorage } from '@/lib/storage'

export default function PendingPage() {
  const router = useRouter()

  async function handleLogout() {
    const supabase = createClient()
    await supabase.auth.signOut()
    appStorage.clearSessionScope()
    router.replace('/auth/login')
  }

  return (
    <div className="min-h-dvh bg-canvas flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#1e1a00] border border-[rgba(245,197,24,0.25)] grid place-items-center mx-auto">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f5c518" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>

        <div>
          <h1 className="text-[22px] font-medium text-text-1 mb-2">Ожидание одобрения</h1>
          <p className="text-[13px] text-text-3 leading-relaxed">
            Ваш аккаунт зарегистрирован и ожидает одобрения администратора.<br/>
            После одобрения вы получите доступ к системе.
          </p>
        </div>

        <div className="p-4 rounded-lg bg-elevated border border-border text-left space-y-2">
          <p className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Что происходит?</p>
          <p className="text-[12px] text-text-3 leading-relaxed">
            Администратор просмотрит вашу заявку и назначит вам роль. Обычно это занимает несколько минут.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full py-3 rounded-lg border border-border text-text-3 font-mono text-[11px] tracking-wide uppercase hover:bg-hover transition-colors"
        >
          Выйти
        </button>
      </div>
    </div>
  )
}
