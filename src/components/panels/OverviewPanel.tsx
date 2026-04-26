'use client'

import { STATUSES, ROOMS } from '@/lib/constants'
import { StatusDot } from '@/components/shared/StatusBadge'
import { AppSurface } from '@/components/shared/AppSurface'
import { cn } from '@/lib/utils'
import type { ZoneWithState } from '@/types'
import type { ZoneStatus } from '@/types/roles'

interface OverviewPanelProps {
  zones: ZoneWithState[]
  className?: string
}

export function OverviewPanel({ zones, className }: OverviewPanelProps) {
  const total = ROOMS.length

  const statusCounts = zones.reduce((acc, zone) => {
    acc[zone.status] = (acc[zone.status] ?? 0) + 1
    return acc
  }, {} as Record<ZoneStatus, number>)

  const completedCount = statusCounts.done ?? 0
  const activeCount = statusCounts.in_progress ?? 0
  const reviewCount = statusCounts.review ?? 0
  const progress = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const orderedStatuses: ZoneStatus[] = ['in_progress', 'review', 'done', 'new']
  const rows = orderedStatuses
    .map((status) => ({ status, count: statusCounts[status] ?? 0 }))
    .filter((row) => row.count > 0)

  return (
    <div className={cn('flex flex-col gap-6', className)}>
      <AppSurface className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="font-mono text-[10px] uppercase tracking-wide text-text-4">Прогресс по объекту</span>
          <span className="font-mono text-[11px] uppercase tracking-wide text-text-2">{progress}%</span>
        </div>
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-emerald-500 transition-all duration-700" style={{ width: `${progress}%` }} />
        </div>
      </AppSurface>

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard label="В работе" value={activeCount} color="#d97706" />
        <StatCard label="На проверке" value={reviewCount} color="#2563eb" />
        <StatCard label="Готово" value={completedCount} color="#059669" />
      </div>

      <AppSurface className="overflow-hidden">
        {rows.map(({ status, count }) => (
          <div key={status} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-b-0">
            <StatusDot status={status} size={8} />
            <span className="flex-1 text-[13px] text-text-2">{STATUSES[status].label}</span>
            <span className="font-mono text-[11px] uppercase tracking-wide text-text-4">
              {count}/{total}
            </span>
          </div>
        ))}
      </AppSurface>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <AppSurface className="p-4">
      <div className="text-[26px] font-semibold leading-none" style={{ color }}>
        {value}
      </div>
      <div className="mt-2 font-mono text-[10px] uppercase tracking-wide text-text-4">{label}</div>
    </AppSurface>
  )
}
