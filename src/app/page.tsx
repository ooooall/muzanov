import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { ViewerDashboard } from '@/components/role-specific/ViewerDashboard'
import type { ZoneWithState, ActivityWithZone } from '@/types'

export const revalidate = 0

export default async function PublicPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'worker' || profile?.role === 'taskmaster') {
      redirect('/dashboard')
    }
  }

  const [{ data: zones }, { data: activity }] = await Promise.all([
    supabase
      .from('zone_states')
      .select('*, zones(*), operation_types(*), profiles(*)')
      .order('zone_id'),
    supabase
      .from('activity_log')
      .select('*, zones(*)')
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <Header role={null} showAuth={true} />
      <main className="flex-1 flex flex-col min-h-0">
        <ViewerDashboard
          zones={(zones ?? []) as ZoneWithState[]}
          activity={(activity ?? []) as ActivityWithZone[]}
        />
      </main>
    </div>
  )
}
