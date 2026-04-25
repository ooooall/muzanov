'use client'

import { cn, formatRelative } from '@/lib/utils'
import { STATUSES } from '@/lib/constants'
import type { ActivityWithZone } from '@/types'

interface FeedPanelProps {
  activity: ActivityWithZone[]
  loading?: boolean
  className?: string
}

const ACTION_LABELS: Record<string, string> = {
  status_change:     'Статус изменён',
  operation_assigned:'Операция назначена',
  worker_assigned:   'Исполнитель назначен',
  note_added:        'Заметка добавлена',
  checklist_updated: 'Чеклист обновлён',
  zone_reset:        'Зона сброшена',
  zone_archived:     'Зона архивирована',
}

function getActionColor(action: string, details?: unknown): string {
  if (action === 'status_change' && details && typeof details === 'object') {
    const d = details as { new_status?: string }
    const color = STATUSES[d.new_status as keyof typeof STATUSES]?.color
    if (color) return color
  }
  return '#5a5a5a'
}

export function FeedPanel({ activity, loading, className }: FeedPanelProps) {
  if (loading) {
    return (
      <div className={cn('flex flex-col gap-0', className)}>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex gap-3 px-4 py-3 border-b border-border-soft">
            <div className="flex flex-col items-center gap-1 w-8">
              <div className="w-2 h-2 rounded-full bg-elevated mt-1.5" />
              <div className="w-px flex-1 bg-elevated" />
            </div>
            <div className="flex-1 flex flex-col gap-1.5 pb-1">
              <div className="h-2 w-20 rounded bg-elevated" />
              <div className="h-3 w-40 rounded bg-elevated" />
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (activity.length === 0) {
    return (
      <div className={cn('px-4 py-10 text-center text-text-4 font-mono text-[11px] tracking-wide', className)}>
        Активности нет
      </div>
    )
  }

  return (
    <div className={cn('flex flex-col', className)}>
      {activity.map((item, i) => {
        const color   = getActionColor(item.action, item.details)
        const label   = ACTION_LABELS[item.action] ?? item.action
        const details = item.details && typeof item.details === 'object' ? item.details as Record<string, string> : null
        const isLast  = i === activity.length - 1

        return (
          <div key={item.id} className="flex gap-3 px-4 py-3 border-b border-border-soft last:border-0">
            <div className="flex flex-col items-center gap-1 w-8 flex-shrink-0">
              <span
                className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                style={{ background: color }}
              />
              {!isLast && <span className="w-px flex-1 bg-border" />}
            </div>
            <div className="flex-1 min-w-0 flex flex-col gap-1 pb-1">
              <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">
                {formatRelative(item.created_at)}
              </span>
              <span className="text-[13px] font-medium text-text-1 leading-snug">
                {label}
                {details?.new_status && (
                  <span className="ml-1.5 font-mono text-[10px]" style={{ color }}>
                    → {STATUSES[details.new_status as keyof typeof STATUSES]?.sub ?? details.new_status}
                  </span>
                )}
              </span>
              {item.zones?.name && (
                <span className="text-[12px] text-text-3">
                  {item.zones.name}
                  {item.zones.code && (
                    <span className="ml-1.5 font-mono text-[10px] text-text-5">
                      {item.zones.code}
                    </span>
                  )}
                </span>
              )}
              {details?.note && (
                <span className="text-[11px] text-text-4 italic">{details.note}</span>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
