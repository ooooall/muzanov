import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Header } from '@/components/shared/Header'
import { BottomNav } from '@/components/shared/BottomNav'
import { ROOMS, STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const revalidate = 0

export default async function AnalyticsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'taskmaster') redirect('/dashboard')

  const [{ data: zones }, { data: activity }] = await Promise.all([
    supabase.from('zone_states').select('*, zones(*), operation_types(*), profiles(*)').order('zone_id'),
    supabase.from('activity_log').select('*, zones(*)').order('created_at', { ascending: false }).limit(200),
  ])

  const z = (zones ?? []) as ZoneWithState[]
  const a = (activity ?? []) as ActivityWithZone[]

  const total = ROOMS.length
  const statusCounts = z.reduce((acc, zone) => {
    acc[zone.status] = (acc[zone.status] ?? 0) + 1
    return acc
  }, {} as Record<ZoneStatus, number>)

  const completedPct = total > 0 ? Math.round(((statusCounts.completed ?? 0) / total) * 100) : 0
  const activePct    = total > 0 ? Math.round(((statusCounts.in_progress ?? 0) / total) * 100) : 0

  const opStats = z.reduce((acc, zone) => {
    const code = zone.operation_types?.code ?? 'none'
    if (!acc[code]) acc[code] = { label: zone.operation_types?.label ?? 'Не назначена', count: 0 }
    acc[code].count++
    return acc
  }, {} as Record<string, { label: string; count: number }>)

  const workerStats = z.reduce((acc, zone) => {
    const name = zone.profiles?.display_name ?? 'Не назначен'
    if (!acc[name]) acc[name] = 0
    acc[name]++
    return acc
  }, {} as Record<string, number>)

  return (
    <div className="flex flex-col min-h-dvh bg-canvas">
      <Header role="taskmaster" />
      <main className="flex-1 pb-16 max-w-screen-lg mx-auto w-full px-4 py-6 space-y-8">
        <div>
          <h1 className="text-[22px] font-medium text-text-1">Аналитика</h1>
          <p className="text-[13px] text-text-3 mt-1">Статистика операций и производительности</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Готово"    value={`${completedPct}%`} color="#3aae5f" />
          <StatCard label="В работе"  value={`${activePct}%`}    color="#f5c518" />
          <StatCard label="Всего зон" value={total.toString()}   color="#c0c0c0" />
          <StatCard label="Событий"   value={a.length.toString()} color="#808080" />
        </div>

        {/* Status distribution */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] tracking-wide text-text-4 uppercase">Распределение статусов</h2>
          <div className="rounded-lg bg-elevated border border-border overflow-hidden">
            {(Object.entries(statusCounts) as [ZoneStatus, number][]).map(([status, count]) => (
              <div key={status} className="flex items-center gap-4 px-4 py-3 border-b border-border-soft last:border-0">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: STATUSES[status].color }} />
                <span className="flex-1 text-[13px] text-text-2">{STATUSES[status].label}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-1.5 rounded-pill bg-base overflow-hidden">
                    <div
                      className="h-full rounded-pill transition-all"
                      style={{
                        width: `${(count / total) * 100}%`,
                        background: STATUSES[status].color,
                      }}
                    />
                  </div>
                  <span className="font-mono text-[11px] text-text-3 w-8 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Operations */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] tracking-wide text-text-4 uppercase">По операциям</h2>
          <div className="rounded-lg bg-elevated border border-border overflow-hidden">
            {Object.entries(opStats)
              .sort(([,a],[,b]) => b.count - a.count)
              .map(([code, { label, count }]) => (
                <div key={code} className="flex items-center gap-4 px-4 py-3 border-b border-border-soft last:border-0">
                  <span className="font-mono text-[10px] tracking-wide text-accent w-16 flex-shrink-0">{code}</span>
                  <span className="flex-1 text-[13px] text-text-2">{label}</span>
                  <span className="font-mono text-[11px] text-text-3">{count} зон</span>
                </div>
              ))}
          </div>
        </section>

        {/* Workers */}
        <section className="space-y-3">
          <h2 className="font-mono text-[11px] tracking-wide text-text-4 uppercase">По исполнителям</h2>
          <div className="rounded-lg bg-elevated border border-border overflow-hidden">
            {Object.entries(workerStats)
              .sort(([,a],[,b]) => b - a)
              .map(([name, count]) => (
                <div key={name} className="flex items-center gap-4 px-4 py-3 border-b border-border-soft last:border-0">
                  <span className="flex-1 text-[13px] text-text-2">{name}</span>
                  <span className="font-mono text-[11px] text-text-3">{count} зон</span>
                </div>
              ))}
          </div>
        </section>
      </main>
      <BottomNav role="taskmaster" />
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex flex-col gap-1 p-4 rounded-lg bg-elevated border border-border-soft">
      <span className="text-[26px] font-medium leading-none" style={{ color }}>{value}</span>
      <span className="font-mono text-[9px] tracking-wide text-text-4 uppercase leading-none mt-1">{label}</span>
    </div>
  )
}
