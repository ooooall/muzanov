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
  bedroom_small: '#f8fafc',
  bedroom_medium: '#f8fafc',
  living: '#f8fafc',
  kitchen: '#fffef7',
  corridor: '#f1f5f9',
  wardrobe: '#f8fafc',
  entry: '#f8fafc',
  bath: '#f0fdfa',
  wc: '#f0fdfa',
}

function getStatusFill(status: ZoneStatus): string {
  const fills: Record<ZoneStatus, string> = {
    new: 'rgba(148,163,184,0.08)',
    in_progress: 'rgba(217,119,6,0.18)',
    review: 'rgba(37,99,235,0.16)',
    done: 'rgba(5,150,105,0.14)',
  }

  return fills[status]
}

export function RoomShape({ room, state, isSelected, isFiltered, onClick }: RoomShapeProps) {
  const rawStatus = state?.status ?? 'new'
  const status: ZoneStatus = rawStatus in STATUSES ? (rawStatus as ZoneStatus) : 'new'
  const statusColor = STATUSES[status].color
  const baseFill = ROOM_BASE_FILLS[room.id] ?? '#f8fafc'
  const opacity = isFiltered ? 0.24 : 1

  const shape =
    room.shape.type === 'rect'
      ? {
          kind: 'rect' as const,
          props: { x: room.shape.x, y: room.shape.y, width: room.shape.w, height: room.shape.h, rx: 8, ry: 8 },
        }
      : room.shape.type === 'path'
        ? {
            kind: 'path' as const,
            props: { d: room.shape.d },
          }
      : {
          kind: 'polygon' as const,
          props: { points: room.shape.points },
        }

  function renderShape(extraProps: Record<string, string | number>) {
    if (shape.kind === 'rect') return <rect {...shape.props} {...extraProps} />
    if (shape.kind === 'path') return <path {...shape.props} strokeLinejoin="miter" {...extraProps} />
    return <polygon {...shape.props} strokeLinejoin="miter" {...extraProps} />
  }

  return (
    <g className="cursor-pointer" onClick={onClick} role="button" aria-label={`${room.name} — ${STATUSES[status].label}`}>
      {renderShape({ fill: baseFill, opacity })}
      {renderShape({ fill: getStatusFill(status), opacity })}

      <motion.g animate={{ opacity: isSelected ? 1 : 0.94 }} transition={{ duration: 0.15 }}>
        {renderShape({
          fill: 'none',
          stroke: isSelected ? statusColor : 'rgba(15,23,42,0.14)',
          strokeWidth: isSelected ? 2 : 1,
          opacity,
        })}
      </motion.g>

      {(status === 'in_progress' || status === 'review') && !isFiltered && (
        <motion.g animate={{ opacity: [0.2, 0.55, 0.2] }} transition={{ duration: 2.2, repeat: Infinity }}>
          {renderShape({ fill: 'none', stroke: statusColor, strokeWidth: 2.6 })}
        </motion.g>
      )}

      <g opacity={isFiltered ? 0.35 : 1}>
        <text
          x={room.labelAt.x}
          y={room.labelAt.y - 8}
          textAnchor="middle"
          fontSize={8}
          fontFamily="ui-monospace,SF Mono,monospace"
          letterSpacing="0.08em"
          fill={statusColor}
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          {room.code}
        </text>
        <text
          x={room.labelAt.x}
          y={room.labelAt.y + 6}
          textAnchor="middle"
          fontSize={9.5}
          fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
          fontWeight={600}
          fill="#0f172a"
          style={{ userSelect: 'none' }}
        >
          {room.short}
        </text>
        <text
          x={room.labelAt.x}
          y={room.labelAt.y + 19}
          textAnchor="middle"
          fontSize={7.5}
          fontFamily="ui-monospace,SF Mono,monospace"
          letterSpacing="0.08em"
          fill={statusColor}
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          {STATUSES[status].sub}
        </text>
      </g>
    </g>
  )
}
