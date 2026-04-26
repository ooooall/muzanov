'use client'

import { motion } from 'framer-motion'
import { STATUSES } from '@/lib/constants'
import type { RoomDef, ZoneWithState } from '@/types'
import type { ZoneStatus } from '@/types/roles'

interface RoomShapeProps {
  room: RoomDef
  state?: ZoneWithState | null
  isSelected: boolean
  isFiltered: boolean
  onClick: () => void
}

const ROOM_BASE_FILLS: Record<string, string> = {
  bedroom_small:  '#f8fafc',
  bedroom_medium: '#f8fafc',
  living:         '#f8fafc',
  kitchen:        '#fffef7',
  corridor:       '#f1f5f9',
  wardrobe:       '#f8fafc',
  entry:          '#f8fafc',
  bath:           '#f0fdfa',
  wc:             '#f0fdfa',
}

function getStatusFill(status: ZoneStatus): string {
  const map: Partial<Record<ZoneStatus, string>> = {
    in_progress: 'rgba(245,197,24,0.20)',
    attention:   'rgba(200,162,0,0.18)',
    completed:   'rgba(58,174,95,0.16)',
    rework:      'rgba(160,136,0,0.18)',
    scheduled:   'rgba(100,116,139,0.14)',
    paused:      'rgba(200,162,0,0.14)',
  }
  return map[status] ?? 'transparent'
}

type RectProps = { x: number; y: number; width: number; height: number }
type PolyProps = { points: string }

export function RoomShape({ room, state, isSelected, isFiltered, onClick }: RoomShapeProps) {
  const status = state?.status ?? 'idle'
  const statusColor = STATUSES[status]?.color ?? '#5a5a5a'
  const baseFill = ROOM_BASE_FILLS[room.id] ?? '#161616'
  const statusFill = getStatusFill(status)
  const opacity = isFiltered ? 0.25 : 1

  const rectProps: RectProps | null = room.shape.type === 'rect'
    ? { x: room.shape.x, y: room.shape.y, width: room.shape.w, height: room.shape.h }
    : null
  const polyProps: PolyProps | null = room.shape.type === 'polygon'
    ? { points: room.shape.points }
    : null
  const isRect = rectProps !== null

  function renderShape(extraProps: { fill?: string; stroke?: string; strokeWidth?: number; opacity?: number }) {
    if (isRect && rectProps) {
      return <rect {...rectProps} rx={7} ry={7} {...extraProps} />
    }
    if (polyProps) {
      return <polygon {...polyProps} strokeLinejoin="round" {...extraProps} />
    }
    return null
  }

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      role="button"
      aria-label={`${room.name} — ${STATUSES[status].label}`}
    >
      {renderShape({ fill: baseFill, opacity })}
      {renderShape({ fill: statusFill, opacity })}

      <motion.g animate={{ opacity: isSelected ? 1 : 0.9 }} transition={{ duration: 0.15 }}>
        {renderShape({
          fill: 'none',
          stroke: isSelected ? statusColor : 'rgba(15,23,42,0.16)',
          strokeWidth: isSelected ? 2 : 1,
          opacity,
        })}
      </motion.g>

      {(status === 'in_progress' || status === 'attention') && !isFiltered && (
        <motion.g
          animate={{ opacity: [0.4, 0.1, 0.4] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          {renderShape({ fill: 'none', stroke: statusColor, strokeWidth: 2.5 })}
        </motion.g>
      )}

      <g opacity={isFiltered ? 0.3 : 1}>
        <text x={room.labelAt.x} y={room.labelAt.y - 8} textAnchor="middle"
          fontSize={8} fontFamily="ui-monospace,SF Mono,monospace" letterSpacing="0.10em"
          fill={statusColor} style={{ textTransform: 'uppercase', userSelect: 'none' }}>
          {room.code}
        </text>
        <text x={room.labelAt.x} y={room.labelAt.y + 6} textAnchor="middle"
          fontSize={9.5} fontFamily="-apple-system,BlinkMacSystemFont,sans-serif" fontWeight={500}
          fill="#0f172a" style={{ userSelect: 'none' }}>
          {room.short}
        </text>
        <text x={room.labelAt.x} y={room.labelAt.y + 19} textAnchor="middle"
          fontSize={7.5} fontFamily="ui-monospace,SF Mono,monospace" letterSpacing="0.08em"
          fill={statusColor} style={{ textTransform: 'uppercase', userSelect: 'none' }}>
          {STATUSES[status].sub}
        </text>
      </g>
    </g>
  )
}
