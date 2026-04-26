'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { LayoutGrid, Plus, Trash2, UserCheck, Users, Wrench } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { createClient } from '@/lib/supabase/client'
import { ROOMS } from '@/lib/constants'
import { AppButton } from '@/components/shared/AppButton'
import { AppSurface } from '@/components/shared/AppSurface'
import { FieldLabel, SelectField, TextInput } from '@/components/shared/AppField'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn, pluralRu } from '@/lib/utils'
import { buildZoneUpdate } from '@/lib/zone-workflow'
import type { OperationType, Profile, ZoneWithState } from '@/types'
import type { TablesUpdate } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface Props {
  zones: ZoneWithState[]
  workers: Profile[]
  userId: string
  isOwnerAccount: boolean
}

type Tab = 'tasks' | 'zones' | 'workers' | 'operations'
type WorkerStatus = 'pending' | 'active' | 'rejected'

const TABS: Array<{ id: Tab; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { id: 'tasks', label: 'Назначения', icon: UserCheck },
  { id: 'zones', label: 'Зоны', icon: LayoutGrid },
  { id: 'workers', label: 'Команда', icon: Users },
  { id: 'operations', label: 'Операции', icon: Wrench },
]

export default function ControlPanel({ zones, workers, userId, isOwnerAccount }: Props) {
  const [tab, setTab] = useState<Tab>('tasks')
  const [operations, setOperations] = useState<OperationType[]>([])
  const [supabase] = useState(() => createClient())
  const router = useRouter()

  const fetchOperations = useCallback(async () => {
    const { data } = await supabase
      .from('operation_types')
      .select('*')
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true })

    if (data) setOperations(data as OperationType[])
  }, [supabase])

  useEffect(() => {
    fetchOperations()
  }, [fetchOperations])

  const activeWorkers = useMemo(
    () => workers.filter((worker) => (worker as Profile & { status?: WorkerStatus }).status !== 'pending' && (worker as Profile & { status?: WorkerStatus }).status !== 'rejected'),
    [workers],
  )
  const pendingWorkers = useMemo(
    () => workers.filter((worker) => (worker as Profile & { status?: WorkerStatus }).status === 'pending'),
    [workers],
  )

  async function setZoneStatus(zoneId: string, status: ZoneStatus) {
    const update = buildZoneUpdate(status)
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) {
      await supabase.from('activity_log').insert({
        zone_id: zoneId,
        user_id: userId,
        action: 'status_change',
        details: { new_status: status },
      })
      toast.success('Статус обновлён')
      router.refresh()
    }
  }

  async function assignOpToZone(zoneId: string, operationId: string) {
    const operation = operations.find((item) => item.id === operationId)
    if (!operation) {
      toast.error('Операция не найдена')
      return
    }

    const update: TablesUpdate<'zone_states'> = {
      operation_type_id: operationId,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

    if (!error) {
      await supabase.from('activity_log').insert({
        zone_id: zoneId,
        user_id: userId,
        action: 'operation_assigned',
        details: { op_id: operation.id, op_code: operation.code },
      })
      toast.success('Операция назначена')
      router.refresh()
      return
    }

    toast.error('Не удалось назначить операцию')
  }

  async function assignWorkerToZone(zoneId: string, workerId: string | null) {
    const update: TablesUpdate<'zone_states'> = {
      assigned_worker_id: workerId,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

    if (!error) {
      await supabase.from('activity_log').insert({
        zone_id: zoneId,
        user_id: userId,
        action: 'worker_assigned',
        details: { worker_id: workerId },
      })
      toast.success(workerId ? 'Исполнитель назначен' : 'Исполнитель снят')
      router.refresh()
    }
  }

  async function assignFullTask(zoneId: string, operationId: string, workerId: string) {
    const update: TablesUpdate<'zone_states'> = {
      operation_type_id: operationId,
      assigned_worker_id: workerId,
      status: 'new',
      started_at: null,
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)

    if (!error) {
      await supabase.from('activity_log').insert({
        zone_id: zoneId,
        user_id: userId,
        action: 'operation_assigned',
        details: { op_id: operationId, worker_id: workerId },
      })
      toast.success('Задача назначена')
      router.refresh()
      return
    }

    toast.error('Не удалось назначить задачу')
  }

  async function changeWorkerStatus(workerId: string, status: WorkerStatus) {
    if (!isOwnerAccount) {
      toast.error('Управление персоналом доступно только владельцу')
      return
    }

    const response = await fetch(`/api/admin/users/${workerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })

    if (response.ok) {
      toast.success('Статус сотрудника обновлён')
      router.refresh()
      return
    }

    toast.error('Не удалось изменить статус')
  }

  async function changeWorkerRole(workerId: string, role: string) {
    if (!isOwnerAccount) {
      toast.error('Менять роли может только владелец')
      return
    }

    const response = await fetch(`/api/admin/users/${workerId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role }),
    })

    if (response.ok) {
      toast.success('Роль обновлена')
      router.refresh()
      return
    }

    toast.error('Не удалось изменить роль')
  }

  async function deleteOperation(id: string) {
    const response = await fetch(`/api/operations/${id}`, { method: 'DELETE' })
    if (response.ok) {
      toast.success('Операция удалена')
      fetchOperations()
      return
    }

    const data = await response.json()
    toast.error(data.error ?? 'Не удалось удалить операцию')
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-[24px] font-semibold tracking-tight text-text-1">Управление</h1>
        <p className="text-[13px] text-text-3">Назначения, команда и справочник операций в одном чистом контуре.</p>
      </div>

      {pendingWorkers.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setTab('workers')}
          className="flex w-full items-center gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-4 text-left shadow-sm transition-all duration-200 hover:border-amber-200"
        >
          <div className="text-[13px] text-amber-800">
            {pendingWorkers.length} {pluralRu(pendingWorkers.length, 'сотрудник', 'сотрудника', 'сотрудников')} ожидают одобрения
          </div>
          <div className="ml-auto font-mono text-[10px] uppercase tracking-wide text-amber-700">Открыть</div>
        </motion.button>
      )}

      <div className="flex flex-wrap gap-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <AppButton key={id} variant={tab === id ? 'primary' : 'secondary'} size="sm" icon={<Icon size={13} />} onClick={() => setTab(id)}>
            {label}
          </AppButton>
        ))}
      </div>

      {tab === 'tasks' && <TasksTab zones={zones} operations={operations} workers={activeWorkers} onAssign={assignFullTask} />}
      {tab === 'zones' && (
        <ZonesTab
          zones={zones}
          operations={operations}
          workers={activeWorkers}
          onSetStatus={setZoneStatus}
          onAssignOp={assignOpToZone}
          onAssignWorker={assignWorkerToZone}
        />
      )}
      {tab === 'workers' && (
        <WorkersTab workers={workers} isOwner={isOwnerAccount} onChangeStatus={changeWorkerStatus} onChangeRole={changeWorkerRole} />
      )}
      {tab === 'operations' && (
        <OperationsTab operations={operations} userId={userId} onDelete={deleteOperation} onCreated={fetchOperations} />
      )}
    </div>
  )
}

function TasksTab({
  zones,
  operations,
  workers,
  onAssign,
}: {
  zones: ZoneWithState[]
  operations: OperationType[]
  workers: Profile[]
  onAssign: (zoneId: string, operationId: string, workerId: string) => Promise<void>
}) {
  const [zoneId, setZoneId] = useState('')
  const [operationId, setOperationId] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const assignedZones = zones.filter((zone) => zone.assigned_worker_id)

  async function handleAssign() {
    if (!zoneId || !operationId || !workerId) {
      toast.error('Заполните все поля')
      return
    }

    setSubmitting(true)
    await onAssign(zoneId, operationId, workerId)
    setZoneId('')
    setOperationId('')
    setWorkerId('')
    setSubmitting(false)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <AppSurface className="space-y-4 p-5">
        <div>
          <h2 className="text-[16px] font-medium text-text-1">Выдать задачу</h2>
          <p className="mt-1 text-[12px] text-text-4">Операция привяжется к зоне и исполнителю сразу.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <FieldLabel>Зона</FieldLabel>
            <SelectField value={zoneId} onChange={(event) => setZoneId(event.target.value)}>
              <option value="">Выберите зону</option>
              {ROOMS.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.code})
                </option>
              ))}
            </SelectField>
          </div>

          <div className="space-y-2">
            <FieldLabel>Операция</FieldLabel>
            <SelectField value={operationId} onChange={(event) => setOperationId(event.target.value)}>
              <option value="">Выберите операцию</option>
              {operations.map((operation) => (
                <option key={operation.id} value={operation.id}>
                  {operation.label}
                </option>
              ))}
            </SelectField>
          </div>

          <div className="space-y-2">
            <FieldLabel>Исполнитель</FieldLabel>
            <SelectField value={workerId} onChange={(event) => setWorkerId(event.target.value)}>
              <option value="">Выберите исполнителя</option>
              {workers
                .filter((worker) => worker.role === 'worker')
                .map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.display_name ?? worker.id.slice(0, 8)}
                  </option>
                ))}
            </SelectField>
          </div>
        </div>

        <AppButton variant="primary" onClick={handleAssign} disabled={submitting || !zoneId || !operationId || !workerId}>
          {submitting ? 'Назначаю' : 'Назначить задачу'}
        </AppButton>
      </AppSurface>

      <AppSurface className="overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-4">
          <h2 className="text-[16px] font-medium text-text-1">Активные назначения</h2>
        </div>
        <div className="space-y-3 px-4 py-4">
          {assignedZones.length === 0 && <div className="py-10 text-center text-[13px] text-text-4">Активных назначений пока нет</div>}
          {assignedZones.map((zone) => {
            const room = ROOMS.find((item) => item.id === zone.zone_id)
            const worker = workers.find((item) => item.id === zone.assigned_worker_id)
            if (!room) return null

            return (
              <div key={zone.zone_id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.code}</div>
                    <div className="mt-1 text-[15px] font-medium text-text-1">{room.name}</div>
                    <div className="mt-1 text-[12px] text-text-3">{zone.operation_types?.label ?? 'Операция не назначена'}</div>
                    <div className="mt-1 text-[12px] text-text-4">{worker?.display_name ?? 'Исполнитель не назначен'}</div>
                  </div>
                  <StatusBadge status={zone.status} size="sm" />
                </div>
              </div>
            )
          })}
        </div>
      </AppSurface>
    </div>
  )
}

function ZonesTab({
  zones,
  operations,
  workers,
  onSetStatus,
  onAssignOp,
  onAssignWorker,
}: {
  zones: ZoneWithState[]
  operations: OperationType[]
  workers: Profile[]
  onSetStatus: (id: string, status: ZoneStatus) => void
  onAssignOp: (id: string, operationId: string) => void
  onAssignWorker: (id: string, workerId: string | null) => void
}) {
  const statuses: ZoneStatus[] = ['new', 'in_progress', 'review', 'done']

  return (
    <div className="grid gap-4">
      {ROOMS.map((room) => {
        const zone = zones.find((item) => item.zone_id === room.id)
        if (!zone) return null

        return (
          <AppSurface key={room.id} className="p-5">
            <div className="grid gap-4 lg:grid-cols-[minmax(0,220px)_minmax(0,1fr)_minmax(0,220px)_minmax(0,220px)]">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.code}</div>
                <div className="mt-1 text-[15px] font-medium text-text-1">{room.name}</div>
                <div className="mt-2">
                  <StatusBadge status={zone.status} size="sm" />
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {statuses.map((status) => (
                  <AppButton
                    key={status}
                    variant={zone.status === status ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onSetStatus(room.id, status)}
                  >
                    {status === 'new' ? 'Новая' : status === 'in_progress' ? 'В работе' : status === 'review' ? 'На проверке' : 'Готово'}
                  </AppButton>
                ))}
              </div>

              <SelectField value={zone.operation_type_id ?? ''} onChange={(event) => event.target.value && onAssignOp(room.id, event.target.value)}>
                <option value="">Операция не выбрана</option>
                {operations.map((operation) => (
                  <option key={operation.id} value={operation.id}>
                    {operation.label}
                  </option>
                ))}
              </SelectField>

              <SelectField value={zone.assigned_worker_id ?? ''} onChange={(event) => onAssignWorker(room.id, event.target.value || null)}>
                <option value="">Исполнитель не выбран</option>
                {workers
                  .filter((worker) => worker.role === 'worker')
                  .map((worker) => (
                    <option key={worker.id} value={worker.id}>
                      {worker.display_name ?? worker.id.slice(0, 8)}
                    </option>
                  ))}
              </SelectField>
            </div>
          </AppSurface>
        )
      })}
    </div>
  )
}

function WorkersTab({
  workers,
  isOwner,
  onChangeStatus,
  onChangeRole,
}: {
  workers: Profile[]
  isOwner: boolean
  onChangeStatus: (id: string, status: WorkerStatus) => void
  onChangeRole: (id: string, role: string) => void
}) {
  const [filter, setFilter] = useState<WorkerStatus>('pending')

  const getStatus = (worker: Profile & { status?: string }): WorkerStatus => (worker.status as WorkerStatus) ?? 'active'
  const filteredWorkers = workers.filter((worker) => getStatus(worker as Profile & { status?: string }) === filter)

  return (
    <div className="space-y-4">
      {!isOwner && (
        <AppSurface className="p-4 text-[12px] text-text-4">
          Управление персоналом доступно только владельцу. Просмотр списка сохранён, управляющие действия скрыты.
        </AppSurface>
      )}

      <div className="flex flex-wrap gap-2">
        {(['pending', 'active', 'rejected'] as WorkerStatus[]).map((status) => (
          <AppButton key={status} variant={filter === status ? 'primary' : 'secondary'} size="sm" onClick={() => setFilter(status)}>
            {status === 'pending' ? 'Ожидают' : status === 'active' ? 'Активные' : 'Отклонённые'}
          </AppButton>
        ))}
      </div>

      <div className="grid gap-4">
        {filteredWorkers.length === 0 && <AppSurface className="p-8 text-center text-[13px] text-text-4">Пусто</AppSurface>}
        {filteredWorkers.map((worker) => (
          <AppSurface key={worker.id} className="p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-full border border-slate-100 bg-slate-50 text-[14px] font-semibold text-slate-700">
                {(worker.display_name ?? '?')[0].toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-[14px] font-medium text-text-1">{worker.display_name ?? 'Без имени'}</div>
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">{worker.id.slice(0, 10)}</div>
              </div>
              {isOwner && filter === 'pending' && (
                <>
                  <AppButton variant="success" size="sm" onClick={() => onChangeStatus(worker.id, 'active')}>
                    Принять
                  </AppButton>
                  <AppButton variant="danger" size="sm" onClick={() => onChangeStatus(worker.id, 'rejected')}>
                    Отклонить
                  </AppButton>
                </>
              )}
              {isOwner && filter === 'active' && (
                <select
                  value={worker.role}
                  onChange={(event) => onChangeRole(worker.id, event.target.value)}
                  className={cn(
                    'rounded-xl border border-slate-100 bg-white px-3 py-2 text-[12px] text-text-2 shadow-sm outline-none transition-all duration-200 focus:border-slate-200 focus:ring-2 focus:ring-slate-100',
                  )}
                >
                  {['viewer', 'worker', 'taskmaster'].map((role) => (
                    <option key={role} value={role}>
                      {role}
                    </option>
                  ))}
                </select>
              )}
              {isOwner && filter === 'rejected' && (
                <AppButton variant="secondary" size="sm" onClick={() => onChangeStatus(worker.id, 'active')}>
                  Вернуть
                </AppButton>
              )}
            </div>
          </AppSurface>
        ))}
      </div>
    </div>
  )
}

function OperationsTab({
  operations,
  userId,
  onDelete,
  onCreated,
}: {
  operations: OperationType[]
  userId: string
  onDelete: (id: string) => Promise<void>
  onCreated: () => Promise<void>
}) {
  const [label, setLabel] = useState('')
  const [subLabel, setSubLabel] = useState('')
  const [creating, setCreating] = useState(false)

  const systemOperations = operations.filter((operation) => operation.is_system)
  const customOperations = operations.filter((operation) => !operation.is_system)

  async function handleCreate() {
    if (!label.trim()) {
      toast.error('Введите название операции')
      return
    }

    setCreating(true)
    const response = await fetch('/api/operations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, sub_label: subLabel }),
    })
    setCreating(false)

    if (response.ok) {
      toast.success('Операция создана')
      setLabel('')
      setSubLabel('')
      await onCreated()
      return
    }

    const data = await response.json()
    toast.error(data.error ?? 'Не удалось создать операцию')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)]">
      <AppSurface className="space-y-4 p-5">
        <div>
          <h2 className="text-[16px] font-medium text-text-1">Новая операция</h2>
          <p className="mt-1 text-[12px] text-text-4">Пользовательская операция сразу появится в назначениях и карточках зон.</p>
        </div>

        <div className="space-y-3">
          <div className="space-y-2">
            <FieldLabel>Название</FieldLabel>
            <TextInput value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Например, финишная детальная уборка" />
          </div>

          <div className="space-y-2">
            <FieldLabel>Описание</FieldLabel>
            <TextInput value={subLabel} onChange={(event) => setSubLabel(event.target.value)} placeholder="Необязательно" />
          </div>
        </div>

        <AppButton variant="primary" icon={<Plus size={13} />} onClick={handleCreate} disabled={creating}>
          {creating ? 'Создаю' : 'Создать операцию'}
        </AppButton>
      </AppSurface>

      <div className="space-y-4">
        <OperationList title="Системные" operations={systemOperations} userId={userId} onDelete={onDelete} />
        <OperationList title="Пользовательские" operations={customOperations} userId={userId} onDelete={onDelete} />
      </div>
    </div>
  )
}

function OperationList({
  title,
  operations,
  userId,
  onDelete,
}: {
  title: string
  operations: OperationType[]
  userId: string
  onDelete: (id: string) => Promise<void>
}) {
  return (
    <AppSurface className="overflow-hidden">
      <div className="border-b border-slate-100 px-5 py-4">
        <h2 className="text-[15px] font-medium text-text-1">{title}</h2>
      </div>
      <div className="space-y-3 px-4 py-4">
        {operations.length === 0 && <div className="py-8 text-center text-[13px] text-text-4">Пусто</div>}
        {operations.map((operation) => (
          <div key={operation.id} className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white px-4 py-4 shadow-sm">
            <div className="min-w-0 flex-1">
              <div className="text-[14px] font-medium text-text-1">{operation.label}</div>
              <div className="mt-1 text-[12px] text-text-4">
                {operation.code}
                {operation.sub_label ? ` · ${operation.sub_label}` : ''}
              </div>
            </div>
            {!operation.is_system && operation.created_by === userId && (
              <AppButton variant="ghost" size="sm" icon={<Trash2 size={13} />} onClick={() => onDelete(operation.id)} />
            )}
          </div>
        ))}
      </div>
    </AppSurface>
  )
}
