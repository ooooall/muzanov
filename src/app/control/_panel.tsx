'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROOMS, OPERATIONS, STATUSES } from '@/lib/constants'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatRelative } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, LayoutGrid, Zap, Archive } from 'lucide-react'
import type { ZoneWithState, Profile } from '@/types'
import type { TablesUpdate } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface Props {
  zones: ZoneWithState[]
  workers: Profile[]
  userId: string
  isOwnerAccount: boolean
}

type Tab = 'zones' | 'workers' | 'operations' | 'danger'
type WorkerStatus = 'pending' | 'active' | 'rejected'
type ManagedWorker = Profile & { status?: WorkerStatus }

export default function ControlPanel({ zones, workers, userId, isOwnerAccount }: Props) {
  const [tab, setTab] = useState<Tab>('zones')
  const [userFilter, setUserFilter] = useState<WorkerStatus>('pending')
  const router = useRouter()
  const supabase = createClient()
  const workersWithStatus = workers as ManagedWorker[]
  const getWorkerStatus = (worker: ManagedWorker): WorkerStatus => worker.status ?? 'active'
  const userManagementLocked = !isOwnerAccount
  const filteredWorkers = useMemo(
    () => workersWithStatus.filter((w) => getWorkerStatus(w) === userFilter),
    [workersWithStatus, userFilter]
  )
  const userCounts = useMemo(
    () => ({
      pending: workersWithStatus.filter((w) => getWorkerStatus(w) === 'pending').length,
      active: workersWithStatus.filter((w) => getWorkerStatus(w) === 'active').length,
      rejected: workersWithStatus.filter((w) => getWorkerStatus(w) === 'rejected').length,
    }),
    [workersWithStatus]
  )

  async function setZoneStatus(zoneId: string, status: ZoneStatus) {
    const update: TablesUpdate<'zone_states'> = { status, updated_at: new Date().toISOString() }
    if (status === 'idle') {
      update.started_at = null
      update.operation_type_id = null
      update.assigned_worker_id = null
      update.notes = null
    }
    if (status === 'in_progress') update.started_at = new Date().toISOString()

    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) {
      await supabase.from('activity_log').insert({
        zone_id: zoneId, user_id: userId,
        action: 'status_change', details: { new_status: status },
      })
      toast.success(STATUSES[status].label)
      router.refresh()
    }
  }

  async function assignOp(zoneId: string, opCode: string) {
    const { data: op } = await supabase.from('operation_types').select('id').eq('code', opCode).single()
    if (!op) return
    const update: TablesUpdate<'zone_states'> = { operation_type_id: op.id, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) { toast.success(`Операция ${opCode}`); router.refresh() }
  }

  async function assignWorker(zoneId: string, workerId: string | null) {
    const update: TablesUpdate<'zone_states'> = { assigned_worker_id: workerId, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) { toast.success(workerId ? 'Назначен' : 'Снят'); router.refresh() }
  }

  async function resetAll() {
    if (!confirm('Сбросить ВСЕ зоны? Это действие нельзя отменить.')) return
    const update: TablesUpdate<'zone_states'> = {
      status: 'idle', operation_type_id: null, assigned_worker_id: null,
      notes: null, started_at: null, updated_at: new Date().toISOString(),
    }
    await supabase.from('zone_states').update(update).neq('zone_id', '')
    toast.success('Все зоны сброшены')
    router.refresh()
  }

  async function changeWorkerRole(workerId: string, role: 'worker' | 'taskmaster' | 'viewer') {
    if (userManagementLocked) {
      toast.error('Изменение ролей доступно только владельцу')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role }),
      })
      if (!response.ok) throw new Error('failed')
      toast.success(`Роль: ${role}`)
      router.refresh()
    } catch {
      toast.error('Ошибка изменения роли')
    }
  }

  async function changeWorkerStatus(workerId: string, status: WorkerStatus) {
    if (userManagementLocked) {
      toast.error('Модерация пользователей доступна только владельцу')
      return
    }

    try {
      const response = await fetch(`/api/admin/users/${workerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      if (!response.ok) throw new Error('failed')
      const labels: Record<WorkerStatus, string> = {
        pending: 'Ожидает',
        active: 'Активирован',
        rejected: 'Отклонен',
      }
      toast.success(labels[status])
      router.refresh()
    } catch {
      toast.error('Ошибка изменения статуса')
    }
  }

  const TABS = [
    { id: 'zones',      icon: LayoutGrid, label: 'Зоны' },
    { id: 'workers',    icon: Users,      label: 'Сотрудники' },
    { id: 'operations', icon: Zap,        label: 'Операции' },
    { id: 'danger',     icon: Archive,    label: 'Опасно' },
  ] as const

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-[22px] font-medium text-text-1">Control Panel</h1>
        <p className="text-[13px] text-text-3 mt-1">Полный контроль над операциями</p>
      </div>

      <div className="flex gap-1 p-1 rounded-lg bg-elevated border border-border">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2 rounded font-mono text-[10px] tracking-wide uppercase transition-colors',
              tab === id ? 'bg-active text-text-1' : 'text-text-4 hover:text-text-3'
            )}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {tab === 'zones' && (
        <div className="space-y-2">
          {ROOMS.map(room => {
            const zone = zones.find(z => z.zone_id === room.id)
            if (!zone) return null
            return (
              <div key={room.id} className="rounded-lg bg-elevated border border-border p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] tracking-wide text-text-4">{room.code}</span>
                      <span className="font-mono text-[9px] text-text-5">{room.area} м²</span>
                    </div>
                    <span className="text-[15px] font-medium text-text-1">{room.name}</span>
                  </div>
                  <StatusBadge status={zone.status} size="sm" />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(STATUSES) as ZoneStatus[]).map(s => (
                    <button key={s} onClick={() => setZoneStatus(room.id, s)}
                      className={cn(
                        'px-2.5 py-1 rounded border font-mono text-[9px] tracking-wide uppercase transition-colors',
                        zone.status === s
                          ? 'border-border-strong text-text-1 bg-active'
                          : 'border-border-soft text-text-5 hover:border-border hover:text-text-4'
                      )}
                    >
                      {STATUSES[s].sub}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  {OPERATIONS.map(op => (
                    <button key={op.code} onClick={() => assignOp(room.id, op.code)}
                      className={cn(
                        'px-2.5 py-1 rounded border font-mono text-[9px] tracking-wide uppercase transition-colors',
                        zone.operation_types?.code === op.code
                          ? 'border-accent/40 bg-accent-soft text-accent'
                          : 'border-border-soft text-text-5 hover:border-border'
                      )}
                    >
                      {op.code}
                    </button>
                  ))}
                </div>

                <div className="flex flex-wrap gap-1">
                  <button onClick={() => assignWorker(room.id, null)}
                    className={cn(
                      'px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-colors',
                      !zone.assigned_worker_id ? 'border-border text-text-3' : 'border-border-soft text-text-5'
                    )}
                  >
                    Не назначен
                  </button>
                  {workers.map(w => (
                    <button key={w.id} onClick={() => assignWorker(room.id, w.id)}
                      className={cn(
                        'px-2.5 py-1 rounded border font-mono text-[9px] uppercase transition-colors',
                        zone.assigned_worker_id === w.id
                          ? 'border-accent/40 bg-accent-soft text-accent'
                          : 'border-border-soft text-text-5 hover:border-border'
                      )}
                    >
                      {w.display_name ?? w.id.slice(0, 8)}
                    </button>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {tab === 'workers' && (
        <div className="space-y-2">
          {userManagementLocked && (
            <div className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-[12px] text-amber-800">
              Управление ролями и модерацией доступно только аккаунту владельца.
            </div>
          )}

          <div className="flex gap-1 p-1 rounded-lg bg-elevated border border-border">
            {([
              ['pending', 'Ожидают'],
              ['active', 'Активные'],
              ['rejected', 'Отклонены'],
            ] as const).map(([id, label]) => (
              <button
                key={id}
                onClick={() => setUserFilter(id)}
                className={cn(
                  'flex-1 py-2 rounded font-mono text-[10px] tracking-wide uppercase transition-colors',
                  userFilter === id ? 'bg-active text-text-1' : 'text-text-4 hover:text-text-3'
                )}
              >
                {label} ({userCounts[id]})
              </button>
            ))}
          </div>

          {workers.length === 0 ? (
            <div className="py-12 text-center text-text-4 font-mono text-[11px]">
              Нет зарегистрированных пользователей
            </div>
          ) : (
            filteredWorkers.map(w => {
              const status = getWorkerStatus(w)
              return (
              <div key={w.id} className="flex items-center gap-4 p-4 rounded-lg bg-elevated border border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-[14px] font-medium text-text-1">{w.display_name ?? 'Без имени'}</div>
                    <span
                      className={cn(
                        'px-2 py-0.5 rounded border font-mono text-[9px] uppercase tracking-wide',
                        status === 'active' && 'border-success/30 bg-success-soft text-success',
                        status === 'pending' && 'border-accent/30 bg-accent-soft text-accent',
                        status === 'rejected' && 'border-danger/30 bg-danger-soft text-danger'
                      )}
                    >
                      {status}
                    </span>
                  </div>
                  <div className="text-[11px] text-text-4 font-mono mt-0.5">{w.id.slice(0, 8)}…</div>
                  <div className="text-[11px] text-text-4 mt-0.5">{formatRelative(w.created_at)}</div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex gap-1">
                    {status !== 'active' && (
                      <button
                        onClick={() => changeWorkerStatus(w.id, 'active')}
                        disabled={userManagementLocked}
                        className="px-2.5 py-1 rounded border border-success/30 bg-success-soft text-success font-mono text-[9px] tracking-wide uppercase"
                      >
                        Approve
                      </button>
                    )}
                    {status !== 'rejected' && (
                      <button
                        onClick={() => changeWorkerStatus(w.id, 'rejected')}
                        disabled={userManagementLocked}
                        className="px-2.5 py-1 rounded border border-danger/30 bg-danger-soft text-danger font-mono text-[9px] tracking-wide uppercase"
                      >
                        Reject
                      </button>
                    )}
                  </div>

                  <div className="flex gap-1">
                  {(['viewer', 'worker', 'taskmaster'] as const).map(r => (
                    <button key={r} onClick={() => changeWorkerRole(w.id, r)}
                      disabled={userManagementLocked}
                      className={cn(
                        'px-2.5 py-1 rounded border font-mono text-[9px] tracking-wide uppercase transition-colors disabled:opacity-40 disabled:cursor-not-allowed',
                        w.role === r
                          ? 'border-accent/40 bg-accent-soft text-accent'
                          : 'border-border-soft text-text-5 hover:border-border'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                  </div>
                </div>
              </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'operations' && (
        <div className="space-y-2">
          {OPERATIONS.map(op => (
            <div key={op.code} className="flex items-center gap-4 p-4 rounded-lg bg-elevated border border-border">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-mono text-[10px] text-accent tracking-wide">{op.code}</span>
                </div>
                <div className="text-[14px] text-text-1">{op.label}</div>
                <div className="text-[11px] text-text-4">{op.sub}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'danger' && (
        <div className="p-4 rounded-lg bg-danger-soft border border-danger/20 space-y-3">
          <h3 className="font-mono text-[11px] tracking-wide text-danger uppercase">Опасные действия</h3>
          <p className="text-[12px] text-text-3">Это действие нельзя отменить.</p>
          <button onClick={resetAll}
            className="w-full py-3 rounded-lg bg-danger text-white font-mono text-[11px] tracking-wide uppercase hover:bg-danger/90 transition-colors"
          >
            Сбросить все зоны → IDLE
          </button>
        </div>
      )}
    </div>
  )
}
