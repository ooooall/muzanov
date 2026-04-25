import type { RoomDef } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const STATUSES: Record<ZoneStatus, { label: string; sub: string; color: string }> = {
  idle:       { label: 'Не начато',          sub: 'IDLE',        color: '#5a5a5a' },
  scheduled:  { label: 'Запланировано',      sub: 'SCHEDULED',   color: '#808080' },
  in_progress:{ label: 'В процессе',         sub: 'IN PROGRESS', color: '#f5c518' },
  paused:     { label: 'Пауза',              sub: 'PAUSED',      color: '#c8a200' },
  attention:  { label: 'Требует внимания',   sub: 'ATTENTION',   color: '#c8a200' },
  completed:  { label: 'Готово',             sub: 'COMPLETED',   color: '#3aae5f' },
  rework:     { label: 'Переделать',         sub: 'REWORK',      color: '#a08800' },
}

export const OPERATIONS = [
  { code: 'MTN-01', label: 'Поддерживающая уборка', sub: 'Maintenance Pass' },
  { code: 'DEP-01', label: 'Глубокая уборка',       sub: 'Deep Cleaning Cycle' },
  { code: 'WET-01', label: 'Влажная обработка',     sub: 'Wet Surface Treatment' },
  { code: 'DRY-01', label: 'Сухая очистка',         sub: 'Dry Particle Extraction' },
  { code: 'KIT-01', label: 'Кухонный цикл',         sub: 'Kitchen Operations' },
  { code: 'FUL-01', label: 'Полный цикл',           sub: 'Full Scope Cycle' },
] as const

export type OperationCode = typeof OPERATIONS[number]['code']

// SVG viewBox: 600 × 800
export const MAP_VIEWBOX = { w: 600, h: 800 }

export const ROOMS: RoomDef[] = [
  {
    id: 'bedroom_small', code: 'BR-01',
    name: 'Спальня Маленькая', short: 'Спальня M',
    area: 11.5,
    shape: { type: 'rect', x: 20, y: 20, w: 140, h: 380 },
    labelAt: { x: 90, y: 210 },
  },
  {
    id: 'bedroom_medium', code: 'BR-02',
    name: 'Спальня Средняя', short: 'Спальня S',
    area: 14.0,
    shape: { type: 'rect', x: 170, y: 20, w: 290, h: 280 },
    labelAt: { x: 315, y: 160 },
  },
  {
    id: 'wardrobe', code: 'WD-01',
    name: 'Гардероб', short: 'Гардероб',
    area: 3.0,
    shape: { type: 'rect', x: 470, y: 20, w: 110, h: 280 },
    labelAt: { x: 525, y: 160 },
  },
  {
    id: 'entry', code: 'EN-01',
    name: 'Прихожая', short: 'Прихожая',
    area: 4.5,
    shape: { type: 'rect', x: 470, y: 310, w: 110, h: 140 },
    labelAt: { x: 525, y: 380 },
  },
  {
    id: 'bath', code: 'BT-01',
    name: 'Ванная', short: 'Ванная',
    area: 2.6,
    shape: { type: 'rect', x: 20, y: 410, w: 140, h: 95 },
    labelAt: { x: 90, y: 458 },
  },
  {
    id: 'wc', code: 'WC-01',
    name: 'Туалет', short: 'Туалет',
    area: 1.2,
    shape: { type: 'rect', x: 20, y: 515, w: 140, h: 75 },
    labelAt: { x: 90, y: 553 },
  },
  {
    id: 'corridor', code: 'CR-01',
    name: 'Коридор / Холл', short: 'Коридор',
    area: 8.5,
    shape: { type: 'polygon', points: '170,310 460,310 460,450 210,450 210,600 170,600' },
    labelAt: { x: 320, y: 380 },
  },
  {
    id: 'kitchen', code: 'KT-01',
    name: 'Кухня', short: 'Кухня',
    area: 10.2,
    shape: { type: 'rect', x: 20, y: 600, w: 180, h: 180 },
    labelAt: { x: 110, y: 690 },
  },
  {
    id: 'living', code: 'LR-01',
    name: 'Гостиная / Спальня', short: 'Гостиная',
    area: 20.5,
    shape: { type: 'rect', x: 220, y: 460, w: 360, h: 320 },
    labelAt: { x: 400, y: 620 },
  },
]
