'use client'

import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Clock, User, FileText, Play, Pause, CheckCircle, AlertTriangle, RotateCcw, Calendar } from 'lucide-react'
import { cn, formatRelative, formatDateTime, formatElapsed, getStatusColor, getStatusLabel } from '@/lib/utils'
import { ROOMS, STATUSES, OPERATIONS } from '@/lib/constants'
import { StatusBadge } from '@/components/shared/StatusBadge'
import { toast } from 'sonner'
import type { ZoneWithState, Profile, TablesUpdate } from '@/types'
import type { ZoneStatus, UserRole } from '@/types/roles'

interface ZoneDetailDrawerProps {
  zoneId: string | null
  zones: ZoneWithState[]
  role: UserRole | null
  workers?: Profile[]
  onClose: () => void
  onStatusChange: (zoneId: string, status: ZoneStatus, extra?: Partial<TablesUpdate<'zone_states'>>) => Promise<unknown>
  onAssignOperation?: (zoneId: string, opCode: string) => Promise<unknown>
  onAssignWorker?: (zoneId: string, workerId: string | null) => Promise<unknown>
  onSaveNote?: (zoneId: string, note: string) => Promise<unknown>
}

export function ZoneDetailDrawer({
  zoneId,
  zones,
  role,
  workers,
  onClose,
  onStatusChange,
  onAssignOperation,
  onAssignWorker,
  onSaveNote,
}: ZoneDetailDrawerProps) {
  const [noteText, setNoteText] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  const room  = zoneId ? ROOMS.find(r => r.id === zoneId) ?? null : null
  const zone = zoneId
    ? (
      zones.find(z => z.zone_id === zoneId) ??
      (room
        ? {
            zone_id: room.id,
            status: 'idle',
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
        : null)
    )
    : null
  const isOpen = zoneId !== null

  // Sync note text when zone changes
  useEffect(() => {
    setNoteText(zone?.notes ?? '')
  }, [zone?.notes, zoneId])

  // Live timer
  useEffect(() => {
    if (zone?.status !== 'in_progress' || !zone.started_at) return
    const start = new Date(zone.started_at).getTime()
    const iv = setInterval(() => setElapsed(Date.now() - start), 1000)
    setElapsed(Date.now() - start)
    return () => clearInterval(iv)
  }, [zone?.status, zone?.started_at])

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [onClose])

  const canEdit = role === 'worker' || role === 'taskmaster'
  const isTaskmaster = role === 'taskmaster'

  async function handleStatus(newStatus: ZoneStatus) {
    if (!zoneId) return
    const err = await onStatusChange(zoneId, newStatus)
    if (!err) toast.success(`Статус: ${STATUSES[newStatus].label}`)
    else toast.error('Ошибка изменения статуса')
  }

  async function handleSaveNote() {
    if (!zoneId || !onSaveNote) return
    setSavingNote(true)
    const err = await onSaveNote(zoneId, noteText)
    setSavingNote(false)
    if (!err) toast.success('Заметка сохранена')
    else toast.error('Ошибка сохранения')
  }

  const statusColor = zone ? getStatusColor(zone.status) : '#5a5a5a'

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="fixed inset-0 bg-black/58 backdrop-blur-sm z-50"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Drawer */}
      <AnimatePresence>
        {isOpen && zone && room && (
          <motion.div
            key="drawer"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="zone-drawer fixed left-0 right-0 bottom-0 z-60 flex flex-col bg-panel border-t border-border-strong rounded-t-xl shadow-drawer overflow-hidden"
            style={{ maxHeight: '92dvh', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
          >
            {/* Desktop variant: side panel */}
            <style>{`
              @media (min-width: 1024px) {
                .zone-drawer {
                  top: 16px !important; right: 16px !important; bottom: 16px !important;
                  left: auto !important; width: 420px !important;
                  max-height: none !important;
                  border-radius: 8px !important;
                  border: 1px solid rgba(15,23,42,0.18) !important;
                }
              }
            `}</style>

            {/* Grip */}
            <div className="w-11 h-1 rounded-pill bg-border-strong mx-auto mt-2.5 flex-shrink-0 lg:hidden" />

            {/* Header */}
            <div className="flex items-start justify-between gap-3 px-5 pt-4 pb-2 flex-shrink-0">
              <div className="flex flex-col gap-2 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase border border-border rounded px-1.5 py-0.5">
                    {room.code}
                  </span>
                  <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">{room.area} м²</span>
                </div>
                <h2 className="text-[26px] font-medium text-text-1 leading-none">{room.name}</h2>
                <StatusBadge status={zone.status} />
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 grid place-items-center rounded-lg text-text-3 hover:text-text-1 hover:bg-hover transition-colors flex-shrink-0 mt-1"
              >
                <X size={16} />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto overscroll-contain px-5 py-3 flex flex-col gap-5">

              {/* Timer (worker / in_progress) */}
              {zone.status === 'in_progress' && elapsed > 0 && (
                <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-elevated border border-border">
                  <Clock size={16} style={{ color: statusColor }} />
                  <div className="flex flex-col gap-0.5">
                    <span className="font-mono text-[9px] tracking-wide text-text-4 uppercase">Время операции</span>
                    <span className="font-mono text-[15px] font-medium text-text-1">{formatElapsed(elapsed)}</span>
                  </div>
                </div>
              )}

              {/* Details */}
              <div className="flex flex-col rounded-lg bg-elevated border border-border overflow-hidden">
                <DetailRow label="Статус"   value={getStatusLabel(zone.status)} valueStyle={{ color: statusColor }} />
                {zone.operation_types && (
                  <DetailRow label="Операция" value={`${zone.operation_types.code} · ${zone.operation_types.label}`} />
                )}
                {zone.profiles?.display_name && (
                  <DetailRow label="Исполнитель" value={zone.profiles.display_name} />
                )}
                {zone.started_at && (
                  <DetailRow label="Начато" value={formatDateTime(zone.started_at)} />
                )}
                {zone.updated_at && (
                  <DetailRow label="Обновлено" value={formatRelative(zone.updated_at)} />
                )}
              </div>

              {/* Operation selector (TaskMaster) */}
              {isTaskmaster && onAssignOperation && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Назначить операцию</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {OPERATIONS.map(op => (
                      <button
                        key={op.code}
                        onClick={() => onAssignOperation(zoneId!, op.code)}
                        className={cn(
                          'flex flex-col gap-0.5 p-3 rounded-lg border text-left transition-colors',
                          zone.operation_types?.code === op.code
                            ? 'border-accent/40 bg-accent-soft text-accent'
                            : 'border-border bg-elevated text-text-2 hover:border-border-strong hover:text-text-1'
                        )}
                      >
                        <span className="font-mono text-[10px] tracking-wide">{op.code}</span>
                        <span className="text-[12px] leading-snug">{op.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Worker selector (TaskMaster) */}
              {isTaskmaster && onAssignWorker && workers && workers.length > 0 && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase">Исполнитель</span>
                  <div className="flex flex-col rounded-lg bg-elevated border border-border overflow-hidden">
                    <button
                      onClick={() => onAssignWorker(zoneId!, null)}
                      className={cn(
                        'flex items-center gap-3 px-4 py-2.5 border-b border-border-soft text-left hover:bg-hover transition-colors',
                        !zone.assigned_worker_id && 'text-text-3'
                      )}
                    >
                      <User size={13} className="text-text-4 flex-shrink-0" />
                      <span className="text-[12px]">Не назначен</span>
                    </button>
                    {workers.map(w => (
                      <button
                        key={w.id}
                        onClick={() => onAssignWorker(zoneId!, w.id)}
                        className={cn(
                          'flex items-center gap-3 px-4 py-2.5 border-b border-border-soft last:border-0 text-left hover:bg-hover transition-colors',
                          zone.assigned_worker_id === w.id && 'text-accent'
                        )}
                      >
                        <User size={13} className="flex-shrink-0" />
                        <span className="text-[12px]">{w.display_name ?? w.id.slice(0, 8)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Notes */}
              {canEdit && onSaveNote && (
                <div className="flex flex-col gap-2">
                  <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase flex items-center gap-1.5">
                    <FileText size={11} />
                    Заметки
                  </span>
                  <textarea
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="Добавить заметку..."
                    rows={3}
                    className="w-full px-3 py-2.5 rounded-lg bg-elevated border border-border text-[13px] text-text-1 placeholder:text-text-5 focus:outline-none focus:border-border-strong resize-none"
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={savingNote || noteText === (zone.notes ?? '')}
                    className="self-end px-4 py-2 rounded bg-accent text-black font-mono text-[10px] tracking-wide uppercase disabled:opacity-40 transition-opacity"
                  >
                    {savingNote ? 'Сохраняю...' : 'Сохранить'}
                  </button>
                </div>
              )}

              {/* Note (read-only) */}
              {!canEdit && zone.notes && (
                <div className="flex flex-col gap-1.5 p-4 rounded-lg bg-elevated border border-border">
                  <span className="font-mono text-[9px] tracking-wide text-text-4 uppercase">Заметки</span>
                  <p className="text-[13px] text-text-2 leading-relaxed">{zone.notes}</p>
                </div>
              )}
            </div>

            {/* Action buttons */}
            {canEdit && (
              <div className="flex-shrink-0 px-5 py-4 border-t border-border-soft flex flex-col gap-2">
                <StatusActions
                  status={zone.status}
                  role={role!}
                  onAction={handleStatus}
                />
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function DetailRow({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="grid grid-cols-[110px_1fr] gap-3 px-4 py-3 border-b border-border-soft last:border-0">
      <span className="font-mono text-[10px] tracking-wide text-text-4 uppercase pt-0.5">{label}</span>
      <span className="text-[13px] text-text-1 leading-snug" style={valueStyle}>{value}</span>
    </div>
  )
}

interface StatusActionsProps {
  status: ZoneStatus
  role: UserRole
  onAction: (s: ZoneStatus) => void
}

function StatusActions({ status, role, onAction }: StatusActionsProps) {
  const isTaskmaster = role === 'taskmaster'

  const actions: Array<{
    status: ZoneStatus
    label: string
    icon: React.ReactNode
    variant: 'primary' | 'secondary' | 'danger'
    condition: boolean
  }> = [
    {
      status: 'in_progress',
      label: 'Начать',
      icon: <Play size={13} />,
      variant: 'primary',
      condition: status === 'idle' || status === 'scheduled' || status === 'paused',
    },
    {
      status: 'paused',
      label: 'Пауза',
      icon: <Pause size={13} />,
      variant: 'secondary',
      condition: status === 'in_progress',
    },
    {
      status: 'completed',
      label: 'Завершить',
      icon: <CheckCircle size={13} />,
      variant: 'primary',
      condition: status === 'in_progress' || status === 'paused',
    },
    {
      status: 'attention',
      label: 'Внимание',
      icon: <AlertTriangle size={13} />,
      variant: 'secondary',
      condition: status !== 'attention' && status !== 'idle',
    },
    {
      status: 'rework',
      label: 'Переделать',
      icon: <RotateCcw size={13} />,
      variant: 'danger',
      condition: status === 'completed' && isTaskmaster,
    },
    {
      status: 'scheduled',
      label: 'Запланировать',
      icon: <Calendar size={13} />,
      variant: 'secondary',
      condition: status === 'idle' && isTaskmaster,
    },
    {
      status: 'idle',
      label: 'Сбросить',
      icon: <RotateCcw size={13} />,
      variant: 'danger',
      condition: isTaskmaster && status !== 'idle',
    },
  ]

  const visible = actions.filter(a => a.condition)
  if (visible.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {visible.map(a => (
        <button
          key={a.status}
          onClick={() => onAction(a.status)}
          className={cn(
            'inline-flex items-center gap-1.5 px-4 py-2 rounded font-mono text-[10px] tracking-wide uppercase transition-colors',
            a.variant === 'primary'   && 'bg-accent text-black hover:bg-accent/90',
            a.variant === 'secondary' && 'bg-elevated border border-border text-text-2 hover:border-border-strong hover:text-text-1',
            a.variant === 'danger'    && 'bg-danger-soft border border-danger/20 text-danger hover:bg-danger/15'
          )}
        >
          {a.icon}
          {a.label}
        </button>
      ))}
    </div>
  )
}
