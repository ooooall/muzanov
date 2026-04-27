'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Play, Send, User, X } from 'lucide-react'
import { toast } from 'sonner'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { AppButton } from '@/components/shared/AppButton'
import { AppSurface } from '@/components/shared/AppSurface'
import { AppSelect, FieldLabel, TextArea } from '@/components/shared/AppField'
import { ROOMS } from '@/lib/constants'
import { formatDateTime, formatElapsed, formatRelative } from '@/lib/utils'
import { DEFAULT_ZONE_STATUS } from '@/lib/zone-workflow'
import type { OperationType, Profile, TablesUpdate, ZoneWithState } from '@/types'
import type { UserRole, ZoneStatus } from '@/types/roles'

interface ZoneDetailDrawerProps {
  zoneId: string | null
  zones: ZoneWithState[]
  role: UserRole | null
  workers?: Profile[]
  operations?: OperationType[]
  onClose: () => void
  onStatusChange: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onAssignOperation?: (zoneId: string, operationId: string) => Promise<unknown>
  onAssignWorker?: (zoneId: string, workerId: string | null) => Promise<unknown>
  onSaveNote?: (zoneId: string, note: string) => Promise<unknown>
}

export function ZoneDetailDrawer({
  zoneId,
  zones,
  role,
  workers = [],
  operations = [],
  onClose,
  onStatusChange,
  onAssignOperation,
  onAssignWorker,
  onSaveNote,
}: ZoneDetailDrawerProps) {
  const room = useMemo(() => (zoneId ? ROOMS.find((item) => item.id === zoneId) ?? null : null), [zoneId])
  const zone = useMemo(() => {
    if (!zoneId || !room) return null
    return (
      zones.find((item) => item.zone_id === zoneId) ?? {
        zone_id: room.id,
        status: DEFAULT_ZONE_STATUS,
        operation_type_id: null,
        assigned_worker_id: null,
        notes: null,
        started_at: null,
        updated_at: new Date().toISOString(),
        zones: {
          id: room.id,
          name: room.name,
          short_name: room.short,
          code: room.code,
          area: room.area,
          geometry: room.shape,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        operation_types: null,
        profiles: null,
      }
    )
  }, [room, zoneId, zones])

  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setNoteText(zone?.notes ?? '')
  }, [zone?.notes, zoneId])

  useEffect(() => {
    if (zone?.status !== 'in_progress' || !zone.started_at) return
    const start = new Date(zone.started_at).getTime()
    const intervalId = window.setInterval(() => setElapsed(Date.now() - start), 1000)
    setElapsed(Date.now() - start)
    return () => window.clearInterval(intervalId)
  }, [zone?.started_at, zone?.status])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  if (!zone || !room) return null

  const currentZoneId = zone.zone_id

  const isTaskmaster = role === 'taskmaster'
  const canEdit = role === 'taskmaster' || role === 'worker'

  async function submitStatus(status: ZoneStatus) {
    const error = await onStatusChange(currentZoneId, status)
    if (!error) {
      toast.success('Статус обновлён')
      return
    }
    toast.error('Не удалось обновить статус')
  }

  async function submitNote() {
    if (!zoneId || !onSaveNote) return
    setSavingNote(true)
    const error = await onSaveNote(zoneId, noteText)
    setSavingNote(false)
    if (!error) toast.success('Заметка сохранена')
    else toast.error('Не удалось сохранить заметку')
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: zoneId ? 1 : 0 }}
        exit={{ opacity: 0 }}
        className={zoneId ? 'fixed inset-0 z-50 bg-slate-950/16 backdrop-blur-sm' : 'pointer-events-none fixed inset-0 z-50 opacity-0'}
        onClick={onClose}
      />

      {zoneId && (
        <motion.aside
          initial={{ x: 420, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 420, opacity: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="fixed inset-x-0 bottom-0 z-[60] flex max-h-[90dvh] flex-col rounded-t-[24px] border border-slate-100 bg-white shadow-2xl lg:inset-y-4 lg:right-4 lg:left-auto lg:w-[420px] lg:max-h-none lg:rounded-3xl"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-5">
            <div className="min-w-0">
              <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">{room.code} · {room.area} м²</div>
              <h2 className="mt-2 text-[24px] font-semibold tracking-tight text-text-1">{room.name}</h2>
              <div className="mt-3">
                <StatusBadge status={zone.status} />
              </div>
            </div>
            <AppButton variant="ghost" size="sm" icon={<X size={14} />} onClick={onClose} />
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto px-5 py-5">
            {zone.status === 'in_progress' && elapsed > 0 && (
              <AppSurface className="p-4">
                <div className="font-mono text-[10px] uppercase tracking-wide text-text-4">В работе</div>
                <div className="mt-2 text-[24px] font-semibold text-text-1">{formatElapsed(elapsed)}</div>
              </AppSurface>
            )}

            <AppSurface className="space-y-3 p-4">
              <DetailRow label="Операция" value={zone.operation_types ? `${zone.operation_types.code} · ${zone.operation_types.label}` : 'Не назначена'} />
              <DetailRow label="Исполнитель" value={zone.profiles?.display_name ?? 'Не назначен'} />
              <DetailRow label="Обновлено" value={formatRelative(zone.updated_at)} />
              {zone.started_at && <DetailRow label="Старт" value={formatDateTime(zone.started_at)} />}
            </AppSurface>

            {isTaskmaster && (
              <AppSurface className="space-y-3 p-4">
                <FieldLabel>Операция</FieldLabel>
                <AppSelect
                  value={zone.operation_type_id ?? ''}
                  onChange={(value) => {
                    if (value) onAssignOperation?.(currentZoneId, value)
                  }}
                  placeholder="Выберите операцию"
                  options={operations.map((operation) => ({
                    value: operation.id,
                    label: `${operation.label} (${operation.code})`,
                  }))}
                />

                <FieldLabel>Исполнитель</FieldLabel>
                <AppSelect
                  value={zone.assigned_worker_id ?? ''}
                  onChange={(value) => onAssignWorker?.(currentZoneId, value || null)}
                  placeholder="Без исполнителя"
                  options={workers
                    .filter((worker) => worker.role === 'worker')
                    .map((worker) => ({
                      value: worker.id,
                      label: worker.display_name ?? worker.id.slice(0, 8),
                    }))}
                />
              </AppSurface>
            )}

            {canEdit && onSaveNote && (
              <AppSurface className="space-y-3 p-4">
                <FieldLabel>Заметки</FieldLabel>
                <TextArea
                  value={noteText}
                  onChange={(event) => setNoteText(event.target.value)}
                  rows={4}
                  placeholder="Что было сделано, что проверить, что важно учесть дальше."
                />
                <div className="flex justify-end">
                  <AppButton variant="primary" size="sm" icon={<Send size={12} />} onClick={submitNote} disabled={savingNote || noteText === (zone.notes ?? '')}>
                    {savingNote ? 'Сохраняю' : 'Сохранить'}
                  </AppButton>
                </div>
              </AppSurface>
            )}

            {!canEdit && zone.notes && (
              <AppSurface className="space-y-2 p-4">
                <FieldLabel>Заметки</FieldLabel>
                <p className="text-[13px] leading-6 text-text-2">{zone.notes}</p>
              </AppSurface>
            )}
          </div>

          {canEdit && (
            <div className="border-t border-slate-100 px-5 py-4 pb-safe">
              <div className="flex flex-wrap gap-2">
                {zone.status === 'new' && (
                  <AppButton variant="primary" size="sm" icon={<Play size={13} />} onClick={() => submitStatus('in_progress')}>
                    Начать
                  </AppButton>
                )}
                {zone.status === 'in_progress' && (
                  <AppButton variant="success" size="sm" icon={<CheckCircle2 size={13} />} onClick={() => submitStatus('review')}>
                    На проверку
                  </AppButton>
                )}
                {isTaskmaster && zone.status === 'review' && (
                  <AppButton variant="success" size="sm" icon={<CheckCircle2 size={13} />} onClick={() => submitStatus('done')}>
                    Принять
                  </AppButton>
                )}
                {isTaskmaster && zone.status !== 'new' && (
                  <AppButton variant="secondary" size="sm" icon={<User size={13} />} onClick={() => submitStatus('new')}>
                    Вернуть в новые
                  </AppButton>
                )}
              </div>
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 text-[13px]">
      <span className="font-mono text-[10px] uppercase tracking-wide text-text-4">{label}</span>
      <span className="text-text-1">{value}</span>
    </div>
  )
}
