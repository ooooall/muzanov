import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import ControlPanel from './_panel'
import type { ZoneWithState, Profile } from '@/types'
import { isOwnerEmail } from '@/lib/auth'

export const revalidate = 0

export default async function ControlPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profile?.role !== 'taskmaster') redirect('/dashboard')

  const [{ data: zones }, { data: workers }] = await Promise.all([
    supabase
      .from('zone_states')
      .select('*, zones(*), operation_types(*), profiles(*)')
      .order('zone_id'),
    supabase.from('profiles').select('*').order('created_at', { ascending: false }),
  ])

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <Header role="taskmaster" />
      <main className="flex-1 pb-16 max-w-screen-lg mx-auto w-full px-4 py-6">
        <ControlPanel
          zones={(zones ?? []) as ZoneWithState[]}
          workers={(workers ?? []) as Profile[]}
          userId={user.id}
          isOwnerAccount={isOwnerEmail(user.email)}
        />
      </main>
      <BottomNav role="taskmaster" />
    </div>
  )
}
