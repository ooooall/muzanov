import type { RoomDef } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const STATUSES: Record<ZoneStatus, { label: string; sub: string; color: string }> = {
  new: { label: 'Новая', sub: 'NEW', color: '#64748b' },
  in_progress: { label: 'В работе', sub: 'ACTIVE', color: '#d97706' },
  review: { label: 'На проверке', sub: 'REVIEW', color: '#2563eb' },
  done: { label: 'Готово', sub: 'DONE', color: '#059669' },
}

// viewBox 755 × 1024. All rooms inset by 3 px on every side → 6 px gap between
// adjacent rooms (visual "wall" thickness).
//
// Logical grid (before inset):
//   left col  x: 20–150   bedroom_small / bath / wc
//   center    x: 150–540  bedroom_medium / corridor
//   right col x: 540–735  wardrobe / entry
//
//   top row   y:  20–245  bedrooms + wardrobe
//   mid row   y: 245–435  corridor horizontal + entry
//   bath      y: 435–530
//   wc        y: 530–625
//   bottom    y: 625–1004 kitchen + living
export const MAP_VIEWBOX = { w: 755, h: 1024 } as const

export const ROOMS: RoomDef[] = [
  {
    id: 'bedroom_small',
    code: 'BR-01',
    name: 'Спальня маленькая',
    short: 'Спальня M',
    area: 11.5,
    shape: { type: 'rect', x: 23, y: 23, w: 124, h: 409 },
    labelAt: { x: 85, y: 228 },
  },
  {
    id: 'bedroom_medium',
    code: 'BR-02',
    name: 'Спальня средняя',
    short: 'Спальня S',
    area: 14,
    shape: { type: 'rect', x: 153, y: 23, w: 384, h: 219 },
    labelAt: { x: 345, y: 133 },
  },
  {
    id: 'wardrobe',
    code: 'WD-01',
    name: 'Гардероб',
    short: 'Гардероб',
    area: 3,
    shape: { type: 'rect', x: 543, y: 23, w: 189, h: 219 },
    labelAt: { x: 637, y: 133 },
  },
  {
    id: 'entry',
    code: 'EN-01',
    name: 'Прихожая',
    short: 'Прихожая',
    area: 4.5,
    shape: { type: 'rect', x: 543, y: 248, w: 189, h: 184 },
    labelAt: { x: 637, y: 340 },
  },
  {
    id: 'bath',
    code: 'BT-01',
    name: 'Ванная',
    short: 'Ванная',
    area: 2.6,
    shape: { type: 'rect', x: 23, y: 438, w: 124, h: 89 },
    labelAt: { x: 85, y: 483 },
  },
  {
    id: 'wc',
    code: 'WC-01',
    name: 'Туалет',
    short: 'Туалет',
    area: 1.2,
    shape: { type: 'rect', x: 23, y: 533, w: 124, h: 89 },
    labelAt: { x: 85, y: 578 },
  },
  {
    id: 'corridor',
    code: 'CR-01',
    name: 'Коридор / холл',
    short: 'Коридор',
    area: 8.5,
    // Original grid: x:150–540 (upper), x:150–205 (leg), y:245–625
    // Each outer edge inset by 3 px → 6 px gap to adjacent rooms
    shape: {
      type: 'path',
      d: 'M 153 248 H 522 Q 537 248 537 263 V 417 Q 537 432 522 432 H 217 Q 202 432 202 447 V 607 Q 202 622 187 622 H 162 Q 153 622 153 607 V 263 Q 153 248 168 248 Z',
    },
    labelAt: { x: 345, y: 350 },
  },
  {
    id: 'kitchen',
    code: 'KT-01',
    name: 'Кухня',
    short: 'Кухня',
    area: 10.2,
    shape: { type: 'rect', x: 23, y: 628, w: 179, h: 373 },
    labelAt: { x: 112, y: 815 },
  },
  {
    id: 'living',
    code: 'LR-01',
    name: 'Гостиная / спальня',
    short: 'Гостиная',
    area: 20.5,
    shape: { type: 'rect', x: 208, y: 438, w: 524, h: 563 },
    labelAt: { x: 470, y: 720 },
  },
]
