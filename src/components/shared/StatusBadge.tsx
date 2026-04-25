import { cn } from '@/lib/utils'
import { STATUSES } from '@/lib/constants'
import type { ZoneStatus } from '@/types/roles'

interface StatusBadgeProps {
  status: ZoneStatus
  size?: 'sm' | 'md'
  showDot?: boolean
  className?: string
}

export function StatusBadge({ status, size = 'md', showDot = true, className }: StatusBadgeProps) {
  const meta = STATUSES[status]

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wide',
        size === 'sm' ? 'text-[9px]' : 'text-[10px]',
        className
      )}
      style={{ color: meta.color }}
    >
      {showDot && (
        <span
          className={cn(
            'rounded-full flex-shrink-0',
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2',
            status === 'in_progress' && 'animate-pulse-slow'
          )}
          style={{ background: meta.color }}
        />
      )}
      {meta.sub}
    </span>
  )
}

interface StatusDotProps {
  status: ZoneStatus
  size?: number
  className?: string
}

export function StatusDot({ status, size = 8, className }: StatusDotProps) {
  const color = STATUSES[status]?.color ?? '#5a5a5a'
  return (
    <span
      className={cn('rounded-full flex-shrink-0', status === 'in_progress' && 'animate-pulse-slow', className)}
      style={{ width: size, height: size, background: color, display: 'inline-block' }}
    />
  )
}
