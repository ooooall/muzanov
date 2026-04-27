import type { RoomDef } from '@/types'
import type { ZoneStatus } from '@/types/roles'

export const STATUSES: Record<ZoneStatus, { label: string; sub: string; color: string }> = {
  new: { label: 'Новая', sub: 'NEW', color: '#64748b' },
  in_progress: { label: 'В работе', sub: 'ACTIVE', color: '#d97706' },
  review: { label: 'На проверке', sub: 'REVIEW', color: '#2563eb' },
  done: { label: 'Готово', sub: 'DONE', color: '#059669' },
}

// ─── Map canvas ────────────────────────────────────────────────────────────────
// viewBox: 755 × 1024 (matches Figma layout)
// All room coordinates are in this space.
//
// Column layout (x):
//   20–150  left column  (bedroom_small / bath / wc)
//   150–540 center       (bedroom_medium / corridor)
//   540–735 right column (wardrobe / entry)
//   735+    right margin
//
// Row layout (y):
//   20–245   top row     (bedrooms + wardrobe)
//   245–435  mid row     (corridor horizontal + entry)
//   435–530  bath
//   530–625  wc
//   625–1004 bottom row  (kitchen + living)
// ───────────────────────────────────────────────────────────────────────────────
export const MAP_VIEWBOX = { w: 755, h: 1024 } as const

export const ROOMS: RoomDef[] = [
  {
    id: 'bedroom_small',
    code: 'BR-01',
    name: 'Спальня маленькая',
    short: 'Спальня M',
    area: 11.5,
    // Left column, top — x:20–150, y:20–435
    shape: { type: 'rect', x: 20, y: 20, w: 130, h: 415 },
    labelAt: { x: 85, y: 228 },
  },
  {
    id: 'bedroom_medium',
    code: 'BR-02',
    name: 'Спальня средняя',
    short: 'Спальня S',
    area: 14,
    // Center, top — x:150–540, y:20–245
    shape: { type: 'rect', x: 150, y: 20, w: 390, h: 225 },
    labelAt: { x: 345, y: 132 },
  },
  {
    id: 'wardrobe',
    code: 'WD-01',
    name: 'Гардероб',
    short: 'Гардероб',
    area: 3,
    // Right column, top — x:540–735, y:20–245
    shape: { type: 'rect', x: 540, y: 20, w: 195, h: 225 },
    labelAt: { x: 637, y: 132 },
  },
  {
    id: 'entry',
    code: 'EN-01',
    name: 'Прихожая',
    short: 'Прихожая',
    area: 4.5,
    // Right column, mid — x:540–735, y:245–435
    shape: { type: 'rect', x: 540, y: 245, w: 195, h: 190 },
    labelAt: { x: 637, y: 340 },
  },
  {
    id: 'bath',
    code: 'BT-01',
    name: 'Ванная',
    short: 'Ванная',
    area: 2.6,
    // Left column — x:20–150, y:435–530
    shape: { type: 'rect', x: 20, y: 435, w: 130, h: 95 },
    labelAt: { x: 85, y: 482 },
  },
  {
    id: 'wc',
    code: 'WC-01',
    name: 'Туалет',
    short: 'Туалет',
    area: 1.2,
    // Left column — x:20–150, y:530–625
    shape: { type: 'rect', x: 20, y: 530, w: 130, h: 95 },
    labelAt: { x: 85, y: 577 },
  },
  {
    id: 'corridor',
    code: 'CR-01',
    name: 'Коридор / холл',
    short: 'Коридор',
    area: 8.5,
    // L-shaped path: horizontal bar x:150–540, y:245–435
    //                vertical leg   x:150–205, y:435–625
    // Q curves add rounded outer/inner corners (~15px radius)
    shape: {
      type: 'path',
      d: 'M 150 245 H 525 Q 540 245 540 260 V 420 Q 540 435 525 435 H 220 Q 205 435 205 450 V 610 Q 205 625 190 625 H 165 Q 150 625 150 610 V 260 Q 150 245 165 245 Z',
    },
    labelAt: { x: 345, y: 350 },
  },
  {
    id: 'kitchen',
    code: 'KT-01',
    name: 'Кухня',
    short: 'Кухня',
    area: 10.2,
    // Bottom-left — x:20–205, y:625–1004
    shape: { type: 'rect', x: 20, y: 625, w: 185, h: 379 },
    labelAt: { x: 112, y: 814 },
  },
  {
    id: 'living',
    code: 'LR-01',
    name: 'Гостиная / спальня',
    short: 'Гостиная',
    area: 20.5,
    // Bottom-right — x:205–735, y:435–1004
    shape: { type: 'rect', x: 205, y: 435, w: 530, h: 569 },
    labelAt: { x: 470, y: 720 },
  },
]
