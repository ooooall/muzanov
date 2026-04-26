'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FloorPlan } from '@/components/map/FloorPlan'
import { MapControls } from '@/components/map/MapControls'
import { FeedPanel } from '@/components/panels/FeedPanel'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { cn, formatRelative, formatElapsed } from '@/lib/utils'
import { ROOMS, STATUSES } from '@/lib/constants'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Play, Pause, CheckCircle, AlertTriangle, ChevronDown, ClipboardList, Map, Activity, Send } from 'lucide-react'
import type { ZoneWithState, ActivityWithZone } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface WorkerDashboardProps {
  zones: ZoneWithState[]
  activity: ActivityWithZone[]
  userId: string
  onZoneUpdate: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
}

type Tab = 'tasks' | 'map' | 'feed'

const tabVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 32 : -32, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -32 : 32, opacity: 0 }),
}

export function WorkerDashboard({ zones, activity, userId, onZoneUpdate }: WorkerDashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>('tasks')
  const [prevTab, setPrevTab] = useState<Tab>('tasks')
  const [filter, setFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const supabase = createClient()

  const assignedZones = zones.filter(z => z.assigned_worker_id === userId)
  const tabOrder: Tab[] = ['tasks', 'map', 'feed']
  const dir = tabOrder.indexOf(activeTab) > tabOrder.indexOf(prevTab) ? 1 : -1

  const stats = {
    in_progress: zones.filter(z => z.status === 'in_progress').length,
    attention:   zones.filter(z => z.status === 'attention').length,
    completed:   zones.filter(z => z.status === 'completed').length,
    idle:        zones.filter(z => z.status === 'idle').length,
  }

  function switchTab(t: Tab) {
    setPrevTab(activeTab)
    setActiveTab(t)
  }

  async function handleSaveNote(zoneId: string, note: string) {
    const update: TablesUpdate<'zone_states'> = { notes: note, updated_at: new Date().toISOString() }
    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zoneId)
    if (!error) {
      const log: TablesInsert<'activity_log'> = { zone_id: zoneId, user_id: userId, action: 'note_added', details: { note } }
      await supabase.from('activity_log').insert(log)
    }
    return error
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Tab bar */}
      <div className="flex border-b border-border-soft bg-canvas sticky top-14 z-20">
        {([
          { id: 'tasks' as Tab, icon: ClipboardList, label: `Задачи${assignedZones.length ? ` (${assignedZones.length})` : ''}` },
          { id: 'map'   as Tab, icon: Map,           label: 'Карта' },
          { id: 'feed'  as Tab, icon: Activity,      label: 'Лента' },
        ]).map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => switchTab(id)}
            className={cn(
              'flex-1 flex items-center justify-center gap-1.5 py-3 font-mono text-[11px] tracking-wide uppercase border-b-2 transition-colors',
              activeTab === id ? 'border-accent text-text-1' : 'border-transparent text-text-4 hover:text-text-3'
            )}
          >
            <Icon size={13} />
            <span className="hidden sm:inline">{label}</span>
            <span className="sm:hidden">{id === 'tasks' ? `Задачи${assignedZones.length ? ` (${assignedZones.length})` : ''}` : label}</span>
          </button>
        ))}
      </div>

      {/* Animated content */}
      <div className="flex-1 min-h-0 relative overflow-hidden">
        <AnimatePresence mode="wait" custom={dir}>
          {activeTab === 'tasks' && (
            <motion.div key="tasks" custom={dir} variants={tabVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto"
            >
              <TasksView
                assignedZones={assignedZones}
                userId={userId}
                onStatusChange={onZoneUpdate}
                onSaveNote={handleSaveNote}
              />
            </motion.div>
          )}

          {activeTab === 'map' && (
            <motion.div key="map" custom={dir} variants={tabVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 flex flex-col"
            >
              <MapControls filter={filter} onFilterChange={setFilter} stats={stats} />
              <div className="flex-1 overflow-y-auto p-4">
                <FloorPlan zones={zones} selectedId={selectedId} filter={filter} onSelectRoom={setSelectedId} />
              </div>
            </motion.div>
          )}

          {activeTab === 'feed' && (
            <motion.div key="feed" custom={dir} variants={tabVariants} initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="absolute inset-0 overflow-y-auto"
            >
              <FeedPanel activity={activity} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

// ── Task Card Component ───────────────────────────────────────────
interface TasksViewProps {
  assignedZones: ZoneWithState[]
  userId: string
  onStatusChange: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onSaveNote: (zoneId: string, note: string) => Promise<unknown>
}

function TasksView({ assignedZones, onStatusChange, onSaveNote }: TasksViewProps) {
  if (assignedZones.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 gap-4 text-text-4">
        <div className="w-16 h-16 rounded-2xl bg-elevated border border-border flex items-center justify-center">
          <ClipboardList size={28} className="text-text-5" />
        </div>
        <div className="text-center">
          <div className="font-mono text-[12px] tracking-wide uppercase mb-1">Нет активных задач</div>
          <div className="text-[13px] text-text-5">Ожидайте назначения от руководителя</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {assignedZones.map((zone, i) => (
        <motion.div key={zone.zone_id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05, duration: 0.25 }}
        >
          <TaskCard zone={zone} onStatusChange={onStatusChange} onSaveNote={onSaveNote} />
        </motion.div>
      ))}
    </div>
  )
}

function TaskCard({
  zone,
  onStatusChange,
  onSaveNote,
}: {
  zone: ZoneWithState
  onStatusChange: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onSaveNote: (zoneId: string, note: string) => Promise<unknown>
}) {
  const room = ROOMS.find(r => r.id === zone.zone_id)
  const [expanded, setExpanded] = useState(zone.status === 'in_progress' || zone.status === 'attention')
  const [noteText, setNoteText] = useState(zone.notes ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (zone.status !== 'in_progress' || !zone.started_at) return
    const start = new Date(zone.started_at).getTime()
    const iv = setInterval(() => setElapsed(Date.now() - start), 1000)
    setElapsed(Date.now() - start)
    return () => clearInterval(iv)
  }, [zone.status, zone.started_at])

  if (!room) return null

  const statusColor = STATUSES[zone.status]?.color ?? '#5a5a5a'
  const isActive = zone.status === 'in_progress'
  const isDone = zone.status === 'completed'

  async function handleStatus(s: ZoneStatus) {
    await onStatusChange(zone.zone_id, s)
    if (s === 'in_progress') setExpanded(true)
    toast.success(STATUSES[s].label)
  }

  async function submitNote() {
    if (!noteText.trim()) return
    setSavingNote(true)
    await onSaveNote(zone.zone_id, noteText)
    setSavingNote(false)
    toast.success('Отчёт сохранён')
  }

  return (
    <div className={cn(
      'rounded-xl border overflow-hidden transition-all duration-200',
      isActive ? 'border-[rgba(245,197,24,0.35)] bg-[rgba(245,197,24,0.03)]' : 'border-border bg-elevated',
      isDone && 'border-[rgba(58,174,95,0.3)] bg-[rgba(58,174,95,0.03)]',
    )}>
      {/* Header */}
      <button
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-4 text-left"
      >
        {/* Status indicator */}
        <div className="w-1 self-stretch rounded-full flex-shrink-0" style={{ background: statusColor }} />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-[10px] tracking-wide text-text-4">{room.code}</span>
            <span className="font-mono text-[9px] text-text-5">{room.area} м²</span>
            {isActive && elapsed > 0 && (
              <span className="font-mono text-[10px] text-accent ml-auto">{formatElapsed(elapsed)}</span>
            )}
          </div>
          <div className="text-[15px] font-medium text-text-1 truncate">{room.name}</div>
          {zone.operation_types && (
            <div className="text-[12px] text-text-3 mt-0.5 truncate">{zone.operation_types.label}</div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <StatusBadge status={zone.status} size="sm" />
          <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={14} className="text-text-4" />
          </motion.div>
        </div>
      </button>

      {/* Expanded body */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-4 border-t border-border-soft pt-4">
              {/* Operation details */}
              {zone.operation_types && (
                <div className="flex gap-3 p-3 rounded-lg bg-canvas border border-border-soft">
                  <div className="w-8 h-8 rounded-lg bg-accent-soft border border-accent/20 flex items-center justify-center flex-shrink-0">
                    <ClipboardList size={14} className="text-accent" />
                  </div>
                  <div>
                    <div className="text-[12px] font-medium text-text-1">{zone.operation_types.label}</div>
                    {zone.operation_types.sub_label && (
                      <div className="text-[11px] text-text-4 mt-0.5">{zone.operation_types.sub_label}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Status actions */}
              <div className="flex flex-wrap gap-2">
                {zone.status !== 'in_progress' && zone.status !== 'completed' && (
                  <button onClick={() => handleStatus('in_progress')}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-black font-mono text-[10px] tracking-wide uppercase hover:bg-accent/90 transition-colors"
                  >
                    <Play size={12} /> Начать
                  </button>
                )}
                {zone.status === 'in_progress' && (
                  <>
                    <button onClick={() => handleStatus('paused')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-elevated border border-border text-text-2 font-mono text-[10px] tracking-wide uppercase hover:border-border-strong transition-colors"
                    >
                      <Pause size={12} /> Пауза
                    </button>
                    <button onClick={() => handleStatus('completed')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success-soft border border-success/20 text-success font-mono text-[10px] tracking-wide uppercase hover:bg-success/15 transition-colors"
                    >
                      <CheckCircle size={12} /> Выполнено
                    </button>
                  </>
                )}
                {zone.status === 'paused' && (
                  <>
                    <button onClick={() => handleStatus('in_progress')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-accent text-black font-mono text-[10px] tracking-wide uppercase hover:bg-accent/90 transition-colors"
                    >
                      <Play size={12} /> Продолжить
                    </button>
                    <button onClick={() => handleStatus('completed')}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-success-soft border border-success/20 text-success font-mono text-[10px] tracking-wide uppercase hover:bg-success/15 transition-colors"
                    >
                      <CheckCircle size={12} /> Выполнено
                    </button>
                  </>
                )}
                {zone.status !== 'completed' && (
                  <button onClick={() => handleStatus('attention')}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-elevated border border-border text-text-3 font-mono text-[10px] tracking-wide uppercase hover:border-border-strong transition-colors"
                  >
                    <AlertTriangle size={12} /> Внимание
                  </button>
                )}
              </div>

              {/* Note / Report */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Отчёт / заметки</label>
                <div className="relative">
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Что было сделано? Что нужно сообщить руководителю?"
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-canvas border border-border text-[13px] text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong resize-none pr-10"
                  />
                  <button
                    onClick={submitNote}
                    disabled={savingNote || !noteText.trim()}
                    className="absolute right-2 bottom-2 w-7 h-7 grid place-items-center rounded-lg bg-accent text-black disabled:opacity-30 transition-opacity hover:bg-accent/90"
                  >
                    <Send size={12} />
                  </button>
                </div>
                {zone.notes && noteText === zone.notes && (
                  <p className="text-[11px] text-text-4">
                    Последний отчёт: {formatRelative(zone.updated_at)}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
