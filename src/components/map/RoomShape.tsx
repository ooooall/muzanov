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

const BASE_FILL: Record<string, string> = {
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

const STATUS_FILL: Record<ZoneStatus, string> = {
  new:         'rgba(148,163,184,0.08)',
  in_progress: 'rgba(217,119,6,0.18)',
  review:      'rgba(37,99,235,0.16)',
  done:        'rgba(5,150,105,0.14)',
}

export function RoomShape({ room, state, isSelected, isFiltered, onClick }: RoomShapeProps) {
  const rawStatus = state?.status ?? 'new'
  const status: ZoneStatus = rawStatus in STATUSES ? (rawStatus as ZoneStatus) : 'new'
  const statusColor = STATUSES[status].color
  const baseFill   = BASE_FILL[room.id] ?? '#f8fafc'
  const opacity    = isFiltered ? 0.24 : 1

  // Build a typed shape descriptor once
  const shape =
    room.shape.type === 'rect'
      ? { kind: 'rect' as const,    props: { x: room.shape.x, y: room.shape.y, width: room.shape.w, height: room.shape.h, rx: 8, ry: 8 } }
      : room.shape.type === 'path'
        ? { kind: 'path' as const,  props: { d: room.shape.d } }
        : { kind: 'poly' as const,  props: { points: (room.shape as { type: 'polygon'; points: string }).points } }

  function renderShape(extra: React.SVGProps<SVGElement>) {
    if (shape.kind === 'rect') return <rect {...shape.props} {...(extra as React.SVGProps<SVGRectElement>)} />
    if (shape.kind === 'path') return <path {...shape.props} strokeLinejoin="round" strokeLinecap="round" {...(extra as React.SVGProps<SVGPathElement>)} />
    return <polygon {...shape.props} strokeLinejoin="miter" {...(extra as React.SVGProps<SVGPolygonElement>)} />
  }

  const clipId = `clip-${room.id}`
  const { x: lx, y: ly } = room.labelAt

  return (
    <g
      className="cursor-pointer"
      onClick={onClick}
      role="button"
      aria-label={`${room.name} — ${STATUSES[status].label}`}
    >
      {/* Clip path keeps text inside zone boundaries */}
      <defs>
        <clipPath id={clipId}>
          {renderShape({})}
        </clipPath>
      </defs>

      {/* Zone fills */}
      {renderShape({ fill: baseFill, opacity })}
      {renderShape({ fill: STATUS_FILL[status], opacity })}

      {/* Border */}
      <motion.g animate={{ opacity: isSelected ? 1 : 0.94 }} transition={{ duration: 0.15 }}>
        {renderShape({
          fill: 'none',
          stroke: isSelected ? statusColor : 'rgba(15,23,42,0.14)',
          strokeWidth: isSelected ? 2 : 1,
          opacity,
        })}
      </motion.g>

      {/* Active-status pulse */}
      {(status === 'in_progress' || status === 'review') && !isFiltered && (
        <motion.g
          animate={{ opacity: [0.2, 0.55, 0.2] }}
          transition={{ duration: 2.2, repeat: Infinity }}
        >
          {renderShape({ fill: 'none', stroke: statusColor, strokeWidth: 2.6 })}
        </motion.g>
      )}

      {/* Labels — clipped so text never overflows the zone */}
      <g clipPath={`url(#${clipId})`} opacity={isFiltered ? 0.35 : 1}>
        {/* Zone code  e.g. BR-01 */}
        <text
          x={lx} y={ly - 16}
          textAnchor="middle"
          fontSize={17}
          fontWeight={400}
          fontFamily="ui-monospace,SF Mono,monospace"
          letterSpacing="0.06em"
          fill={statusColor}
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          {room.code}
        </text>

        {/* Room short name */}
        <text
          x={lx} y={ly + 7}
          textAnchor="middle"
          fontSize={21}
          fontWeight={400}
          fontFamily="-apple-system,BlinkMacSystemFont,sans-serif"
          fill="#0f172a"
          style={{ userSelect: 'none' }}
        >
          {room.short}
        </text>

        {/* Status label  e.g. NEW */}
        <text
          x={lx} y={ly + 26}
          textAnchor="middle"
          fontSize={14}
          fontWeight={400}
          fontFamily="ui-monospace,SF Mono,monospace"
          letterSpacing="0.06em"
          fill={statusColor}
          style={{ textTransform: 'uppercase', userSelect: 'none' }}
        >
          {STATUSES[status].sub}
        </text>
      </g>
    </g>
  )
}
