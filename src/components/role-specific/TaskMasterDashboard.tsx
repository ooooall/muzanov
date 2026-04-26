'use client'

import { useCallback, useMemo, useState } from 'react'
import { FloorPlan } from '@/components/map/FloorPlan'
import { MapControls } from '@/components/map/MapControls'
import { OverviewPanel } from '@/components/panels/OverviewPanel'
import { FeedPanel } from '@/components/panels/FeedPanel'
import { ZoneDetailDrawer } from '@/components/panels/ZoneDetailDrawer'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { ZoneWithState, ActivityWithZone, Profile } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface TaskMasterDashboardProps {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  workers: Profile[]
  userId: string
  onZoneUpdate: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onRefresh: () => void
}

type Tab = 'map' | 'overview' | 'feed'

export function TaskMasterDashboard({
  zones, activity, workers, userId, onZoneUpdate, onRefresh,
}: TaskMasterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('map')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const supabase = createClient()

  const stats = useMemo(() => ({
    in_progress: zones.filter((z) => z.status === 'in_progress').length,
    attention: zones.filter((z) => z.status === 'attention').length,
    completed: zones.filter((z) => z.status === 'completed').length,
    idle: zones.filter((z) => z.status === 'idle').length,
  }), [zones])

  const handleAssignOperation = useCallback(async (zoneId: string, opCode: string) => {
    try {
      const { data: opType } = await supabase.from('operation_types').select('id').eq('code', opCode).single()
      if (!opType) { toast.error('Операция не найдена'); return }

      const update: TablesUpdate<'zone_states'> = { operation_type_id: opType.id, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (!error) {
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId, user_id: userId,
          action: 'operation_assigned', details: { op_code: opCode },
        }
        await supabase.from('activity_log').insert(log)
        toast.success(`Операция ${opCode} назначена`)
        onRefresh()
      } else {
        toast.error('Ошибка назначения')
      }
    } catch {
      toast.error('Сетевая ошибка при назначении операции')
    }
  }, [onRefresh, supabase, userId])

  const handleAssignWorker = useCallback(async (zoneId: string, workerId: string | null) => {
    try {
      const update: TablesUpdate<'zone_states'> = { assigned_worker_id: workerId, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
      if (!error) {
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId, user_id: userId,
          action: 'worker_assigned', details: { worker_id: workerId },
        }
        await supabase.from('activity_log').insert(log)
        toast.success(workerId ? 'Исполнитель назначен' : 'Исполнитель снят')
        onRefresh()
      } else {
        toast.error('Ошибка назначения исполнителя')
      }
    } catch {
      toast.error('Сетевая ошибка при назначении исполнителя')
    }
  }, [onRefresh, supabase, userId])

  const handleSaveNote = useCallback(async (zoneId: string, note: string) => {
    try {
      const update: TablesUpdate<'zone_states'> = { notes: note, updated_at: new Date().toISOString() }
      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
      if (!error) {
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId, user_id: userId,
          action: 'note_added', details: { note },
        }
        await supabase.from('activity_log').insert(log)
        onRefresh()
      }
      return error
    } catch {
      return { message: 'network_error' }
    }
  }, [onRefresh, supabase, userId])

  const handleClearAll = useCallback(async () => {
    if (!confirm('Сбросить все зоны в статус "Не начато"? Это действие нельзя отменить.')) return
    try {
      const update: TablesUpdate<'zone_states'> = {
        status: 'idle',
        operation_type_id: null,
        assigned_worker_id: null,
        notes: null,
        started_at: null,
        updated_at: new Date().toISOString(),
      }
      const { error } = await supabase.from('zone_states').update(update).neq('zone_id', '')
      if (!error) {
        toast.success('Все зоны сброшены')
        onRefresh()
      } else {
        toast.error('Ошибка сброса зон')
      }
    } catch {
      toast.error('Сетевая ошибка при сбросе зон')
    }
  }, [onRefresh, supabase])

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex border-b border-border-soft bg-canvas sticky top-14 z-20">
        {([
          { id: 'map',      label: 'Карта' },
          { id: 'overview', label: 'Статус' },
          { id: 'feed',     label: 'Лента' },
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

      {activeTab === 'map' && (
        <div className="flex flex-col flex-1 min-h-0">
          <MapControls filter={filter} onFilterChange={setFilter} stats={stats} />
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <FloorPlan zones={zones} selectedId={selectedId} filter={filter} onSelectRoom={setSelectedId} />
            <div className="flex justify-end">
              <button onClick={handleClearAll}
                className="px-4 py-2 rounded bg-danger-soft border border-danger/20 text-danger font-mono text-[10px] tracking-wide uppercase hover:bg-danger/15 transition-colors"
              >
                Сбросить все зоны
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'overview' && (
        <div className="flex-1 overflow-y-auto p-4">
          <OverviewPanel zones={zones} />
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
        role="taskmaster"
        workers={workers}
        onClose={() => setSelectedId(null)}
        onStatusChange={onZoneUpdate}
        onAssignOperation={handleAssignOperation}
        onAssignWorker={handleAssignWorker}
        onSaveNote={handleSaveNote}
      />
    </div>
  )
}
