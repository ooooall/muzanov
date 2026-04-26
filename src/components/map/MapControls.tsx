'use client'

import { STATUSES } from '@/lib/constants'
import { cn } from '@/lib/utils'
import type { ZoneStatus } from '@/types/roles'

const FILTER_OPTIONS: Array<{ value: 'all' | ZoneStatus; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'new', label: 'Новые' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'review', label: 'На проверке' },
  { value: 'done', label: 'Готово' },
]

interface MapControlsProps {
  filter: string
  onFilterChange: (filter: string) => void
  stats?: Record<ZoneStatus, number>
}

export function MapControls({ filter, onFilterChange, stats }: MapControlsProps) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto border-b border-slate-100 px-4 py-3 scrollbar-hide">
      {FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = filter === value
        const statusColor = value !== 'all' ? STATUSES[value].color : undefined
        const count = value !== 'all' ? stats?.[value] : undefined

        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 font-mono text-[10px] uppercase tracking-wide transition-all duration-200',
              isActive ? 'border-slate-200 bg-slate-50 text-text-1 shadow-sm' : 'border-slate-100 bg-white text-text-4 hover:border-slate-200 hover:text-text-2',
            )}
          >
            {statusColor && <span className="h-1.5 w-1.5 rounded-full" style={{ background: statusColor }} />}
            {label}
            {count !== undefined && count > 0 && <span className="opacity-60">{count}</span>}
          </button>
        )
      })}
    </div>
  )
}
