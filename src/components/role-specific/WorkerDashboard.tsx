'use client'

import { useState } from 'react'
import { FloorPlan } from '@/components/map/FloorPlan'
import { MapControls } from '@/components/map/MapControls'
import { FeedPanel } from '@/components/panels/FeedPanel'
import { ZoneDetailDrawer } from '@/components/panels/ZoneDetailDrawer'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatRelative } from '@/lib/utils'
import { ROOMS } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface WorkerDashboardProps {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  userId: string
  onZoneUpdate: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
}

type Tab = 'my' | 'map' | 'feed'

export function WorkerDashboard({ zones, activity, userId, onZoneUpdate }: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('my')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const supabase = createClient()

  const assignedZones = zones.filter(z => z.assigned_worker_id === userId)

  const stats = {
    in_progress: zones.filter(z => z.status === 'in_progress').length,
    attention:   zones.filter(z => z.status === 'attention').length,
    completed:   zones.filter(z => z.status === 'completed').length,
    idle:        zones.filter(z => z.status === 'idle').length,
  }

  async function handleSaveNote(zoneId: string, note: string) {
    const update: TablesUpdate<'zone_states'> = { notes: note, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) {
      const log: TablesInsert<'activity_log'> = {
        zone_id: zoneId, user_id: userId,
        action: 'note_added', details: { note },
      }
      await supabase.from('activity_log').insert(log)
    }
    return error
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex border-b border-border-soft bg-canvas sticky top-14 z-20">
        {([
          { id: 'my',   label: `Мои (${assignedZones.length})` },
          { id: 'map',  label: 'Карта' },
          { id: 'feed', label: 'Лента' },
        ] as const).map(({ id, label }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={cn(
              'flex-1 py-3 font-mono text-[11px] tracking-wide uppercase border-b-2 transition-colors',
              activeTab === id ? 'border-accent text-text-1' : 'border-transparent text-text-4 hover:text-text-3'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'my' && (
        <div className="flex-1 overflow-y-auto">
          {assignedZones.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-text-4">
              <span className="font-mono text-[11px] tracking-wide uppercase">Нет назначенных зон</span>
              <span className="text-[12px]">Ожидайте назначения от TaskMaster</span>
            </div>
          ) : (
            <div className="flex flex-col divide-y divide-border-soft">
              {assignedZones.map(zone => {
                const room = ROOMS.find(r => r.id === zone.zone_id)
                if (!room) return null
                return (
                  <button key={zone.zone_id} onClick={() => setSelectedId(zone.zone_id)}
                    className="flex items-center gap-4 px-4 py-4 text-left hover:bg-hover transition-colors"
                  >
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">{room.code}</span>
                        <span className="font-mono text-[9px] text-text-5">{room.area} м²</span>
                      </div>
                      <span className="text-[15px] font-medium text-text-1 truncate">{room.name}</span>
                      {zone.operation_types && (
                        <span className="text-[12px] text-text-3 truncate">{zone.operation_types.label}</span>
                      )}
                      <span className="text-[11px] text-text-4">{formatRelative(zone.updated_at)}</span>
                    </div>
                    <StatusBadge status={zone.status} size="sm" />
                  </button>
                )
              })}
            </div>
          )}
        </div>
      )}

      {activeTab === 'map' && (
        <div className="flex flex-col flex-1 min-h-0">
          <MapControls filter={filter} onFilterChange={setFilter} stats={stats} />
          <div className="flex-1 overflow-y-auto p-4">
            <FloorPlan zones={zones} selectedId={selectedId} filter={filter} onSelectRoom={setSelectedId} />
          </div>
        </div>
      )}

      {activeTab === 'feed' && (
        <div className="flex-1 overflow-y-auto">
          <FeedPanel activity={activity} />
        </div>
      )}

      <ZoneDetailDrawer
        zoneId={selectedId}
        zones={zones}
        role="worker"
        onClose={() => setSelectedId(null)}
        onStatusChange={onZoneUpdate}
        onSaveNote={handleSaveNote}
      />
    </div>
  )
}
