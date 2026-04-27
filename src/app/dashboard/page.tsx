import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import type { ZoneWithState, ActivityWithZone, Profile, OperationType } from '@/types'
import type { UserRole } from '@/types/roles'
import { isOwnerEmail } from '@/lib/auth'

export const revalidate = 0

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const role = (profile?.role ?? 'viewer') as UserRole

  const [{ data: zones }, { data: activity }, { data: workers }, { data: operations }] = await Promise.all([
    supabase
      .from('zone_states')
      .select('*, zones(*), operation_types(*), profiles(*)')
      .order('zone_id'),
    supabase
      .from('activity_log')
      .select('*, zones(*)')
      .order('created_at', { ascending: false })
      .limit(50),
    role === 'taskmaster'
      ? supabase.from('profiles').select('*').eq('role', 'worker')
      : Promise.resolve({ data: [] }),
    role === 'taskmaster'
      ? supabase.from('operation_types').select('*').order('is_system', { ascending: false }).order('created_at', { ascending: true })
      : Promise.resolve({ data: [] }),
  ])

  if (role === 'viewer') redirect('/')

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <Header role={role} />
      <main className="flex-1 pb-16">
        {role === 'worker' && (
          <WorkerDashboardWrapper
            zones={(zones ?? []) as ZoneWithState[]}
            activity={(activity ?? []) as ActivityWithZone[]}
            userId={user.id}
          />
        )}
        {role === 'taskmaster' && (
          <TaskMasterDashboardWrapper
            zones={(zones ?? []) as ZoneWithState[]}
            activity={(activity ?? []) as ActivityWithZone[]}
            workers={(workers ?? []) as Profile[]}
            operations={(operations ?? []) as OperationType[]}
            userId={user.id}
            isOwnerAccount={isOwnerEmail(user.email)}
          />
        )}
      </main>
      <BottomNav role={role} />
    </div>
  )
}

// Client wrappers that handle state updates
import WorkerDashboardWrapper from './_worker'
import TaskMasterDashboardWrapper from './_taskmaster'
