'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, ChevronDown, ClipboardList, Play, Send } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AppButton } from '@/components/shared/AppButton'
import { AppSurface } from '@/components/shared/AppSurface'
import { TextArea } from '@/components/shared/AppField'
import { ROOMS } from '@/lib/constants'
import { cn, formatElapsed, formatRelative } from '@/lib/utils'
import { isArchivedStatus } from '@/lib/zone-workflow'
import { createClient } from '@/lib/supabase/client'
import type { ZoneWithState } from '@/types'
import type { TablesUpdate, TablesInsert } from '@/types/database.types'
import type { ZoneStatus } from '@/types/roles'

interface WorkerDashboardProps {
  zones: ZoneWithState[]
  userId: string
  onZoneUpdate: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
}

export function WorkerDashboard({ zones, userId, onZoneUpdate }: WorkerDashboardProps) {
  const assignedZones = zones.filter((zone) => zone.assigned_worker_id === userId)
  const activeZones = assignedZones.filter((zone) => !isArchivedStatus(zone.status))
  const archivedZones = assignedZones.filter((zone) => isArchivedStatus(zone.status))

  return (
    <div className="mx-auto flex h-full w-full max-w-screen-lg flex-col gap-6 px-4 py-6">
      <div className="space-y-1">
        <h1 className="text-[24px] font-semibold tracking-tight text-text-1">Мои задачи</h1>
        <p className="text-[13px] text-text-3">Только ваши назначения, текущий прогресс и короткие отчёты.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryCard label="Активные" value={activeZones.length} tone="amber" />
        <SummaryCard label="На проверке" value={assignedZones.filter((zone) => zone.status === 'review').length} tone="blue" />
        <SummaryCard label="В архиве" value={archivedZones.length} tone="emerald" />
      </div>

      <section className="space-y-4">
        <SectionHeading title="Текущие задачи" count={activeZones.length} />
        {activeZones.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-4">
            {activeZones.map((zone, index) => (
              <motion.div
                key={zone.zone_id}
                initial={{ opacity: 0, y: 18, scale: 0.985 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.28, delay: index * 0.04, ease: 'easeOut' }}
              >
                <TaskCard zone={zone} userId={userId} onStatusChange={onZoneUpdate} />
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {archivedZones.length > 0 && (
        <section className="space-y-4">
          <SectionHeading title="Архив" count={archivedZones.length} />
          <div className="grid gap-4">
            {archivedZones.map((zone) => (
              <TaskCard key={zone.zone_id} zone={zone} userId={userId} onStatusChange={onZoneUpdate} archived />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

function SummaryCard({ label, value, tone }: { label: string; value: number; tone: 'amber' | 'blue' | 'emerald' }) {
  const styles = {
    amber: 'text-amber-700 bg-amber-50 border-amber-100',
    blue: 'text-blue-700 bg-blue-50 border-blue-100',
    emerald: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  }

  return (
    <AppSurface className={cn('p-4', styles[tone])}>
      <div className="font-mono text-[10px] uppercase tracking-wide opacity-70">{label}</div>
      <div className="mt-2 text-[28px] font-semibold leading-none">{value}</div>
    </AppSurface>
  )
}

function SectionHeading({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <h2 className="text-[16px] font-medium text-text-1">{title}</h2>
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-4">{count}</span>
    </div>
  )
}

function EmptyState() {
  return (
    <AppSurface className="flex flex-col items-center gap-4 px-6 py-14 text-center">
      <div className="grid h-14 w-14 place-items-center rounded-2xl border border-slate-100 bg-slate-50 text-slate-400">
        <ClipboardList size={24} />
      </div>
      <div className="space-y-1">
        <div className="font-mono text-[11px] uppercase tracking-wide text-text-4">Нет активных задач</div>
        <div className="text-[13px] text-text-3">Новые назначения появятся здесь сразу после выдачи.</div>
      </div>
    </AppSurface>
  )
}

function TaskCard({
  zone,
  userId,
  onStatusChange,
  archived = false,
}: {
  zone: ZoneWithState
  userId: string
  onStatusChange: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  archived?: boolean
}) {
  const room = ROOMS.find((item) => item.id === zone.zone_id)
  const [expanded, setExpanded] = useState(zone.status === 'in_progress' || zone.status === 'review')
  const [noteText, setNoteText] = useState(zone.notes ?? '')
  const [savingNote, setSavingNote] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [supabase] = useState(() => createClient())

  useEffect(() => {
    setNoteText(zone.notes ?? '')
  }, [zone.notes])

  useEffect(() => {
    if (zone.status !== 'in_progress' || !zone.started_at) return
    const start = new Date(zone.started_at).getTime()
    const intervalId = window.setInterval(() => setElapsed(Date.now() - start), 1000)
    setElapsed(Date.now() - start)
    return () => window.clearInterval(intervalId)
  }, [zone.started_at, zone.status])

  if (!room) return null

  async function handleSaveNote() {
    if (!noteText.trim()) return
    setSavingNote(true)

    const update: TablesUpdate<'zone_states'> = {
      notes: noteText.trim(),
      updated_at: new Date().toISOString(),
    }

    const { error } = await supabase.from('zone_states').update(update).eq('zone_id', zone.zone_id)

    if (!error) {
      const log: TablesInsert<'activity_log'> = {
        zone_id: zone.zone_id,
        user_id: userId,
        action: 'note_added',
        details: { note: noteText.trim() },
      }
      await supabase.from('activity_log').insert(log)
      toast.success('Отчёт сохранён')
    } else {
      toast.error('Не удалось сохранить отчёт')
    }

    setSavingNote(false)
  }

  async function setStatus(status: ZoneStatus) {
    const error = await onStatusChange(zone.zone_id, status)
    if (!error) {
      setExpanded(status !== 'done')
      toast.success(status === 'review' ? 'Задача передана на проверку' : 'Статус обновлён')
    } else {
      toast.error('Не удалось обновить статус')
    }
  }

  const headerClassName = archived
    ? 'border-emerald-100 bg-emerald-50/70'
    : zone.status === 'review'
      ? 'border-blue-100 bg-blue-50/70'
      : zone.status === 'in_progress'
        ? 'border-amber-100 bg-amber-50/70'
        : 'border-slate-100 bg-white'

  return (
    <AppSurface className={cn('overflow-hidden', headerClassName, archived && 'opacity-80')}>
      <button
        onClick={() => setExpanded((value) => !value)}
        className="flex w-full items-start gap-4 px-5 py-4 text-left transition-colors duration-200 hover:bg-white/50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.code}</span>
            <span className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.area} м²</span>
            {zone.status === 'in_progress' && elapsed > 0 && (
              <span className="ml-auto font-mono text-[10px] uppercase tracking-wide text-amber-700">{formatElapsed(elapsed)}</span>
            )}
          </div>
          <div className="mt-2 text-[16px] font-medium text-text-1">{room.name}</div>
          {zone.operation_types && (
            <div className="mt-1 text-[13px] text-text-3">
              {zone.operation_types.label}
              {zone.operation_types.sub_label ? ` · ${zone.operation_types.sub_label}` : ''}
            </div>
          )}
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={zone.status} />
          <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}>
            <ChevronDown size={16} className="text-text-4" />
          </motion.span>
        </div>
      </button>

      <AnimatePresence initial={false}>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: 'easeOut' }}
            className="overflow-hidden border-t border-slate-100 bg-white/80 backdrop-blur"
          >
            <div className="space-y-4 px-5 py-4">
              <div className="flex flex-wrap gap-2">
                {zone.status === 'new' && (
                  <AppButton variant="primary" icon={<Play size={13} />} onClick={() => setStatus('in_progress')}>
                    Начать
                  </AppButton>
                )}
                {zone.status === 'in_progress' && (
                  <AppButton variant="success" icon={<CheckCircle2 size={13} />} onClick={() => setStatus('review')}>
                    На проверку
                  </AppButton>
                )}
                {zone.status === 'review' && (
                  <span className="rounded-xl border border-blue-100 bg-blue-50 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-blue-700">
                    Ожидает проверки руководителя
                  </span>
                )}
                {zone.status === 'done' && (
                  <span className="rounded-xl border border-emerald-100 bg-emerald-50 px-3 py-2 font-mono text-[10px] uppercase tracking-wide text-emerald-700">
                    Архивировано
                  </span>
                )}
              </div>

              <div className="space-y-2">
                <TextArea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={4}
                  placeholder="Коротко опишите, что сделано и что важно проверить."
                />
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[12px] text-text-4">
                    {zone.notes ? `Последнее обновление ${formatRelative(zone.updated_at)}` : 'Отчёт увидит только руководитель.'}
                  </span>
                  <AppButton
                    variant="primary"
                    size="sm"
                    icon={<Send size={12} />}
                    onClick={handleSaveNote}
                    disabled={savingNote || noteText.trim() === (zone.notes ?? '').trim()}
                  >
                    {savingNote ? 'Сохраняю' : 'Сохранить'}
                  </AppButton>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppSurface>
  )
}
