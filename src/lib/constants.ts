import type { RoomDef } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const STATUSES: Record<ZoneStatus, { label: string; sub: string; color: string }> = {
  new: { label: 'Новая', sub: 'NEW', color: '#64748b' },
  in_progress: { label: 'В работе', sub: 'ACTIVE', color: '#d97706' },
  review: { label: 'На проверке', sub: 'REVIEW', color: '#2563eb' },
  done: { label: 'Готово', sub: 'DONE', color: '#059669' },
}

export const MAP_VIEWBOX = { w: 600, h: 800 }

export const ROOMS: RoomDef[] = [
  {
    id: 'bedroom_small',
    code: 'BR-01',
    name: 'Спальня маленькая',
    short: 'Спальня M',
    area: 11.5,
    shape: { type: 'rect', x: 20, y: 20, w: 140, h: 380 },
    labelAt: { x: 90, y: 210 },
  },
  {
    id: 'bedroom_medium',
    code: 'BR-02',
    name: 'Спальня средняя',
    short: 'Спальня S',
    area: 14,
    shape: { type: 'rect', x: 170, y: 20, w: 290, h: 280 },
    labelAt: { x: 315, y: 160 },
  },
  {
    id: 'wardrobe',
    code: 'WD-01',
    name: 'Гардероб',
    short: 'Гардероб',
    area: 3,
    shape: { type: 'rect', x: 470, y: 20, w: 110, h: 280 },
    labelAt: { x: 525, y: 160 },
  },
  {
    id: 'entry',
    code: 'EN-01',
    name: 'Прихожая',
    short: 'Прихожая',
    area: 4.5,
    shape: { type: 'rect', x: 470, y: 310, w: 110, h: 140 },
    labelAt: { x: 525, y: 380 },
  },
  {
    id: 'bath',
    code: 'BT-01',
    name: 'Ванная',
    short: 'Ванная',
    area: 2.6,
    shape: { type: 'rect', x: 20, y: 410, w: 140, h: 95 },
    labelAt: { x: 90, y: 458 },
  },
  {
    id: 'wc',
    code: 'WC-01',
    name: 'Туалет',
    short: 'Туалет',
    area: 1.2,
    shape: { type: 'rect', x: 20, y: 515, w: 140, h: 75 },
    labelAt: { x: 90, y: 553 },
  },
  {
    id: 'corridor',
    code: 'CR-01',
    name: 'Коридор / холл',
    short: 'Коридор',
    area: 8.5,
    shape: {
      type: 'path',
      d: 'M178 300 H452 Q460 300 460 308 V452 Q460 460 452 460 H234 Q226 460 226 468 V632 Q226 640 218 640 H178 Q170 640 170 632 V308 Q170 300 178 300 Z',
    },
    labelAt: { x: 320, y: 404 },
  },
  {
    id: 'kitchen',
    code: 'KT-01',
    name: 'Кухня',
    short: 'Кухня',
    area: 10.2,
    shape: { type: 'rect', x: 20, y: 600, w: 180, h: 180 },
    labelAt: { x: 110, y: 690 },
  },
  {
    id: 'living',
    code: 'LR-01',
    name: 'Гостиная / спальня',
    short: 'Гостиная',
    area: 20.5,
    shape: { type: 'rect', x: 220, y: 460, w: 360, h: 320 },
    labelAt: { x: 400, y: 620 },
  },
]
