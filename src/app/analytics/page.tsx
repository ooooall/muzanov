import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import { AppSurface } from '@/components/shared/AppSurface'
import { ROOMS, STATUSES } from '@/lib/constants'
import type { ActivityWithZone, ZoneWithState } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const revalidate = 0

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'taskmaster') redirect('/dashboard')

  const [{ data: zones }, { data: activity }] = await Promise.all([
    supabase.from('zone_states').select('*, zones(*), operation_types(*), profiles(*)').order('zone_id'),
    supabase.from('activity_log').select('*, zones(*)').order('created_at', { ascending: false }).limit(200),
  ])

  const zoneList = (zones ?? []) as ZoneWithState[]
  const activityList = (activity ?? []) as ActivityWithZone[]
  const total = ROOMS.length

  const statusCounts = zoneList.reduce((acc, zone) => {
    acc[zone.status] = (acc[zone.status] ?? 0) + 1
    return acc
  }, {} as Record<ZoneStatus, number>)

  const donePct = total > 0 ? Math.round(((statusCounts.done ?? 0) / total) * 100) : 0
  const activePct = total > 0 ? Math.round(((statusCounts.in_progress ?? 0) / total) * 100) : 0

  const operationStats = zoneList.reduce((acc, zone) => {
    const key = zone.operation_types?.id ?? 'none'
    if (!acc[key]) {
      acc[key] = {
        label: zone.operation_types?.label ?? 'Не назначена',
        code: zone.operation_types?.code ?? 'NONE',
        count: 0,
      }
    }
    acc[key].count += 1
    return acc
  }, {} as Record<string, { label: string; code: string; count: number }>)

  const workerStats = zoneList.reduce((acc, zone) => {
    const key = zone.profiles?.display_name ?? 'Не назначен'
    acc[key] = (acc[key] ?? 0) + 1
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <Header role="taskmaster" />
      <main className="mx-auto flex w-full max-w-screen-lg flex-1 flex-col gap-6 px-4 py-6 pb-20">
        <div className="space-y-1">
          <h1 className="text-[24px] font-semibold tracking-tight text-text-1">Аналитика</h1>
          <p className="text-[13px] text-text-3">Снимок по статусам, операциям и нагрузке исполнителей.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <MetricCard label="Готово" value={`${donePct}%`} color="#059669" />
          <MetricCard label="В работе" value={`${activePct}%`} color="#d97706" />
          <MetricCard label="Всего зон" value={String(total)} color="#475569" />
          <MetricCard label="Событий" value={String(activityList.length)} color="#2563eb" />
        </div>

        <AppSurface className="overflow-hidden">
          <SectionTitle title="Статусы" />
          {(['new', 'in_progress', 'review', 'done'] as ZoneStatus[]).map((status) => {
            const count = statusCounts[status] ?? 0
            return (
              <div key={status} className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0">
                <div className="h-2 w-2 rounded-full" style={{ background: STATUSES[status].color }} />
                <span className="flex-1 text-[13px] text-text-2">{STATUSES[status].label}</span>
                <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full" style={{ width: `${total ? (count / total) * 100 : 0}%`, background: STATUSES[status].color }} />
                </div>
                <span className="w-8 text-right font-mono text-[11px] uppercase tracking-wide text-text-4">{count}</span>
              </div>
            )
          })}
        </AppSurface>

        <AppSurface className="overflow-hidden">
          <SectionTitle title="Операции" />
          {Object.values(operationStats)
            .sort((left, right) => right.count - left.count)
            .map((operation) => (
              <div key={operation.code} className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0">
                <span className="w-16 flex-shrink-0 font-mono text-[10px] uppercase tracking-wide text-text-4">{operation.code}</span>
                <span className="flex-1 text-[13px] text-text-2">{operation.label}</span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-text-4">{operation.count}</span>
              </div>
            ))}
        </AppSurface>

        <AppSurface className="overflow-hidden">
          <SectionTitle title="Исполнители" />
          {Object.entries(workerStats)
            .sort((left, right) => right[1] - left[1])
            .map(([name, count]) => (
              <div key={name} className="flex items-center gap-4 border-t border-slate-100 px-4 py-3 first:border-t-0">
                <span className="flex-1 text-[13px] text-text-2">{name}</span>
                <span className="font-mono text-[11px] uppercase tracking-wide text-text-4">{count}</span>
              </div>
            ))}
        </AppSurface>
      </main>
      <BottomNav role="taskmaster" />
    </div>
  )
}

function MetricCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <AppSurface className="p-4">
      <div className="text-[28px] font-semibold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wide text-text-4">{label}</div>
    </AppSurface>
  )
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="px-4 py-4">
      <h2 className="text-[15px] font-medium text-text-1">{title}</h2>
    </div>
  )
}
