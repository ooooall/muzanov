import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { STATUSES } from './constants'
import type { ZoneStatus } from '@/types/roles'
import { isActiveStatus as checkActiveStatus } from './zone-workflow'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  return d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
}

export function formatRelative(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  const diff = Date.now() - d.getTime()
  const minutes = Math.round(diff / 60000)

  if (minutes < 1) return 'только что'
  if (minutes < 60) return `${minutes} мин назад`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} ч назад`

  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })
}

export function formatDateTime(date: Date | string | null | undefined): string {
  if (!date) return '—'
  const d = new Date(date)
  return `${formatTime(d)} · ${d.toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' })}`
}

export function formatElapsed(ms: number): string {
  const sec = Math.floor(ms / 1000)
  const min = Math.floor(sec / 60)
  const hr = Math.floor(min / 60)
  return `${String(hr).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}:${String(sec % 60).padStart(2, '0')}`
}

export function getStatusColor(status: ZoneStatus): string {
  return STATUSES[status]?.color ?? '#5a5a5a'
}

export function getStatusLabel(status: ZoneStatus): string {
  return STATUSES[status]?.label ?? status
}

export function getStatusSub(status: ZoneStatus): string {
  return STATUSES[status]?.sub ?? status.toUpperCase()
}

export function isActiveStatus(status: ZoneStatus): boolean {
  return checkActiveStatus(status)
}

export function pluralRu(n: number, one: string, few: string, many: string): string {
  const abs = Math.abs(n) % 100
  const rem = abs % 10
  if (abs > 10 && abs < 20) return many
  if (rem === 1) return one
  if (rem >= 2 && rem <= 4) return few
  return many
}
