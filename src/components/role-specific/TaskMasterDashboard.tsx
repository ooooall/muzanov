'use client'

import { useCallback, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LayoutGrid, ListChecks, RefreshCcw, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { FloorPlan } from '@/components/map/FloorPlan'
import { MapControls } from '@/components/map/MapControls'
import { OverviewPanel } from '@/components/panels/OverviewPanel'
import { FeedPanel } from '@/components/panels/FeedPanel'
import { ZoneDetailDrawer } from '@/components/panels/ZoneDetailDrawer'
import { AppButton } from '@/components/shared/AppButton'
import { AppSurface } from '@/components/shared/AppSurface'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { ROOMS } from '@/lib/constants'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getZoneStats } from '@/lib/zone-workflow'
import type { ZoneWithState, ActivityWithZone, Profile, OperationType } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface TaskMasterDashboardProps {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  workers: Profile[]
  operations: OperationType[]
  userId: string
  isOwnerAccount: boolean
  onZoneUpdate: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onRefresh: () => void
}

type Tab = 'board' | 'overview' | 'feed'

const tabs: Array<{ id: Tab; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }> = [
  { id: 'board', label: 'Задачи', icon: LayoutGrid },
  { id: 'overview', label: 'Обзор', icon: ListChecks },
  { id: 'feed', label: 'Лента', icon: Sparkles },
]

export function TaskMasterDashboard({
  zones,
  activity,
  workers,
  operations,
  userId,
  isOwnerAccount,
  onZoneUpdate,
  onRefresh,
}: TaskMasterDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('board')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [supabase] = useState(() => createClient())

  const stats = useMemo(() => getZoneStats(zones.map((zone) => zone.status)), [zones])

  const handleAssignOperation = useCallback(
    async (zoneId: string, operationId: string) => {
      const operation = operations.find((item) => item.id === operationId)
      if (!operation) {
        toast.error('Операция не найдена')
        return
      }

      const update: TablesUpdate<'zone_states'> = {
        operation_type_id: operation.id,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (!error) {
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId,
          user_id: userId,
          action: 'operation_assigned',
          details: { op_id: operation.id, op_code: operation.code, op_label: operation.label },
        }
        await supabase.from('activity_log').insert(log)
        toast.success(`Операция «${operation.label}» назначена`)
        onRefresh()
        return
      }

      toast.error('Не удалось назначить операцию')
    },
    [onRefresh, operations, supabase, userId],
  )

  const handleAssignWorker = useCallback(
    async (zoneId: string, workerId: string | null) => {
      const update: TablesUpdate<'zone_states'> = {
        assigned_worker_id: workerId,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

      if (!error) {
        const worker = workers.find((item) => item.id === workerId)
        const log: TablesInsert<'activity_log'> = {
          zone_id: zoneId,
          user_id: userId,
          action: 'worker_assigned',
          details: { worker_id: workerId, worker_name: worker?.display_name ?? null },
        }
        await supabase.from('activity_log').insert(log)
        toast.success(workerId ? 'Исполнитель назначен' : 'Исполнитель снят')
        onRefresh()
        return
      }

      toast.error('Не удалось назначить исполнителя')
    },
    [onRefresh, supabase, userId, workers],
  )

  const handleSaveNote = useCallback(
    async (zoneId: string, note: string) => {
      try {
        const update: TablesUpdate<'zone_states'> = {
          notes: note,
          updated_at: new Date().toISOString(),
        }
        const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

        if (!error) {
          const log: TablesInsert<'activity_log'> = {
            zone_id: zoneId,
            user_id: userId,
            action: 'note_added',
            details: { note },
          }
          await supabase.from('activity_log').insert(log)
          onRefresh()
        }

        return error
      } catch {
        return { message: 'network_error' }
      }
    },
    [onRefresh, supabase, userId],
  )

  const handleResetBoard = useCallback(async () => {
    if (!window.confirm('Сбросить всё? Это удалит всю ленту активностей и обнулит все зоны.')) return

    const response = await fetch('/api/admin/reset', { method: 'POST' })

    if (response.ok) {
      toast.success('Всё сброшено с нуля')
      onRefresh()
      return
    }

    toast.error('Не удалось сбросить')
  }, [onRefresh])

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-xl flex-col gap-5 overflow-x-hidden px-3 py-5 sm:px-4 sm:py-6">
      <div className="space-y-1">
        <h1 className="text-[24px] font-semibold tracking-tight text-text-1">Операционный центр</h1>
        <p className="text-[13px] text-text-3">Постановка задач, контроль статусов и управление исполнителями без лишнего шума.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <MetricCard label="Новые" value={stats.new} tone="slate" />
        <MetricCard label="В работе" value={stats.in_progress} tone="amber" />
        <MetricCard label="На проверке" value={stats.review} tone="blue" />
        <MetricCard label="Готово" value={stats.done} tone="emerald" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <AppButton key={id} variant={activeTab === id ? 'primary' : 'secondary'} size="sm" icon={<Icon size={13} />} onClick={() => setActiveTab(id)}>
            {label}
          </AppButton>
        ))}
        {isOwnerAccount && (
          <div className="w-full sm:ml-auto sm:w-auto">
            <AppButton variant="danger" size="sm" icon={<RefreshCcw size={13} />} onClick={handleResetBoard}>
              Сбросить все с нуля
            </AppButton>
          </div>
        )}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'board' && (
          <motion.div
            key="board"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <AppSurface className="overflow-hidden">
              <MapControls filter={filter} onFilterChange={setFilter} stats={stats} />
              <div className="p-3 sm:p-4">
                <FloorPlan zones={zones} selectedId={selectedId} filter={filter} onSelectRoom={setSelectedId} />
              </div>
            </AppSurface>
          </motion.div>
        )}

        {activeTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <OverviewPanel zones={zones} />
          </motion.div>
        )}

        {activeTab === 'feed' && (
          <motion.div
            key="feed"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            <AppSurface className="overflow-hidden">
              <FeedPanel activity={activity} />
            </AppSurface>
          </motion.div>
        )}
      </AnimatePresence>

      <ZoneDetailDrawer
        zoneId={selectedId}
        zones={zones}
        role="taskmaster"
        workers={workers}
        operations={operations}
        onClose={() => setSelectedId(null)}
        onStatusChange={onZoneUpdate}
        onAssignOperation={handleAssignOperation}
        onAssignWorker={handleAssignWorker}
        onSaveNote={handleSaveNote}
      />
    </div>
  )
}

function MetricCard({ label, value, tone }: { label: string; value: number; tone: 'slate' | 'amber' | 'blue' | 'emerald' }) {
  const palette = {
    slate: 'text-slate-700 bg-slate-50',
    amber: 'text-amber-700 bg-amber-50',
    blue: 'text-blue-700 bg-blue-50',
    emerald: 'text-emerald-700 bg-emerald-50',
  }

  return (
    <AppSurface className={cn('p-4', palette[tone])}>
      <div className="font-mono text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-2 text-[28px] font-semibold leading-none">{value}</div>
    </AppSurface>
  )
}

function TaskLane({
  zones,
  workers,
  onSelect,
}: {
  zones: ZoneWithState[]
  workers: Profile[]
  onSelect: (zoneId: string) => void
}) {
  const visibleZones = useMemo(
    () =>
      [...zones].sort((left, right) => {
        const statusOrder: ZoneStatus[] = ['review', 'in_progress', 'new', 'done']
        return statusOrder.indexOf(left.status) - statusOrder.indexOf(right.status)
      }),
    [zones],
  )

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-slate-100 px-4 py-3 sm:px-5 sm:py-4">
        <h2 className="text-[15px] font-medium text-text-1">Все зоны</h2>
        <p className="text-[12px] text-text-4">Быстрый доступ к задаче, операции и исполнителю.</p>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto px-3 py-3 sm:px-4 sm:py-4">
        {visibleZones.map((zone) => {
          const room = ROOMS.find((item) => item.id === zone.zone_id)
          if (!room) return null

          const worker = workers.find((item) => item.id === zone.assigned_worker_id)

          return (
            <button
              key={zone.zone_id}
              onClick={() => onSelect(zone.zone_id)}
              className="w-full rounded-2xl border border-slate-100 bg-white px-3 py-3 text-left shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-slate-200 sm:px-4 sm:py-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.code}</div>
                  <div className="mt-1 text-[15px] font-medium text-text-1">{room.name}</div>
                  <div className="mt-1 text-[12px] text-text-3">
                    {zone.operation_types?.label ?? 'Операция не назначена'}
                  </div>
                  <div className="mt-1 text-[12px] text-text-4">
                    {worker?.display_name ?? 'Исполнитель не назначен'}
                  </div>
                </div>
                <StatusBadge status={zone.status} size="sm" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
