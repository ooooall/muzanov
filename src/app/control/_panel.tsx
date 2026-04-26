'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { ROOMS, STATUSES } from '@/lib/constants'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatRelative } from '@/lib/utils'
import { toast } from 'sonner'
import { Users, LayoutGrid, Zap, AlertTriangle, CheckCircle, UserCheck, Clock, Plus, Trash2, Lock } from 'lucide-react'
import type { ZoneWithState, Profile } from '@/types'
import type { TablesUpdate } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface OperationType {
  id: string
  code: string
  label: string
  sub_label: string | null
  is_system: boolean
  created_by: string | null
}

interface Props {
  zones: ZoneWithState[]
  workers: Profile[]
  userId: string
  isOwnerAccount: boolean
}

type Tab = 'tasks' | 'zones' | 'workers' | 'operations'
type WorkerStatus = 'pending' | 'active' | 'rejected'

const tabVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 24 : -24, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -24 : 24, opacity: 0 }),
}

const TABS = [
  { id: 'tasks',      icon: UserCheck, label: 'Задачи' },
  { id: 'zones',      icon: LayoutGrid, label: 'Зоны' },
  { id: 'workers',    icon: Users,     label: 'Персонал' },
  { id: 'operations', icon: Zap,       label: 'Операции' },
] as const

export default function ControlPanel({ zones, workers, userId, isOwnerAccount }: Props) {
  const [tab, setTab] = useState<Tab>('tasks')
  const [prevTab, setPrevTab] = useState<Tab>('tasks')
  const [operations, setOperations] = useState<OperationType[]>([])
  const router = useRouter()
  const supabase = createClient()

  const tabOrder: Tab[] = ['tasks', 'zones', 'workers', 'operations']
  const dir = tabOrder.indexOf(tab) > tabOrder.indexOf(prevTab) ? 1 : -1

  function switchTab(t: Tab) {
    setPrevTab(tab)
    setTab(t)
  }

  const fetchOperations = useCallback(async () => {
    const { data } = await supabase.from('operation_types').select('*').order('is_system', { ascending: false }).order('created_at')
    if (data) setOperations(data as OperationType[])
  }, [supabase])

  useEffect(() => { fetchOperations() }, [fetchOperations])

  // ── Zone helpers ─────────────────────────────────────────────
  async function setZoneStatus(zoneId: string, status: ZoneStatus) {
    const update: TablesUpdate<'zone_states'> = { status, updated_at: new Date().toISOString() }
    if (status === 'idle') { update.started_at = null; update.operation_type_id = null; update.assigned_worker_id = null; update.notes = null }
    if (status === 'in_progress') update.started_at = new Date().toISOString()
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) { await supabase.from('activity_log').insert({ zone_id: zoneId, user_id: userId, action: 'status_change', details: { new_status: status } }); toast.success(STATUSES[status].label); router.refresh() }
  }

  async function assignOpToZone(zoneId: string, opId: string) {
    const update: TablesUpdate<'zone_states'> = { operation_type_id: opId, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) { toast.success('Операция назначена'); router.refresh() }
    else toast.error('Ошибка: ' + error.message)
  }

  async function assignWorkerToZone(zoneId: string, workerId: string | null) {
    const update: TablesUpdate<'zone_states'> = { assigned_worker_id: workerId, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) { toast.success(workerId ? 'Исполнитель назначен' : 'Снято'); router.refresh() }
  }

  async function assignFullTask(zoneId: string, opId: string, workerId: string) {
    const update: TablesUpdate<'zone_states'> = {
      operation_type_id: opId,
      assigned_worker_id: workerId,
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) {
      await supabase.from('activity_log').insert({ zone_id: zoneId, user_id: userId, action: 'operation_assigned', details: { op_id: opId, worker_id: workerId } })
      toast.success('Задача назначена')
      router.refresh()
    } else toast.error('Ошибка назначения')
  }

  async function changeWorkerStatus(workerId: string, status: WorkerStatus) {
    if (!isOwnerAccount) { toast.error('Только владелец может управлять персоналом'); return }
    const res = await fetch(`/api/admin/users/${workerId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) })
    if (res.ok) { toast.success(status === 'active' ? 'Одобрен' : status === 'rejected' ? 'Отклонён' : 'Статус изменён'); router.refresh() }
    else toast.error('Ошибка')
  }

  async function changeWorkerRole(workerId: string, role: string) {
    if (!isOwnerAccount) { toast.error('Только владелец может менять роли'); return }
    const res = await fetch(`/api/admin/users/${workerId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role }) })
    if (res.ok) { toast.success('Роль изменена'); router.refresh() }
  }

  async function deleteOperation(id: string) {
    const res = await fetch(`/api/operations/${id}`, { method: 'DELETE' })
    if (res.ok) { toast.success('Операция удалена'); fetchOperations() }
    else { const d = await res.json(); toast.error(d.error ?? 'Ошибка') }
  }

  const activeWorkers = workers.filter(w => (w as Profile & { status?: string }).status !== 'pending' && (w as Profile & { status?: string }).status !== 'rejected')
  const pendingWorkers = workers.filter(w => (w as Profile & { status?: string }).status === 'pending')

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-[22px] font-bold text-text-1 tracking-tight">Управление</h1>
        <p className="text-[13px] text-text-3 mt-0.5">Задачи, персонал, операции</p>
      </div>

      {/* Pending badge */}
      {pendingWorkers.length > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          onClick={() => switchTab('workers')}
          className="w-full flex items-center gap-3 p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 text-left hover:bg-amber-500/15 transition-colors"
        >
          <Clock size={16} className="text-amber-500 flex-shrink-0" />
          <span className="text-[13px] text-amber-700 dark:text-amber-400 flex-1">
            {pendingWorkers.length} {pendingWorkers.length === 1 ? 'пользователь ожидает' : 'пользователей ожидают'} одобрения
          </span>
          <span className="text-[11px] font-mono text-amber-500 uppercase tracking-wide">Открыть →</span>
        </motion.button>
      )}

      {/* Tab navigation */}
      <div className="flex gap-1 p-1 rounded-xl bg-elevated border border-border">
        {TABS.map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => switchTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg font-mono text-[10px] tracking-wide uppercase transition-all',
              tab === id ? 'bg-canvas shadow-sm text-text-1 border border-border' : 'text-text-4 hover:text-text-3'
            )}
          >
            <Icon size={12} />
            <span className="hidden sm:inline">{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="relative overflow-hidden min-h-[200px]">
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={tab} custom={dir} variants={tabVariants} initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.18, ease: 'easeOut' }}
          >
            {tab === 'tasks' && <TasksTab zones={zones} operations={operations} workers={activeWorkers} onAssign={assignFullTask} />}
            {tab === 'zones' && <ZonesTab zones={zones} operations={operations} workers={activeWorkers} onSetStatus={setZoneStatus} onAssignOp={assignOpToZone} onAssignWorker={assignWorkerToZone} />}
            {tab === 'workers' && <WorkersTab workers={workers} isOwner={isOwnerAccount} onChangeStatus={changeWorkerStatus} onChangeRole={changeWorkerRole} />}
            {tab === 'operations' && <OperationsTab operations={operations} userId={userId} onDelete={deleteOperation} onCreated={fetchOperations} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── TASKS TAB ─────────────────────────────────────────────────────
function TasksTab({ zones, operations, workers, onAssign }: {
  zones: ZoneWithState[], operations: OperationType[], workers: Profile[],
  onAssign: (zoneId: string, opId: string, workerId: string) => void
}) {
  const [zoneId, setZoneId] = useState('')
  const [opId, setOpId] = useState('')
  const [workerId, setWorkerId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const assignedZones = zones.filter(z => z.assigned_worker_id)
  const freeZones = zones.filter(z => !z.assigned_worker_id)

  async function handleAssign() {
    if (!zoneId || !opId || !workerId) { toast.error('Заполните все поля'); return }
    setSubmitting(true)
    await onAssign(zoneId, opId, workerId)
    setZoneId(''); setOpId(''); setWorkerId('')
    setSubmitting(false)
  }

  return (
    <div className="space-y-5">
      {/* Assignment form */}
      <div className="rounded-xl bg-elevated border border-border p-4 space-y-3">
        <div className="font-mono text-[11px] tracking-wide text-text-4 uppercase">Назначить задачу</div>
        <div className="grid grid-cols-1 gap-2.5">
          <select value={zoneId} onChange={e => setZoneId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 focus:outline-none focus:border-border-strong"
          >
            <option value="">Выберите зону...</option>
            {ROOMS.map(r => {
              const zone = zones.find(z => z.zone_id === r.id)
              return <option key={r.id} value={r.id}>{r.name} ({r.code}){zone?.assigned_worker_id ? ' · занята' : ''}</option>
            })}
          </select>
          <select value={opId} onChange={e => setOpId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 focus:outline-none focus:border-border-strong"
          >
            <option value="">Выберите операцию...</option>
            {operations.map(op => (
              <option key={op.id} value={op.id}>{op.label}</option>
            ))}
          </select>
          <select value={workerId} onChange={e => setWorkerId(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 focus:outline-none focus:border-border-strong"
          >
            <option value="">Выберите исполнителя...</option>
            {workers.filter(w => w.role === 'worker').map(w => (
              <option key={w.id} value={w.id}>{w.display_name ?? w.id.slice(0, 8)}</option>
            ))}
          </select>
        </div>
        <button onClick={handleAssign} disabled={submitting || !zoneId || !opId || !workerId}
          className="w-full py-2.5 rounded-lg bg-accent text-black font-mono text-[11px] tracking-wide uppercase disabled:opacity-40 hover:bg-accent/90 transition-colors"
        >
          {submitting ? 'Назначаем...' : 'Назначить задачу'}
        </button>
      </div>

      {/* Active assignments */}
      {assignedZones.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[11px] tracking-wide text-text-4 uppercase px-1">Активные задачи ({assignedZones.length})</div>
          {assignedZones.map(zone => {
            const room = ROOMS.find(r => r.id === zone.zone_id)
            if (!room) return null
            const worker = workers.find(w => w.id === zone.assigned_worker_id)
            return (
              <div key={zone.zone_id} className="flex items-center gap-3 p-3.5 rounded-xl bg-elevated border border-border">
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] font-semibold text-text-1 truncate">{room.name}</div>
                  <div className="text-[11px] text-text-3 mt-0.5">
                    {zone.operation_types?.label ?? '—'} · {worker?.display_name ?? 'Исполнитель'}
                  </div>
                </div>
                <StatusBadge status={zone.status} size="sm" />
              </div>
            )
          })}
        </div>
      )}

      {assignedZones.length === 0 && (
        <div className="text-center py-8 text-text-4 text-[13px]">Нет активных задач</div>
      )}
    </div>
  )
}

// ── ZONES TAB ─────────────────────────────────────────────────────
function ZonesTab({ zones, operations, workers, onSetStatus, onAssignOp, onAssignWorker }: {
  zones: ZoneWithState[], operations: OperationType[], workers: Profile[],
  onSetStatus: (id: string, s: ZoneStatus) => void,
  onAssignOp: (id: string, opId: string) => void,
  onAssignWorker: (id: string, wId: string | null) => void,
}) {
  return (
    <div className="space-y-2">
      {ROOMS.map(room => {
        const zone = zones.find(z => z.zone_id === room.id)
        if (!zone) return null
        return (
          <div key={room.id} className="rounded-xl bg-elevated border border-border p-4 space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-[10px] text-text-4">{room.code}</span>
                  <span className="font-mono text-[9px] text-text-5">{room.area} м²</span>
                </div>
                <span className="text-[15px] font-semibold text-text-1">{room.name}</span>
              </div>
              <StatusBadge status={zone.status} size="sm" />
            </div>
            {/* Status buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(Object.keys(STATUSES) as ZoneStatus[]).map(s => (
                <button key={s} onClick={() => onSetStatus(room.id, s)}
                  className={cn(
                    'px-2.5 py-1 rounded-lg border font-mono text-[9px] tracking-wide uppercase transition-all',
                    zone.status === s ? 'border-border-strong text-text-1 bg-active' : 'border-border-soft text-text-5 hover:border-border hover:text-text-3'
                  )}
                >
                  {STATUSES[s].sub}
                </button>
              ))}
            </div>
            {/* Operation assignment */}
            <select
              value={zone.operation_type_id ?? ''}
              onChange={e => e.target.value && onAssignOp(room.id, e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-border text-[12px] text-text-2 focus:outline-none focus:border-border-strong"
            >
              <option value="">Операция не назначена</option>
              {operations.map(op => (
                <option key={op.id} value={op.id}>{op.label}</option>
              ))}
            </select>
            {/* Worker assignment */}
            <select
              value={zone.assigned_worker_id ?? ''}
              onChange={e => onAssignWorker(room.id, e.target.value || null)}
              className="w-full px-3 py-2 rounded-lg bg-canvas border border-border text-[12px] text-text-2 focus:outline-none focus:border-border-strong"
            >
              <option value="">Исполнитель не назначен</option>
              {workers.filter(w => w.role === 'worker').map(w => (
                <option key={w.id} value={w.id}>{w.display_name ?? w.id.slice(0, 8)}</option>
              ))}
            </select>
          </div>
        )
      })}
    </div>
  )
}

// ── WORKERS TAB ───────────────────────────────────────────────────
function WorkersTab({ workers, isOwner, onChangeStatus, onChangeRole }: {
  workers: Profile[], isOwner: boolean,
  onChangeStatus: (id: string, s: WorkerStatus) => void,
  onChangeRole: (id: string, r: string) => void,
}) {
  const [filter, setFilter] = useState<WorkerStatus>('pending')
  type WP = Profile & { status?: string }
  const getStatus = (w: WP): WorkerStatus => (w.status as WorkerStatus) ?? 'active'
  const counts = { pending: workers.filter(w => getStatus(w as WP) === 'pending').length, active: workers.filter(w => getStatus(w as WP) === 'active').length, rejected: workers.filter(w => getStatus(w as WP) === 'rejected').length }
  const filtered = workers.filter(w => getStatus(w as WP) === filter)

  return (
    <div className="space-y-4">
      {!isOwner && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-elevated border border-border text-text-4 text-[12px]">
          <Lock size={13} className="flex-shrink-0" />
          Управление персоналом доступно только владельцу
        </div>
      )}
      <div className="flex gap-1.5 p-1 bg-elevated rounded-xl border border-border">
        {([['pending', `Ожидают (${counts.pending})`], ['active', `Активные (${counts.active})`], ['rejected', `Отклонённые (${counts.rejected})`]] as [WorkerStatus, string][]).map(([id, label]) => (
          <button key={id} onClick={() => setFilter(id)}
            className={cn('flex-1 py-2 rounded-lg text-[11px] font-mono uppercase tracking-wide transition-all',
              filter === id ? 'bg-canvas text-text-1 shadow-sm border border-border' : 'text-text-4 hover:text-text-3')}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="space-y-2">
        {filtered.length === 0 && <div className="py-10 text-center text-text-4 text-[13px]">Нет пользователей</div>}
        {filtered.map(w => (
          <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 p-4 rounded-xl bg-elevated border border-border"
          >
            <div className="w-10 h-10 rounded-full bg-accent-soft border border-accent/20 flex items-center justify-center font-bold text-[14px] text-accent flex-shrink-0">
              {(w.display_name ?? '?')[0].toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold text-text-1">{w.display_name ?? 'Без имени'}</div>
              <div className="text-[11px] text-text-4 font-mono mt-0.5">{w.id.slice(0, 10)}…</div>
            </div>
            {isOwner && (
              <div className="flex gap-2">
                {filter === 'pending' && (
                  <>
                    <button onClick={() => onChangeStatus(w.id, 'active')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success-soft border border-success/20 text-success text-[11px] font-mono uppercase hover:bg-success/15 transition-colors">
                      <CheckCircle size={11} /> Принять
                    </button>
                    <button onClick={() => onChangeStatus(w.id, 'rejected')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-danger-soft border border-danger/20 text-danger text-[11px] font-mono uppercase hover:bg-danger/15 transition-colors">
                      <AlertTriangle size={11} /> Отклонить
                    </button>
                  </>
                )}
                {filter === 'active' && (
                  <select value={w.role} onChange={e => onChangeRole(w.id, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg border border-border bg-canvas text-[12px] text-text-2 focus:outline-none"
                  >
                    {['viewer','worker','taskmaster'].map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                )}
                {filter === 'rejected' && (
                  <button onClick={() => onChangeStatus(w.id, 'active')}
                    className="px-3 py-1.5 rounded-lg bg-elevated border border-border text-text-3 text-[11px] font-mono uppercase hover:border-border-strong transition-colors">
                    Восстановить
                  </button>
                )}
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  )
}

// ── OPERATIONS TAB ────────────────────────────────────────────────
function OperationsTab({ operations, userId, onDelete, onCreated }: {
  operations: OperationType[], userId: string,
  onDelete: (id: string) => void, onCreated: () => void
}) {
  const [showForm, setShowForm] = useState(false)
  const [label, setLabel] = useState('')
  const [subLabel, setSubLabel] = useState('')
  const [creating, setCreating] = useState(false)

  async function handleCreate() {
    if (!label.trim()) { toast.error('Введите название'); return }
    setCreating(true)
    const res = await fetch('/api/operations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ label, sub_label: subLabel }) })
    setCreating(false)
    if (res.ok) { toast.success('Операция создана'); setLabel(''); setSubLabel(''); setShowForm(false); onCreated() }
    else { const d = await res.json(); toast.error(d.error ?? 'Ошибка') }
  }

  const systemOps = operations.filter(o => o.is_system)
  const customOps = operations.filter(o => !o.is_system)

  return (
    <div className="space-y-4">
      {/* Create form */}
      <AnimatePresence>
        {showForm ? (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-xl bg-elevated border border-border p-4 space-y-3 overflow-hidden"
          >
            <div className="font-mono text-[11px] tracking-wide text-text-4 uppercase">Новая операция</div>
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="Название операции *"
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong" />
            <input value={subLabel} onChange={e => setSubLabel(e.target.value)} placeholder="Описание (необязательно)"
              className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong" />
            <div className="flex gap-2">
              <button onClick={handleCreate} disabled={creating}
                className="flex-1 py-2.5 rounded-lg bg-accent text-black font-mono text-[11px] tracking-wide uppercase disabled:opacity-40">
                {creating ? 'Создаём...' : 'Создать'}
              </button>
              <button onClick={() => setShowForm(false)}
                className="px-4 py-2.5 rounded-lg bg-elevated border border-border text-text-3 font-mono text-[11px] uppercase hover:border-border-strong transition-colors">
                Отмена
              </button>
            </div>
          </motion.div>
        ) : (
          <button onClick={() => setShowForm(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-border text-text-4 hover:border-border-strong hover:text-text-3 transition-colors font-mono text-[11px] uppercase tracking-wide"
          >
            <Plus size={13} /> Создать свою операцию
          </button>
        )}
      </AnimatePresence>

      {/* System operations */}
      <div className="space-y-2">
        <div className="font-mono text-[10px] tracking-wide text-text-5 uppercase px-1 flex items-center gap-2">
          <Lock size={10} /> Системные операции
        </div>
        {systemOps.map(op => (
          <div key={op.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-elevated border border-border">
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-text-1">{op.label}</div>
              {op.sub_label && <div className="text-[11px] text-text-4 mt-0.5">{op.sub_label}</div>}
            </div>
            <span className="font-mono text-[9px] text-text-5 bg-elevated border border-border-soft px-2 py-0.5 rounded">
              {op.code}
            </span>
          </div>
        ))}
      </div>

      {/* Custom operations */}
      {customOps.length > 0 && (
        <div className="space-y-2">
          <div className="font-mono text-[10px] tracking-wide text-text-5 uppercase px-1">Мои операции</div>
          {customOps.map(op => (
            <div key={op.id} className="flex items-center gap-3 p-3.5 rounded-xl bg-elevated border border-accent/15">
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-text-1">{op.label}</div>
                {op.sub_label && <div className="text-[11px] text-text-4 mt-0.5">{op.sub_label}</div>}
              </div>
              {op.created_by === userId && (
                <button onClick={() => onDelete(op.id)}
                  className="w-8 h-8 grid place-items-center rounded-lg text-danger hover:bg-danger-soft transition-colors">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
