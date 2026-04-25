'use client'

import { cn } from '@/lib/utils'
import { STATUSES, ROOMS } from '@/lib/constants'
import { StatusDot } from '@/components/shared/StatusBadge'
import type { ZoneWithState } from '@/types'
import type { ZoneStatus } from '@/types/roles'

interface OverviewPanelProps {
  zones: ZoneWithState[]
  className?: string
}

export function OverviewPanel({ zones, className }: OverviewPanelProps) {
  const total = ROOMS.length

  const statusCounts = zones.reduce((acc, z) => {
    acc[z.status] = (acc[z.status] ?? 0) + 1
    return acc
  }, {} as Record<ZoneStatus, number>)

  const completedCount = statusCounts.completed ?? 0
  const activeCount    = statusCounts.in_progress ?? 0
  const attnCount      = statusCounts.attention ?? 0
  const progress       = total > 0 ? Math.round((completedCount / total) * 100) : 0

  const statRows: Array<{ status: ZoneStatus; count: number }> = (
    Object.entries(statusCounts) as Array<[ZoneStatus, number]>
  )
    .filter(([, c]) => c > 0)
    .sort(([a], [b]) => {
      const order: ZoneStatus[] = ['in_progress', 'attention', 'scheduled', 'paused', 'rework', 'completed', 'idle']
      return order.indexOf(a) - order.indexOf(b)
    })
    .map(([status, count]) => ({ status, count }))

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {/* Progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Прогресс</span>
          <span className="font-mono text-[11px] text-text-2">{progress}%</span>
        </div>
        <div className="h-1.5 rounded-pill bg-elevated overflow-hidden">
          <div
            className="h-full rounded-pill bg-success transition-all duration-700"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-2">
        <StatCard label="В работе"  value={activeCount}    color="#f5c518" />
        <StatCard label="Готово"     value={completedCount} color="#3aae5f" />
        <StatCard label="Внимание"  value={attnCount}      color="#c8a200" />
      </div>

      {/* Status breakdown */}
      {statRows.length > 0 && (
        <div className="flex flex-col border border-border rounded-lg overflow-hidden bg-elevated">
          {statRows.map(({ status, count }) => (
            <div key={status} className="flex items-center gap-3 px-4 py-2.5 border-b border-border-soft last:border-0">
              <StatusDot status={status} size={7} />
              <span className="flex-1 text-[12px] text-text-2">{STATUSES[status].label}</span>
              <span className="font-mono text-[11px] text-text-3">{count}/{total}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-col gap-1 p-3 rounded-lg bg-elevated border border-border-soft">
      <span className="font-mono text-[22px] font-medium leading-none" style={{ color }}>
        {value}
      </span>
      <span className="font-mono text-[9px] tracking-wide text-text-4 uppercase leading-none">{label}</span>
    </div>
  )
}
