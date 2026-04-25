'use client'

import { cn } from '@/lib/utils'
import { STATUSES } from '@/lib/constants'
import type { ZoneStatus } from '@/types/roles'

const FILTER_OPTIONS: Array<{ value: string; label: string }> = [
  { value: 'all',        label: 'Все' },
  { value: 'in_progress',label: 'В работе' },
  { value: 'attention',  label: 'Внимание' },
  { value: 'completed',  label: 'Готово' },
  { value: 'idle',       label: 'Свободно' },
]

interface MapControlsProps {
  filter: string
  onFilterChange: (f: string) => void
  stats?: {
    in_progress: number
    attention: number
    completed: number
    idle: number
  }
}

export function MapControls({ filter, onFilterChange, stats }: MapControlsProps) {
  return (
    <div className="flex items-center gap-1.5 px-4 py-2.5 overflow-x-auto scrollbar-hide border-b border-border-soft">
      {FILTER_OPTIONS.map(({ value, label }) => {
        const isActive = filter === value
        const statusColor = value !== 'all'
          ? STATUSES[value as ZoneStatus]?.color
          : undefined
        const count = stats && value !== 'all' ? stats[value as keyof typeof stats] : undefined

        return (
          <button
            key={value}
            onClick={() => onFilterChange(value)}
            className={cn(
              'flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-pill border font-mono text-[10px] tracking-wide uppercase transition-all',
              isActive
                ? 'bg-hover border-border-strong text-text-1'
                : 'border-border-soft text-text-4 hover:text-text-3 hover:border-border'
            )}
          >
            {statusColor && (
              <span
                className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                style={{ background: statusColor }}
              />
            )}
            {label}
            {count !== undefined && count > 0 && (
              <span className="text-[9px] opacity-70">{count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
