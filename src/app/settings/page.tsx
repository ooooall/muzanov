import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import SettingsForm from './_form'
import type { Profile } from '@/types'

export const revalidate = 0

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('*').eq('id', user.id).single()
  if (profile?.role !== 'taskmaster') redirect('/dashboard')

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <Header role="taskmaster" />
      <main className="flex-1 pb-16 max-w-screen-sm mx-auto w-full px-4 py-6">
        <div className="mb-6">
          <h1 className="text-[22px] font-medium text-text-1">Настройки</h1>
          <p className="text-[13px] text-text-3 mt-1">Профиль и конфигурация системы</p>
        </div>
        <SettingsForm profile={profile as Profile} email={user.email ?? ''} />
      </main>
      <BottomNav role="taskmaster" />
    </div>
  )
}
